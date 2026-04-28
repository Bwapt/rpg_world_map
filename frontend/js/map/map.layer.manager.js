import MapUtils from "./map.utils.js";

class MapLayerManager {
  constructor(poiService, areaService) {
    this.poiService = poiService;
    this.areaService = areaService;
    this.poiLayers = new Map();
    this.areaLayers = new Map();
  }

  async renderPOIs(map, pois, buildPopupContent) {
    pois.forEach((poi) => {
      const marker = MapUtils.createPoiMarker(poi).addTo(map);
      marker.data = poi;
      marker.bindPopup(buildPopupContent(poi));
      this.poiLayers.set(poi.id, marker);
      this.bindPoiLayer(map, marker, buildPopupContent);
    });
  }

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
      this.bindAreaLayer(map, polygon, buildPopupContent);
    });
  }

  bindPoiLayer(map, layer, buildPopupContent, onChangeCallback) {
    layer.on("dblclick", () => {
      // Will be handled by controller calling openPoiForm
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
      this.poiLayers.set(layer.data.id, layer);
      layer.bindPopup(buildPopupContent(layer.data));
      onChangeCallback?.();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.poiLayers.delete(layer.data.id);
      await this.poiService.delete(layer.data.id);
      onChangeCallback?.();
    });
  }

  bindAreaLayer(map, layer, buildPopupContent, onChangeCallback) {
    layer.on("dblclick", () => {
      // Will be handled by controller calling openAreaForm
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
      this.areaLayers.set(layer.data.id, layer);
      layer.bindPopup(buildPopupContent(layer.data));
      onChangeCallback?.();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.areaLayers.delete(layer.data.id);
      await this.areaService.delete(layer.data.id);
      onChangeCallback?.();
    });
  }

  updatePoiLayer(poiId, poiData, buildPopupContent) {
    const layer = this.poiLayers.get(poiId);
    if (!layer) {
      return;
    }

    layer.data = poiData;
    MapUtils.applyPoiMarkerIcon(layer, poiData.icon);
    layer.bindPopup(buildPopupContent(poiData));
  }

  updateAreaLayer(areaId, areaData, buildPopupContent) {
    const layer = this.areaLayers.get(areaId);
    if (!layer) {
      return;
    }

    layer.data = areaData;
    layer.setStyle(MapUtils.getAreaStyle(areaData));
    layer.bindPopup(buildPopupContent(areaData));
  }

  addPoiLayer(poi, buildPopupContent) {
    const layer = MapUtils.createPoiMarker(poi);
    layer.data = poi;
    layer.bindPopup(buildPopupContent(poi));
    this.poiLayers.set(poi.id, layer);
    return layer;
  }

  addAreaLayer(area, buildPopupContent) {
    const points = (area.points || []).map((point) => [point.y, point.x]);
    const layer = L.polygon(points, MapUtils.getAreaStyle(area));
    layer.data = area;
    layer.bindPopup(buildPopupContent(area));
    this.areaLayers.set(area.id, layer);
    return layer;
  }

  getPoiLayer(poiId) {
    return this.poiLayers.get(poiId);
  }

  getAreaLayer(areaId) {
    return this.areaLayers.get(areaId);
  }

  clear() {
    this.poiLayers.clear();
    this.areaLayers.clear();
  }
}

export default MapLayerManager;
