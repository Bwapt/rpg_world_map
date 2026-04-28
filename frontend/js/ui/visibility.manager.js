/**
 * Stocke la visibilite locale des POI et zones pour la session courante.
 */
class VisibilityManager {
  /**
   * Initialise les registres d'entites masquees.
   */
  constructor() {
    this.hiddenPois = new Set();
    this.hiddenAreas = new Set();
  }

  /**
   * @param {"poi"|"area"} type Type d'entite.
   * @param {string} entityId Identifiant de l'entite.
   * @returns {boolean} True si l'entite est masquee.
   */
  isEntityHidden(type, entityId) {
    const set = type === "poi" ? this.hiddenPois : this.hiddenAreas;
    return set.has(entityId);
  }

  /**
   * Inverse la visibilite memorisee d'une entite.
   *
   * @param {"poi"|"area"} type Type d'entite.
   * @param {string} entityId Identifiant de l'entite.
   * @returns {boolean} True si l'entite etait masquee avant l'appel.
   */
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

  /**
   * Inverse la visibilite d'un groupe complet.
   *
   * @param {"poi"|"area"} type Type d'entites.
   * @param {Array<object>} entities Entites de la section.
   * @returns {boolean} True si toutes les entites etaient masquees avant l'appel.
   */
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

  /**
   * Reapplique l'etat local apres remontage d'une map.
   *
   * @param {MapController|null} mapController Controller de map actif.
   * @returns {void}
   */
  applyVisibilityState(mapController) {
    this.hiddenPois.forEach((poiId) => mapController?.setPoiVisibility(poiId, false));
    this.hiddenAreas.forEach((areaId) => mapController?.setAreaVisibility(areaId, false));
  }

  /**
   * Applique immediatement une visibilite sur le controller actif.
   *
   * @param {MapController|null} mapController Controller de map actif.
   * @param {"poi"|"area"} type Type d'entite.
   * @param {string} entityId Identifiant de l'entite.
   * @param {boolean} isVisible Etat cible.
   * @returns {void}
   */
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
