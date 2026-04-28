import HtmlUtils from "../utils/html.utils.js";

class SidebarRenderer {
  constructor(worldTree) {
    this.worldTree = worldTree;
  }

  render(world, mapController, onMapSelect, onMapDelete, onEntityToggleVisibility, onSectionToggleVisibility, onEntityClick, isEntityHidden, activeMapId, openMapIds) {
    const maps = world?.maps || [];

    if (!maps.length) {
      this.worldTree.innerHTML = `<div class="world-tree__empty">Aucune map</div>`;
      return;
    }

    this.worldTree.innerHTML = maps.map((map) => this.renderMapNode(map, activeMapId, openMapIds, isEntityHidden)).join("");
    this.attachEventListeners(onMapSelect, onMapDelete, onEntityToggleVisibility, onSectionToggleVisibility, onEntityClick);
  }

  renderMapNode(map, activeMapId, openMapIds, isEntityHidden) {
    const isActive = map.id === activeMapId;
    const isOpen = isActive || openMapIds.has(map.id);
    const poiItems = this.renderEntitySection("Points d'intérêts", "poi", map, isEntityHidden);
    const areaItems = this.renderEntitySection("Régions", "area", map, isEntityHidden);
    const label = HtmlUtils.escapeHTML(map.name || map.id);

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

  renderEntitySection(title, type, map, isEntityHidden) {
    const items = type === "poi" ? (map.pois || []) : (map.areas || []);
    const hiddenCount = items.filter((item) => isEntityHidden(type, item.id)).length;
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
        ${this.renderEntityList(type, map.id, items, isEntityHidden)}
      </details>
    `;
  }

  renderEntityList(type, mapId, items, isEntityHidden) {
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
                ${HtmlUtils.escapeHTML(item.name || "Sans nom")}
              </button>
              <button
              type="button"
              class="world-map__visibility-button"
              data-visibility-toggle="true"
              data-entity-type="${type}"
              data-entity-id="${item.id}"
              aria-label="${isEntityHidden(type, item.id) ? "Afficher" : "Masquer"} ${HtmlUtils.escapeHTML(item.name || "Sans nom")}"
              >${isEntityHidden(type, item.id) ? "◌" : "●"}</button>
            </div>
          </li>
        `).join("")}
      </ul>
    `;
  }

  attachEventListeners(onMapSelect, onMapDelete, onEntityToggleVisibility, onSectionToggleVisibility, onEntityClick) {
    this.worldTree.querySelectorAll("[data-map-details]").forEach((details) => {
      details.addEventListener("toggle", () => {
        const mapId = details.dataset.mapDetails;
        onMapSelect(mapId, details.open);
      });
    });

    this.worldTree.querySelectorAll("[data-map-select]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const mapId = button.dataset.mapSelect;
        onMapSelect(mapId, true);
      });
    });

    this.worldTree.querySelectorAll("[data-map-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMapDelete(button.dataset.mapDelete);
      });
    });

    this.worldTree.querySelectorAll("[data-visibility-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const entityId = button.dataset.entityId;
        const entityType = button.dataset.entityType;
        onEntityToggleVisibility(entityType, entityId);
      });
    });

    this.worldTree.querySelectorAll("[data-section-visibility]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const type = button.dataset.entityType;
        const mapId = button.dataset.mapId;
        onSectionToggleVisibility(type, mapId);
      });
    });

    this.worldTree.querySelectorAll(".world-map__entity-button[data-entity-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const entityId = button.dataset.entityId;
        const entityType = button.dataset.entityType;
        const mapId = button.dataset.mapId;
        onEntityClick(mapId, entityType, entityId);
      });
    });
  }
}

export default SidebarRenderer;
