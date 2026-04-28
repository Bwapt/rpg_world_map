import MapUtils from "./map.utils.js";

class MapLayerEvents {
  constructor(layerManager, poiService, areaService, callbacks) {
    this.layerManager = layerManager;
    this.poiService = poiService;
    this.areaService = areaService;
    this.callbacks = callbacks;
  }

  bindAll() {
    this.layerManager.poiLayers.forEach((layer) => {
      this.bindPoiLayerEvents(layer);
    });

    this.layerManager.areaLayers.forEach((layer) => {
      this.bindAreaLayerEvents(layer);
    });
  }

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
