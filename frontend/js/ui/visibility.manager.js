class VisibilityManager {
  constructor() {
    this.hiddenPois = new Set();
    this.hiddenAreas = new Set();
  }

  isEntityHidden(type, entityId) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    return set.has(entityId);
  }

  toggleEntityVisibility(type, entityId) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    const isHidden = set.has(entityId);

    if (isHidden) {
      set.delete(entityId);
    } else {
      set.add(entityId);
    }

    return isHidden;
  }

  toggleSectionVisibility(type, entities) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    const allHidden = entities.length > 0 && entities.every((item) => set.has(item.id));

    entities.forEach((item) => {
      if (allHidden) {
        set.delete(item.id);
      } else {
        set.add(item.id);
      }
    });

    return allHidden;
  }

  applyVisibilityState(mapController) {
    this.hiddenPois.forEach((poiId) => mapController?.setPoiVisibility(poiId, false));
    this.hiddenAreas.forEach((areaId) => mapController?.setAreaVisibility(areaId, false));
  }

  applyEntityVisibility(mapController, type, entityId, isVisible) {
    if (!mapController) {
      return;
    }

    if (type === "poi") {
      mapController.setPoiVisibility(entityId, isVisible);
      return;
    }

    mapController.setAreaVisibility(entityId, isVisible);
  }
}

export default VisibilityManager;
