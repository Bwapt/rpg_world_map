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
    this.worldPanel = document.querySelector("#world-panel");
    this.worldTree = document.querySelector("#world-tree");
    this.addMapButton = document.querySelector("#add-map-button");
    this.modalRoot = document.querySelector("#modal-root");
    this.currentMapTitle = document.querySelector("#current-map-title");

    this.world = null;
    this.activeMapId = null;
    this.mapController = null;
    this.isPanelOpen = false;
    this.openMapIds = new Set();

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
  }

  /**
   * Monte une nouvelle instance Leaflet pour la map selectionnee.
   *
   * @param {object} mapData Donnees de la map active.
   * @returns {Promise<void>}
   */
  async mountMap(mapData) {
    this.destroyMap();

    const map = await initMap("map", mapData.image);
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
    this.modalManager.openAddMapModal(async (data) => {
      const response = await this.worldService.createMap(data);
      this.togglePanel(true);
      await this.loadWorld(response.map.id);
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
