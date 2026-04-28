import initMap from "./map/map.init.js";
import MapController from "./map/map.controller.js";
import HttpClient from "./services/http.service.js";
import WorldService from "./services/world.service.js";
import PoiService from "./services/poi.service.js";
import AreaService from "./services/area.service.js";

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
    this.hiddenPois = new Set();
    this.hiddenAreas = new Set();
    this.openMapIds = new Set();
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
    this.applyVisibilityState();
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
    const maps = this.world?.maps || [];

    if (!maps.length) {
      this.worldTree.innerHTML = `<div class="world-tree__empty">Aucune map</div>`;
      return;
    }

    this.worldTree.innerHTML = maps.map((map) => this.renderMapNode(map)).join("");

    this.worldTree.querySelectorAll("[data-map-details]").forEach((details) => {
      details.addEventListener("toggle", () => {
        const mapId = details.dataset.mapDetails;

        if (details.open) {
          this.openMapIds.add(mapId);
          return;
        }

        this.openMapIds.delete(mapId);
      });
    });

    this.worldTree.querySelectorAll("[data-map-select]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const mapId = button.dataset.mapSelect;
        this.openMapIds.add(mapId);
        await this.loadWorld(mapId);
      });
    });

    this.worldTree.querySelectorAll("[data-map-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openDeleteMapModal(button.dataset.mapDelete);
      });
    });

    this.worldTree.querySelectorAll("[data-visibility-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const entityId = button.dataset.entityId;
        const entityType = button.dataset.entityType;

        this.toggleEntityVisibility(entityType, entityId);
      });
    });

    this.worldTree.querySelectorAll("[data-section-visibility]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const type = button.dataset.entityType;
        const mapId = button.dataset.mapId;
        this.toggleSectionVisibility(type, mapId);
      });
    });

    this.worldTree.querySelectorAll(".world-map__entity-button[data-entity-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const entityId = button.dataset.entityId;
        const entityType = button.dataset.entityType;
        const mapId = button.dataset.mapId;

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
      });
    });
  }

  renderMapNode(map) {
    const isActive = map.id === this.activeMapId;
    const isOpen = isActive || this.openMapIds.has(map.id);
    const poiItems = this.renderEntitySection("Points d'intérêts", "poi", map);
    const areaItems = this.renderEntitySection("Régions", "area", map);
    const label = this.escapeHTML(map.name || map.id);

    return `
      <details class="world-map" data-map-details="${map.id}" ${isOpen ? "open" : ""}>
        <summary class="world-map__header">
          <span class="world-map__chevron" aria-hidden="true"></span>
          <button
            type="button"
            class="world-map__select ${isActive ? "is-active" : ""}"
            data-map-select="${map.id}"
          >
            ${label}
          </button>
          <button
            type="button"
            class="world-map__delete"
            data-map-delete="${map.id}"
            aria-label="Supprimer ${label}"
          >
            🗑
          </button>
        </summary>
        <div class="world-map__content">
          ${poiItems}
          ${areaItems}
        </div>
      </details>
    `;
  }

  renderEntitySection(title, type, map) {
    const items = type === "poi" ? (map.pois || []) : (map.areas || []);
    const hiddenCount = items.filter((item) => this.isEntityHidden(type, item.id)).length;
    const allHidden = items.length > 0 && hiddenCount === items.length;
    const icon = allHidden ? "◌" : "●";

    return `
      <details class="world-map__section" open>
        <summary class="world-map__section-summary">
          <span class="world-map__section-title">${title}</span>
          <span class="world-map__section-tools">
            <span class="world-map__section-count">${items.length}</span>
            <button
              type="button"
              class="world-map__visibility-button"
              data-section-visibility="true"
              data-entity-type="${type}"
              data-map-id="${map.id}"
              aria-label="${allHidden ? "Afficher" : "Masquer"} ${title}"
            >${icon}</button>
          </span>
        </summary>
        ${this.renderEntityList(type, map.id, items)}
      </details>
    `;
  }

  renderEntityList(type, mapId, items) {
    if (!items.length) {
      return `<div class="world-map__empty">Aucun</div>`;
    }

    return `
      <ul class="world-map__list">
        ${items.map((item) => `
          <li>
            <div class="world-map__entity-row">
              <button
                type="button"
                class="world-map__entity-button"
                data-entity-type="${type}"
                data-entity-id="${item.id}"
                data-map-id="${mapId}"
              >
                ${this.escapeHTML(item.name || "Sans nom")}
              </button>
              <button
              type="button"
              class="world-map__visibility-button"
              data-visibility-toggle="true"
              data-entity-type="${type}"
              data-entity-id="${item.id}"
              aria-label="${this.isEntityHidden(type, item.id) ? "Afficher" : "Masquer"} ${this.escapeHTML(item.name || "Sans nom")}"
              >${this.isEntityHidden(type, item.id) ? "◌" : "●"}</button>
            </div>
          </li>
        `).join("")}
      </ul>
    `;
  }

  isEntityHidden(type, entityId) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    return set.has(entityId);
  }

  toggleEntityVisibility(type, entityId) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    const isHidden = set.has(entityId);
    const nextIsVisible = isHidden;

    if (isHidden) {
      set.delete(entityId);
    } else {
      set.add(entityId);
    }

    this.applyEntityVisibility(type, entityId, nextIsVisible);
    this.renderWorldTree();
  }

  toggleSectionVisibility(type, mapId) {
    const map = (this.world?.maps || []).find((item) => item.id === mapId);
    if (!map) {
      return;
    }

    const items = type === "poi" ? (map.pois || []) : (map.areas || []);
    const allHidden = items.length > 0 && items.every((item) => this.isEntityHidden(type, item.id));
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;

    items.forEach((item) => {
      if (allHidden) {
        set.delete(item.id);
      } else {
        set.add(item.id);
      }

      this.applyEntityVisibility(type, item.id, allHidden);
    });

    this.renderWorldTree();
  }

  applyVisibilityState() {
    this.hiddenPois.forEach((poiId) => this.mapController?.setPoiVisibility(poiId, false));
    this.hiddenAreas.forEach((areaId) => this.mapController?.setAreaVisibility(areaId, false));
  }

  applyEntityVisibility(type, entityId, isVisible) {
    if (!this.mapController) {
      return;
    }

    if (type === "poi") {
      this.mapController.setPoiVisibility(entityId, isVisible);
      return;
    }

    this.mapController.setAreaVisibility(entityId, isVisible);
  }

  openAddMapModal() {
    const content = document.createElement("div");
    content.className = "modal";
    content.innerHTML = `
      <h2>Ajouter une map</h2>
      <label>
        Nom
        <input name="name" type="text" />
      </label>
      <label>
        Image
        <input name="image" type="file" accept="image/*" />
      </label>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm" data-action="confirm">Valider</button>
      </div>
    `;

    const { close } = this.openModal(content);
    const nameInput = content.querySelector('[name="name"]');
    const imageInput = content.querySelector('[name="image"]');

    content.querySelector('[data-action="cancel"]').addEventListener("click", close);
    content.querySelector('[data-action="confirm"]').addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const image = imageInput.files[0];

      if (!name) {
        nameInput.focus();
        return;
      }

      if (!image) {
        imageInput.focus();
        return;
      }

      const response = await this.worldService.createMap({ name, image });
      close();
      this.togglePanel(true);
      await this.loadWorld(response.map.id);
    });
  }

  openDeleteMapModal(mapId) {
    const map = (this.world?.maps || []).find((item) => item.id === mapId);
    if (!map) {
      return;
    }

    const content = document.createElement("div");
    content.className = "modal";
    content.innerHTML = `
      <h2>Supprimer la map</h2>
      <p>${this.escapeHTML(map.name || map.id)}</p>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm is-danger" data-action="confirm">Supprimer</button>
      </div>
    `;

    const { close } = this.openModal(content);
    content.querySelector('[data-action="cancel"]').addEventListener("click", close);
    content.querySelector('[data-action="confirm"]').addEventListener("click", async () => {
      const maps = this.world?.maps || [];
      const nextMapId = mapId === this.activeMapId
        ? maps.find((item) => item.id !== mapId)?.id || null
        : this.activeMapId;

      await this.worldService.deleteMap(mapId);
      close();
      await this.loadWorld(nextMapId);
    });
  }

  openModal(content) {
    this.modalRoot.innerHTML = "";
    this.modalRoot.classList.add("is-open");

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.appendChild(content);
    this.modalRoot.appendChild(overlay);

    const close = () => {
      this.modalRoot.classList.remove("is-open");
      this.modalRoot.innerHTML = "";
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close();
      }
    });

    return { close };
  }

  escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}

async function init() {
  const app = new WorldApp();
  await app.init();
}

init();
