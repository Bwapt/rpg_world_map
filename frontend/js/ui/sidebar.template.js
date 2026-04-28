import HtmlUtils from "../utils/html.utils.js";

class SidebarTemplate {
  render(world, activeMapId, openMapIds, isEntityHidden) {
    const maps = world?.maps || [];

    if (!maps.length) {
      return `<div class="world-tree__empty">Aucune map</div>`;
    }

    return maps
      .map((map) => this.renderMapNode(map, activeMapId, openMapIds, isEntityHidden))
      .join("");
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
            &#128465;
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
    const icon = allHidden ? "&#9675;" : "&#9679;";

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
        ${items.map((item) => this.renderEntityItem(type, mapId, item, isEntityHidden)).join("")}
      </ul>
    `;
  }

  renderEntityItem(type, mapId, item, isEntityHidden) {
    const label = HtmlUtils.escapeHTML(item.name || "Sans nom");
    const isHidden = isEntityHidden(type, item.id);

    return `
      <li>
        <div class="world-map__entity-row">
          <button
            type="button"
            class="world-map__entity-button"
            data-entity-type="${type}"
            data-entity-id="${item.id}"
            data-map-id="${mapId}"
          >
            ${label}
          </button>
          <button
            type="button"
            class="world-map__visibility-button"
            data-visibility-toggle="true"
            data-entity-type="${type}"
            data-entity-id="${item.id}"
            aria-label="${isHidden ? "Afficher" : "Masquer"} ${label}"
          >${isHidden ? "&#9675;" : "&#9679;"}</button>
        </div>
      </li>
    `;
  }
}

export default SidebarTemplate;
