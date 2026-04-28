class SidebarEvents {
  constructor(worldTree) {
    this.worldTree = worldTree;
  }

  attach(handlers) {
    this.attachMapToggles(handlers.onMapToggle);
    this.attachMapSelectors(handlers.onMapSelect);
    this.attachMapDeleteButtons(handlers.onMapDelete);
    this.attachEntityVisibilityButtons(handlers.onEntityToggleVisibility);
    this.attachSectionVisibilityButtons(handlers.onSectionToggleVisibility);
    this.attachEntityButtons(handlers.onEntityClick);
  }

  attachMapToggles(onMapToggle) {
    this.worldTree.querySelectorAll("[data-map-details]").forEach((details) => {
      details.addEventListener("toggle", () => {
        onMapToggle(details.dataset.mapDetails, details.open);
      });
    });
  }

  attachMapSelectors(onMapSelect) {
    this.worldTree.querySelectorAll("[data-map-select]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMapSelect(button.dataset.mapSelect);
      });
    });
  }

  attachMapDeleteButtons(onMapDelete) {
    this.worldTree.querySelectorAll("[data-map-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMapDelete(button.dataset.mapDelete);
      });
    });
  }

  attachEntityVisibilityButtons(onEntityToggleVisibility) {
    this.worldTree.querySelectorAll("[data-visibility-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onEntityToggleVisibility(button.dataset.entityType, button.dataset.entityId);
      });
    });
  }

  attachSectionVisibilityButtons(onSectionToggleVisibility) {
    this.worldTree.querySelectorAll("[data-section-visibility]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSectionToggleVisibility(button.dataset.entityType, button.dataset.mapId);
      });
    });
  }

  attachEntityButtons(onEntityClick) {
    this.worldTree.querySelectorAll(".world-map__entity-button[data-entity-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        onEntityClick(button.dataset.mapId, button.dataset.entityType, button.dataset.entityId);
      });
    });
  }
}

export default SidebarEvents;
