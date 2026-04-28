import SidebarEvents from "./sidebar.events.js";
import SidebarTemplate from "./sidebar.template.js";

class SidebarRenderer {
  constructor(worldTree) {
    this.worldTree = worldTree;
    this.events = new SidebarEvents(worldTree);
    this.template = new SidebarTemplate();
  }

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
