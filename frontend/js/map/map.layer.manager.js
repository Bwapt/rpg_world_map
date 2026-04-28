import MapUtils from "./map.utils.js";

/**
 * Registre les layers Leaflet actifs et synchronise leur affichage apres sauvegarde.
 */
class MapLayerManager {
  /**
   * Initialise les registres de layers par type d'entite.
   */
  constructor() {
    this.poiLayers = new Map();
    this.areaLayers = new Map();
  }

  /**
   * Affiche les POI existants et garde une reference par identifiant.
   *
   * @param {L.Map} map Map Leaflet cible.
   * @param {Array<object>} pois POI renvoyes par l'API.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {Promise<void>}
   */
  async renderPois(map, pois, buildPopupContent) {
    pois.forEach((poi) => {
      const marker = MapUtils.createPoiMarker(poi).addTo(map);
      marker.data = poi;
      marker.bindPopup(buildPopupContent(poi));
      this.poiLayers.set(poi.id, marker);
    });
  }

  /**
   * Affiche les zones existantes et garde une reference par identifiant.
   *
   * @param {L.Map} map Map Leaflet cible.
   * @param {Array<object>} areas Zones renvoyees par l'API.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {Promise<void>}
   */
  async renderAreas(map, areas, buildPopupContent) {
    areas.forEach((area) => {
      const points = (area.points || []).map((point) => [point.y, point.x]);

      if (!points.length) {
        return;
      }

      const polygon = L.polygon(points, MapUtils.getAreaStyle(area)).addTo(map);
      polygon.data = area;
      polygon.bindPopup(buildPopupContent(area));
      this.areaLayers.set(area.id, polygon);
    });
  }

  /**
   * Met a jour un marker POI deja present sur la map.
   *
   * @param {string} poiId Identifiant du POI.
   * @param {object} poiData Donnees a appliquer.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {void}
   */
  updatePoiLayer(poiId, poiData, buildPopupContent) {
    const layer = this.poiLayers.get(poiId);
    if (!layer) {
      return;
    }

    layer.data = poiData;
    MapUtils.applyPoiMarkerIcon(layer, poiData.icon);
    layer.bindPopup(buildPopupContent(poiData));
  }

  /**
   * Met a jour un polygone deja present sur la map.
   *
   * @param {string} areaId Identifiant de la zone.
   * @param {object} areaData Donnees a appliquer.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {void}
   */
  updateAreaLayer(areaId, areaData, buildPopupContent) {
    const layer = this.areaLayers.get(areaId);
    if (!layer) {
      return;
    }

    layer.data = areaData;
    layer.setStyle(MapUtils.getAreaStyle(areaData));
    layer.bindPopup(buildPopupContent(areaData));
  }

  /**
   * Prepare un marker POI sans l'ajouter a la map.
   *
   * @param {object} poi Donnees du POI.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {L.Marker} Marker Leaflet.
   */
  addPoiLayer(poi, buildPopupContent) {
    const layer = MapUtils.createPoiMarker(poi);
    layer.data = poi;
    layer.bindPopup(buildPopupContent(poi));
    this.poiLayers.set(poi.id, layer);
    return layer;
  }

  /**
   * Prepare un polygone sans l'ajouter a la map.
   *
   * @param {object} area Donnees de la zone.
   * @param {(item: object) => string} buildPopupContent Fabrique de popup.
   * @returns {L.Polygon} Polygone Leaflet.
   */
  addAreaLayer(area, buildPopupContent) {
    const points = (area.points || []).map((point) => [point.y, point.x]);
    const layer = L.polygon(points, MapUtils.getAreaStyle(area));
    layer.data = area;
    layer.bindPopup(buildPopupContent(area));
    this.areaLayers.set(area.id, layer);
    return layer;
  }

  /**
   * @param {string} poiId Identifiant du POI.
   * @returns {L.Marker|undefined} Marker associe.
   */
  getPoiLayer(poiId) {
    return this.poiLayers.get(poiId);
  }

  /**
   * @param {string} areaId Identifiant de la zone.
   * @returns {L.Polygon|undefined} Polygone associe.
   */
  getAreaLayer(areaId) {
    return this.areaLayers.get(areaId);
  }

  /**
   * Vide les registres au demontage de la map.
   *
   * @returns {void}
   */
  clear() {
    this.poiLayers.clear();
    this.areaLayers.clear();
  }
}

export default MapLayerManager;
