import initMap from "../map/map.init.js";
import MapController from "../map/map.controller.js";
import HttpClient from "../services/http.service.js";
import WorldService from "../services/world.service.js";
import PoiService from "../services/poi.service.js";
import AreaService from "../services/area.service.js";
import ModalManager from "../ui/modal.manager.js";
import VisibilityManager from "../ui/visibility.manager.js";
import SidebarRenderer from "../ui/sidebar.renderer.js";
import PageZoomGuard from "./page-zoom.guard.js";

const WORLD_SYNC_INTERVAL_MS = 60000;

/**
 * Application principale: charge le monde, monte la map active et coordonne l'UI.
 */
class WorldApp {
  /**
   * Cree les services, recupere les points d'ancrage DOM et initialise l'etat local.
   */
  constructor() {
    const http = new HttpClient();

    this.worldService = new WorldService(http);
    this.poiService = new PoiService(http);
    this.areaService = new AreaService(http);

    this.menuToggle = document.querySelector("#menu-toggle");
    this.fullscreenToggle = document.querySelector("#fullscreen-toggle");
    this.worldPanel = document.querySelector("#world-panel");
    this.worldTree = document.querySelector("#world-tree");
    this.addMapButton = document.querySelector("#add-map-button");
    this.modalRoot = document.querySelector("#modal-root");
    this.currentMapTitle = document.querySelector("#current-map-title");
    this.mapLoading = document.querySelector("#map-loading");

    this.world = null;
    this.activeMapId = null;
    this.mapController = null;
    this.isPanelOpen = false;
    this.openMapIds = new Set();
    this.worldSyncTimer = null;
    this.isSyncingWorld = false;
    this.lastActiveMapSignature = null;
    this.eventSource = null;

    this.pageZoomGuard = new PageZoomGuard();
    this.visibilityManager = new VisibilityManager();
    this.modalManager = new ModalManager(this.modalRoot);
    this.sidebarRenderer = new SidebarRenderer(this.worldTree);
  }

  /**
   * Branche l'UI puis charge le monde initial.
   *
   * @returns {Promise<void>}
   */
  async init() {
    this.bindUI();
    await this.loadWorld();
    this.startRealtimeSync();
    this.startWorldSync();
  }

  /**
   * Branche les interactions globales hors carte.
   *
   * @returns {void}
   */
  bindUI() {
    this.pageZoomGuard.attach();

    this.menuToggle.addEventListener("click", () => {
      this.togglePanel(!this.isPanelOpen);
    });

    this.addMapButton.addEventListener("click", () => {
      this.openAddMapModal();
    });

    if (!document.fullscreenEnabled) {
      this.fullscreenToggle.hidden = true;
      return;
    }

    this.fullscreenToggle.addEventListener("click", () => {
      this.toggleFullscreen();
    });

    document.addEventListener("fullscreenchange", () => {
      this.updateFullscreenButton();
      window.setTimeout(() => {
        this.mapController?.map.invalidateSize();
      }, 80);
    });
  }

