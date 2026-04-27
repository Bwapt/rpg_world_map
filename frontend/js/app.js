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

    this.world = null;
    this.activeMapId = null;
    this.mapController = null;
    this.isPanelOpen = false;
  }

  async init() {
    this.bindUI();
    await this.loadWorld();
  }

  bindUI() {
    this.menuToggle.addEventListener("click", () => {
      this.togglePanel(!this.isPanelOpen);
    });

    this.addMapButton.addEventListener("click", () => {
      this.openAddMapModal();
    });
  }

  async loadWorld(selectedMapId = this.activeMapId) {
    this.world = await this.worldService.getWorld();

    const maps = this.world.maps || [];
    const nextMap = maps.find((map) => map.id === selectedMapId) || maps[0] || null;
    const nextMapId = nextMap?.id || null;
    const needsRemount = !this.mapController || nextMapId !== this.activeMapId;

    this.activeMapId = nextMapId;
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
  }

  destroyMap() {
    if (!this.mapController) {
      return;
    }

    this.mapController.destroy();
    this.mapController = null;
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

    this.worldTree.querySelectorAll("[data-map-select]").forEach((button) => {
      button.addEventListener("click", async () => {
        const mapId = button.dataset.mapSelect;
        await this.loadWorld(mapId);
      });
    });

    this.worldTree.querySelectorAll("[data-map-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openDeleteMapModal(button.dataset.mapDelete);
      });
    });

    this.worldTree.querySelectorAll("[data-entity-id]").forEach((button) => {
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
    const poiItems = this.renderEntitySection("Points d'interets", "poi", map);
    const areaItems = this.renderEntitySection("Regions", "area", map);
    const label = this.escapeHTML(map.name || map.id);

    return `
      <section class="world-map">
        <div class="world-map__header">
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
        </div>
        <div class="world-map__content">
          ${poiItems}
          ${areaItems}
        </div>
      </section>
    `;
  }

  renderEntitySection(title, type, map) {
    const items = type === "poi" ? (map.pois || []) : (map.areas || []);

    return `
      <details class="world-map__section">
        <summary class="world-map__section-summary">
          <span class="world-map__section-title">${title}</span>
          <span class="world-map__section-count">${items.length}</span>
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
            <button
              type="button"
              class="world-map__entity-button"
              data-entity-type="${type}"
              data-entity-id="${item.id}"
              data-map-id="${mapId}"
            >
              ${this.escapeHTML(item.name || "Sans nom")}
            </button>
          </li>
        `).join("")}
      </ul>
    `;
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
