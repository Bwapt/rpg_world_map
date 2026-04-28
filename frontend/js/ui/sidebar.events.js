/**
 * Centralise les listeners DOM de la sidebar apres chaque rendu.
 */
class SidebarEvents {
  /**
   * @param {HTMLElement} worldTree Conteneur de l'arbre du monde.
   */
  constructor(worldTree) {
    this.worldTree = worldTree;
  }

  /**
   * Branche tous les groupes d'evenements disponibles.
   *
   * @param {object} handlers Callbacks exposes par WorldApp.
   * @returns {void}
   */
  attach(handlers) {
    this.attachMapToggles(handlers.onMapToggle);
    this.attachMapSelectors(handlers.onMapSelect);
    this.attachMapDeleteButtons(handlers.onMapDelete);
    this.attachEntityVisibilityButtons(handlers.onEntityToggleVisibility);
    this.attachSectionVisibilityButtons(handlers.onSectionToggleVisibility);
    this.attachEntityButtons(handlers.onEntityClick);
  }

  /**
   * @param {(mapId: string, isOpen: boolean) => void} onMapToggle Callback details.
   * @returns {void}
   */
  attachMapToggles(onMapToggle) {
    this.worldTree.querySelectorAll("[data-map-details]").forEach((details) => {
      details.addEventListener("toggle", () => {
        onMapToggle(details.dataset.mapDetails, details.open);
      });
    });
  }

  /**
   * @param {(mapId: string) => void} onMapSelect Callback de selection.
   * @returns {void}
   */
  attachMapSelectors(onMapSelect) {
    this.worldTree.querySelectorAll("[data-map-select]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMapSelect(button.dataset.mapSelect);
      });
    });
  }

  /**
   * @param {(mapId: string) => void} onMapDelete Callback de suppression.
   * @returns {void}
   */
  attachMapDeleteButtons(onMapDelete) {
    this.worldTree.querySelectorAll("[data-map-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMapDelete(button.dataset.mapDelete);
      });
    });
  }

  /**
   * @param {(type: string, entityId: string) => void} onEntityToggleVisibility Callback de visibilite.
   * @returns {void}
   */
  attachEntityVisibilityButtons(onEntityToggleVisibility) {
    this.worldTree.querySelectorAll("[data-visibility-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onEntityToggleVisibility(button.dataset.entityType, button.dataset.entityId);
      });
    });
  }

  /**
   * @param {(type: string, mapId: string) => void} onSectionToggleVisibility Callback de section.
   * @returns {void}
   */
  attachSectionVisibilityButtons(onSectionToggleVisibility) {
    this.worldTree.querySelectorAll("[data-section-visibility]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSectionToggleVisibility(button.dataset.entityType, button.dataset.mapId);
      });
    });
  }

  /**
   * @param {(mapId: string, entityType: string, entityId: string) => void} onEntityClick Callback de focus.
   * @returns {void}
   */
  attachEntityButtons(onEntityClick) {
    this.worldTree.querySelectorAll(".world-map__entity-button[data-entity-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        onEntityClick(button.dataset.mapId, button.dataset.entityType, button.dataset.entityId);
      });
    });
  }
}

export default SidebarEvents;