  /**
   * Active ou quitte le mode plein ecran navigateur.
   *
   * @returns {Promise<void>}
   */
  async toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }

  /**
   * Synchronise le bouton avec l'etat plein ecran courant.
   *
   * @returns {void}
   */
  updateFullscreenButton() {
    const isFullscreen = Boolean(document.fullscreenElement);
    this.fullscreenToggle.classList.toggle("is-active", isFullscreen);
    this.fullscreenToggle.setAttribute(
      "aria-label",
      isFullscreen ? "Quitter le plein ecran" : "Passer en plein ecran"
    );
    this.fullscreenToggle.setAttribute(
      "title",
      isFullscreen ? "Quitter le plein ecran" : "Passer en plein ecran"
    );
  }

  /**
   * Recharge le monde et selectionne la map demandee, ou la premiere disponible.
   *
   * @param {string|null} [selectedMapId] Map a selectionner apres chargement.
   * @returns {Promise<void>}
   */
  async loadWorld(selectedMapId = this.activeMapId) {
    this.world = await this.worldService.getWorld();

    const maps = this.world.maps || [];
    const nextMap = maps.find((map) => map.id === selectedMapId) || maps[0] || null;
    const nextMapId = nextMap?.id || null;
    const needsRemount = !this.mapController || nextMapId !== this.activeMapId;

    this.activeMapId = nextMapId;
    if (nextMapId) {
      this.openMapIds.add(nextMapId);
    }
    this.renderCurrentMapTitle(nextMap);
    this.renderWorldTree();

    if (!nextMapId) {
      this.destroyMap();
      return;
    }

    if (needsRemount) {
      await this.mountMap(nextMap);
    }

    this.lastActiveMapSignature = this.getMapSignature(nextMap);
  }

  /**
   * Monte une nouvelle instance Leaflet pour la map selectionnee.
   *
   * @param {object} mapData Donnees de la map active.
   * @returns {Promise<void>}
   */
  async mountMap(mapData) {
    this.destroyMap();
    this.updateMapLoading({ isVisible: true, percent: 0 });

    try {
      const map = await initMap("map", mapData.image, (progress) => {
        this.updateMapLoading({
          isVisible: true,
          percent: progress.percent
        });
      });
      this.mapController = new MapController(
        map,
        mapData.id,
        this.poiService,
        this.areaService,
        {
          onChange: () => this.refreshSidebar()
        }
      );

      await this.mapController.init();
      this.visibilityManager.applyVisibilityState(this.mapController);
    } finally {
      this.updateMapLoading({ isVisible: false, percent: 100 });
    }
  }

  /**
   * Met a jour l'overlay de chargement de l'image de map.
   *
   * @param {{isVisible: boolean, percent: number|null}} state Etat d'affichage.
   * @returns {void}
   */
  updateMapLoading({ isVisible, percent }) {
    if (!this.mapLoading) {
      return;
    }

    const label = this.mapLoading.querySelector("[data-map-loading-label]");
    const bar = this.mapLoading.querySelector("[data-map-loading-bar]");

    this.mapLoading.classList.toggle("is-visible", isVisible);
    this.mapLoading.setAttribute("aria-hidden", String(!isVisible));

    if (typeof percent === "number") {
      this.mapLoading.classList.remove("is-indeterminate");
      label.textContent = `${percent}%`;
      bar.style.width = `${percent}%`;
      return;
    }

    this.mapLoading.classList.add("is-indeterminate");
    label.textContent = "Chargement";
    bar.style.width = "";
  }

  /**
   * Detruit la map active si elle existe.
   *
   * @returns {void}
   */
  destroyMap() {
    if (!this.mapController) {
      return;
    }

    this.mapController.destroy();
    this.mapController = null;
  }

  /**
   * Met a jour le titre flottant de la map active.
   *
   * @param {object|null} mapData Donnees de la map active.
   * @returns {void}
   */
  renderCurrentMapTitle(mapData) {
    if (!mapData) {
      this.currentMapTitle.textContent = "Aucune map";
      return;
    }

    this.currentMapTitle.textContent = mapData.name || mapData.id;
  }

  /**
   * Recharge les donnees de sidebar sans remonter la map.
   *
   * @returns {Promise<void>}
   */
  async refreshSidebar() {
    const selectedMapId = this.activeMapId;
    this.world = await this.worldService.getWorld();
    this.activeMapId = selectedMapId;
    this.renderWorldTree();
    this.lastActiveMapSignature = this.getMapSignature(this.getActiveMap());
  }

  /**
   * Lance la synchronisation periodique avec les modifications faites par d'autres clients.
   *
   * @returns {void}
   */
  startWorldSync() {
    if (this.worldSyncTimer) {
      return;
    }

    this.worldSyncTimer = window.setInterval(() => {
      this.syncWorldFromServer();
    }, WORLD_SYNC_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.syncWorldFromServer();
      }
    });
  }

  /**
   * Ouvre le flux temps reel des modifications faites par les autres clients.
   *
   * @returns {void}
   */
  startRealtimeSync() {
    if (this.eventSource || !window.EventSource) {
      return;
    }

    const eventsURL = `${HttpClient.getDefaultBaseURL()}/events`;
    this.eventSource = new EventSource(eventsURL);

    [
      "poi:created",
      "poi:updated",
      "poi:deleted",
      "area:created",
      "area:updated",
      "area:deleted"
    ].forEach((eventType) => {
      this.eventSource.addEventListener(eventType, (event) => {
        this.handleRemoteWorldEvent(event);
      });
    });
  }

  /**
   * Applique un evenement serveur a la map active.
   *
   * @param {MessageEvent} message EventSource message.
   * @returns {Promise<void>}
   */
  async handleRemoteWorldEvent(message) {
    if (!this.mapController) {
      return;
    }

    try {
      const event = JSON.parse(message.data);
      const changedActiveMap = this.mapController.applyRemoteChange(event);
      if (!changedActiveMap) {
        return;
      }

      await this.refreshSidebar();
    } catch (error) {
      console.warn("Evenement temps reel ignore", error);
    }
  }

  /**
   * Recharge le monde en arriere-plan et remonte la map active si ses entites ont change.
   *
   * @returns {Promise<void>}
   */
  async syncWorldFromServer() {
    if (this.isSyncingWorld || !this.world) {
      return;
    }

    this.isSyncingWorld = true;

    try {
      const nextWorld = await this.worldService.getWorld();
      const nextMaps = nextWorld.maps || [];
      const previousMapId = this.activeMapId;
      const nextMap = nextMaps.find((map) => map.id === previousMapId) || nextMaps[0] || null;
      const nextMapId = nextMap?.id || null;
      const nextSignature = this.getMapSignature(nextMap);
      const currentSignature = this.lastActiveMapSignature;

      this.world = nextWorld;
      this.activeMapId = nextMapId;
      if (nextMapId) {
        this.openMapIds.add(nextMapId);
      }

      this.renderCurrentMapTitle(nextMap);
      this.renderWorldTree();

      if (!nextMapId) {
        this.destroyMap();
        this.lastActiveMapSignature = null;
        return;
      }

      if (nextMapId !== previousMapId || nextSignature !== currentSignature) {
        await this.mountMap(nextMap);
        this.lastActiveMapSignature = nextSignature;
      }
    } catch (error) {
      console.warn("Synchronisation du monde impossible", error);
    } finally {
      this.isSyncingWorld = false;
    }
  }

  /**
   * Retourne la map active depuis l'etat courant.
   *
   * @returns {object|null} Map active.
   */
  getActiveMap() {
    return (this.world?.maps || []).find((map) => map.id === this.activeMapId) || null;
  }

  /**
   * Produit une signature stable des donnees visibles d'une map.
   *
   * @param {object|null} mapData Donnees de map.
   * @returns {string|null} Signature comparable.
   */
  getMapSignature(mapData) {
    if (!mapData) {
      return null;
    }

    const normalizePoi = (poi) => ({
      id: poi.id,
      name: poi.name,
      description: poi.description,
      icon: poi.icon,
      x: poi.x,
      y: poi.y
    });

    const normalizeArea = (area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      color: area.color,
      points: area.points || []
    });

    return JSON.stringify({
      id: mapData.id,
      name: mapData.name,
      image: mapData.image,
      pois: (mapData.pois || []).map(normalizePoi).sort((a, b) => String(a.id).localeCompare(String(b.id))),
      areas: (mapData.areas || []).map(normalizeArea).sort((a, b) => String(a.id).localeCompare(String(b.id)))
    });
  }

  /**
   * Ouvre ou ferme le panneau lateral.
   *
   * @param {boolean} isOpen Etat cible du panneau.
   * @returns {void}
   */
  togglePanel(isOpen) {
    this.isPanelOpen = isOpen;
    document.body.classList.toggle("panel-open", isOpen);
    this.menuToggle.setAttribute("aria-expanded", String(isOpen));
    this.worldPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  /**
   * Redessine l'arbre lateral avec ses callbacks.
   *
   * @returns {void}
   */
  renderWorldTree() {
    this.sidebarRenderer.render(
      this.world,
      {
        onMapToggle: (mapId, isOpen) => this.onMapToggle(mapId, isOpen),
        onMapSelect: (mapId) => this.loadWorld(mapId),
        onMapDelete: (mapId) => this.openDeleteMapModal(mapId),
        onEntityToggleVisibility: (type, entityId) => this.onEntityToggleVisibility(type, entityId),
        onSectionToggleVisibility: (type, mapId) => this.onSectionToggleVisibility(type, mapId),
        onEntityClick: (mapId, entityType, entityId) => this.onEntityClick(mapId, entityType, entityId),
        isEntityHidden: (type, entityId) => this.visibilityManager.isEntityHidden(type, entityId)
      },
      this.activeMapId,
      this.openMapIds
    );
  }

  /**
   * Memorise l'etat d'ouverture d'une map dans la sidebar.
   *
   * @param {string} mapId Identifiant de la map.
   * @param {boolean} isOpen Etat d'ouverture.
   * @returns {void}
   */
  onMapToggle(mapId, isOpen) {
    if (isOpen) {
      this.openMapIds.add(mapId);
    } else {
      this.openMapIds.delete(mapId);
    }
  }

  /**
   * Inverse la visibilite d'une entite precise.
   *
   * @param {"poi"|"area"} type Type d'entite.
   * @param {string} entityId Identifiant de l'entite.
   * @returns {void}
   */
  onEntityToggleVisibility(type, entityId) {
    this.visibilityManager.toggleEntityVisibility(type, entityId);
    const isVisible = !this.visibilityManager.isEntityHidden(type, entityId);
    this.visibilityManager.applyEntityVisibility(this.mapController, type, entityId, isVisible);
    this.renderWorldTree();
  }

  /**
   * Inverse la visibilite d'une section complete de la sidebar.
   *
   * @param {"poi"|"area"} type Type de section.
   * @param {string} mapId Identifiant de la map parente.
   * @returns {void}
   */
  onSectionToggleVisibility(type, mapId) {
    const map = (this.world?.maps || []).find((item) => item.id === mapId);
    if (!map) {
      return;
    }

    const items = type === "poi" ? (map.pois || []) : (map.areas || []);
    const wasAllHidden = this.visibilityManager.toggleSectionVisibility(type, items);

    items.forEach((item) => {
      const isVisible = wasAllHidden;
      this.visibilityManager.applyEntityVisibility(this.mapController, type, item.id, isVisible);
    });

    this.renderWorldTree();
  }

  /**
   * Selectionne si besoin la map de l'entite, puis centre la carte dessus.
   *
   * @param {string} mapId Identifiant de la map parente.
   * @param {"poi"|"area"} entityType Type d'entite.
   * @param {string} entityId Identifiant de l'entite.
   * @returns {Promise<void>}
   */
  async onEntityClick(mapId, entityType, entityId) {
    if (mapId && mapId !== this.activeMapId) {
      await this.loadWorld(mapId);
    }

    if (!this.mapController) {
      return;
    }

    if (entityType === "poi") {
      this.mapController.focusPoi(entityId);
      return;
    }

    if (entityType === "area") {
      this.mapController.focusArea(entityId);
    }
  }

  /**
   * Ouvre la modale d'ajout de map.
   *
   * @returns {void}
   */
  openAddMapModal() {
    this.modalManager.openAddMapModal(async (data, onProgress) => {
      const response = await this.worldService.createMap(data, onProgress);
      window.setTimeout(async () => {
        this.togglePanel(true);
        await this.loadWorld(response.map.id);
      }, 0);
    });
  }

  /**
   * Ouvre la modale de suppression d'une map.
   *
   * @param {string} mapId Identifiant de la map.
   * @returns {void}
   */
  openDeleteMapModal(mapId) {
    const map = (this.world?.maps || []).find((item) => item.id === mapId);
    if (!map) {
      return;
    }

    this.modalManager.openDeleteMapModal(map, async () => {
      const maps = this.world?.maps || [];
      const nextMapId = mapId === this.activeMapId
        ? maps.find((item) => item.id !== mapId)?.id || null
        : this.activeMapId;

      await this.worldService.deleteMap(mapId);
      await this.loadWorld(nextMapId);
    });
  }
}

export default WorldApp;
