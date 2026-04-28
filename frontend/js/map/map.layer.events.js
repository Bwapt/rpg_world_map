import MapUtils from "./map.utils.js";

/**
 * Branche les interactions Leaflet/Geoman des layers deja presents sur la map.
 */
class MapLayerEvents {
  /**
   * @param {MapLayerManager} layerManager Registre des layers actifs.
   * @param {PoiService} poiService Service des POI.
   * @param {AreaService} areaService Service des zones.
   * @param {object} callbacks Points d'entree vers le controller.
   */
  constructor(layerManager, poiService, areaService, callbacks) {
    this.layerManager = layerManager;
    this.poiService = poiService;
    this.areaService = areaService;
    this.callbacks = callbacks;
  }

  /**
   * Branche tous les layers actuellement connus par le manager.
   *
   * @returns {void}
   */
  bindAll() {
    this.layerManager.poiLayers.forEach((layer) => {
      this.bindPoiLayerEvents(layer);
    });

    this.layerManager.areaLayers.forEach((layer) => {
      this.bindAreaLayerEvents(layer);
    });
  }

  /**
   * Branche edition, suppression et ouverture de formulaire pour un POI.
   *
   * @param {L.Marker} layer Marker Leaflet.
   * @returns {void}
   */
  bindPoiLayerEvents(layer) {
    layer.on("dblclick", () => {
      this.callbacks.openPoiForm(layer, layer.data);
    });

    layer.on("pm:dragend", async () => {
      if (!layer.data?.id) {
        return;
      }

      const { lat, lng } = layer.getLatLng();
      const response = await this.poiService.update(layer.data.id, {
        x: lng,
        y: lat
      });

      layer.data = response.poi;
      MapUtils.applyPoiMarkerIcon(layer, layer.data.icon);
      this.layerManager.poiLayers.set(layer.data.id, layer);
      layer.bindPopup(this.callbacks.buildPopupContent(layer.data));
      this.callbacks.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.layerManager.poiLayers.delete(layer.data.id);
      await this.poiService.delete(layer.data.id);
      this.callbacks.notifyChange();
    });
  }

  /**
   * Branche edition, suppression et ouverture de formulaire pour une zone.
   *
   * @param {L.Polygon} layer Polygone Leaflet.
   * @returns {void}
   */
  bindAreaLayerEvents(layer) {
    layer.on("dblclick", () => {
      this.callbacks.openAreaForm(layer, layer.data);
    });

    layer.on("pm:edit", async () => {
      if (!layer.data?.id) {
        return;
      }

      const response = await this.areaService.update(layer.data.id, {
        points: MapUtils.getPolygonPoints(layer)
      });

      layer.data = response.area;
      layer.setStyle(MapUtils.getAreaStyle(layer.data));
      this.layerManager.areaLayers.set(layer.data.id, layer);
      layer.bindPopup(this.callbacks.buildPopupContent(layer.data));
      this.callbacks.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.layerManager.areaLayers.delete(layer.data.id);
      await this.areaService.delete(layer.data.id);
      this.callbacks.notifyChange();
    });
  }
}

export default MapLayerEvents;
