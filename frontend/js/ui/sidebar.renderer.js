import SidebarEvents from "./sidebar.events.js";
import SidebarTemplate from "./sidebar.template.js";

/**
 * Assemble le rendu HTML de la sidebar et le branchement des evenements.
 */
class SidebarRenderer {
  /**
   * @param {HTMLElement} worldTree Conteneur de l'arbre du monde.
   */
  constructor(worldTree) {
    this.worldTree = worldTree;
    this.events = new SidebarEvents(worldTree);
    this.template = new SidebarTemplate();
  }

  /**
   * Redessine la sidebar et reconnecte les callbacks.
   *
   * @param {object} world Monde courant.
   * @param {object} handlers Callbacks exposes par WorldApp.
   * @param {string|null} activeMapId Map active.
   * @param {Set<string>} openMapIds Maps ouvertes dans la sidebar.
   * @returns {void}
   */
  render(world, handlers, activeMapId, openMapIds) {
    this.worldTree.innerHTML = this.template.render(
      world,
      activeMapId,
      openMapIds,
      handlers.isEntityHidden
    );

    this.events.attach(handlers);
  }
}

export default SidebarRenderer;
