import initMap from "./map/map.init.js";
import MapController from "./map/map.controller.js";
import HttpClient from "./services/http.service.js";
import WorldService from "./services/world.service.js";
import PoiService from "./services/poi.service.js";
import AreaService from "./services/area.service.js";
import ModalManager from "./ui/modal.manager.js";
import VisibilityManager from "./ui/visibility.manager.js";
import SidebarRenderer from "./ui/sidebar.renderer.js";

class WorldApp {
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

    this.visibilityManager = new VisibilityManager();
    this.modalManager = new ModalManager(this.modalRoot);
    this.sidebarRenderer = new SidebarRenderer(this.worldTree);
  }

  async init() {
    this.bindUI();
    await this.loadWorld();
  }

  bindUI() {
    this.preventPageZoom();

    this.menuToggle.addEventListener("click", () => {
      this.togglePanel(!this.isPanelOpen);
    });

    this.addMapButton.addEventListener("click", () => {
      this.openAddMapModal();
    });
  }

  preventPageZoom() {
    document.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (this.isMapEventTarget(event.target)) {
        return;
      }

      event.preventDefault();
    }, { capture: true, passive: false });

    document.addEventListener("gesturestart", (event) => {
      if (!this.isMapEventTarget(event.target)) {
        event.preventDefault();
      }
    }, { capture: true });

    document.addEventListener("keydown", (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const isBrowserZoomShortcut = ["+", "-", "=", "0"].includes(key);

      if (isBrowserZoomShortcut) {
        event.preventDefault();
      }
    });
  }

  isMapEventTarget(target) {
    return target instanceof Element && Boolean(target.closest("#map"));
  }

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

  async mountMap(mapData) {
    this.destroyMap();

    const map = await initMap("map", mapData.image);
    this.mapController = new MapController(
      map,
      mapData.id,
      this.poiService,
      this.areaService,
      { onChange: () => this.refreshSidebar() }
    );

    await this.mapController.init();
    this.visibilityManager.applyVisibilityState(this.mapController);
  }

  destroyMap() {
    if (!this.mapController) {
      return;
    }

    this.mapController.destroy();
    this.mapController = null;
  }

  renderCurrentMapTitle(mapData) {
    if (!mapData) {
      this.currentMapTitle.textContent = "Aucune map";
      return;
    }

    this.currentMapTitle.textContent = mapData.name || mapData.id;
  }

  async refreshSidebar() {
    const selectedMapId = this.activeMapId;
    this.world = await this.worldService.getWorld();
    this.activeMapId = selectedMapId;
    this.renderWorldTree();
  }

  togglePanel(isOpen) {
    this.isPanelOpen = isOpen;
    document.body.classList.toggle("panel-open", isOpen);
    this.menuToggle.setAttribute("aria-expanded", String(isOpen));
    this.worldPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  renderWorldTree() {
    this.sidebarRenderer.render(
      this.world,
      this.mapController,
      (mapId, isOpen) => this.onMapToggle(mapId, isOpen),
      (mapId) => this.openDeleteMapModal(mapId),
      (type, entityId) => this.onEntityToggleVisibility(type, entityId),
      (type, mapId) => this.onSectionToggleVisibility(type, mapId),
      (mapId, entityType, entityId) => this.onEntityClick(mapId, entityType, entityId),
      (type, entityId) => this.visibilityManager.isEntityHidden(type, entityId),
      this.activeMapId,
      this.openMapIds
    );
  }

  onMapToggle(mapId, isOpen) {
    if (isOpen) {
      this.openMapIds.add(mapId);
    } else {
      this.openMapIds.delete(mapId);
    }
  }

  onEntityToggleVisibility(type, entityId) {
    this.visibilityManager.toggleEntityVisibility(type, entityId);
    const isVisible = !this.visibilityManager.isEntityHidden(type, entityId);
    this.visibilityManager.applyEntityVisibility(this.mapController, type, entityId, isVisible);
    this.renderWorldTree();
  }

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

  openAddMapModal() {
    this.modalManager.openAddMapModal(async (data) => {
      const response = await this.worldService.createMap(data);
      this.togglePanel(true);
      await this.loadWorld(response.map.id);
    });
  }

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

async function init() {
  const app = new WorldApp();
  await app.init();
}

init();
