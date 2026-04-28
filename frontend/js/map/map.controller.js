import MapFormBuilder from "./map.form.builder.js";
import MapLayerEvents from "./map.layer.events.js";
import MapLayerManager from "./map.layer.manager.js";
import MapUtils from "./map.utils.js";
import { setupGeomanControls } from "./geoman.config.js";
import HtmlUtils from "../utils/html.utils.js";

class MapController {
  constructor(map, mapId, poiService, areaService, options = {}) {
    this.map = map;
    this.mapId = mapId;
    this.poiService = poiService;
    this.areaService = areaService;
    this.onChange = options.onChange || null;
    this.handleCreateBound = (event) => this.handleCreate(event);
    
    this.layerManager = new MapLayerManager(poiService, areaService);
    this.formBuilder = new MapFormBuilder(poiService, areaService, mapId);
    this.layerEvents = new MapLayerEvents(this.layerManager, poiService, areaService, {
      openPoiForm: (layer, poi) => this.openPoiForm(layer, poi),
      openAreaForm: (layer, area) => this.openAreaForm(layer, area),
      buildPopupContent: (item) => this.buildPopupContent(item),
      notifyChange: () => this.notifyChange()
    });
  }

  async init() {
    this.setupGeoman();
    await this.loadData();
    this.bindEvents();
  }

  setupGeoman() {
    setupGeomanControls(this.map);
  }

  async loadData() {
    const poiResponse = await this.poiService.getByMap(this.mapId);
    await this.layerManager.renderPOIs(this.map, poiResponse.pois || [], (item) => this.buildPopupContent(item));

    const areaResponse = await this.areaService.getByMap(this.mapId);
    await this.layerManager.renderAreas(this.map, areaResponse.areas || [], (item) => this.buildPopupContent(item));

    this.layerEvents.bindAll();
  }

  bindEvents() {
    this.map.on("pm:create", this.handleCreateBound);
  }

  async handleCreate(event) {
    const { layer } = event;

    if (layer instanceof L.Marker) {
      this.openPoiForm(layer);
      return;
    }

    if (layer instanceof L.Polygon) {
      this.openAreaForm(layer);
      return;
    }

    layer.remove();
  }


  openPoiForm(layer, poi = null) {
    this.formBuilder.openPoiForm(layer, poi, (poiData, layer) => {
      if (!poi?.id) {
        MapUtils.applyPoiMarkerIcon(layer, poiData.icon);
        this.layerManager.poiLayers.set(poiData.id, layer);
        this.layerEvents.bindPoiLayerEvents(layer);
      } else {
        this.layerManager.updatePoiLayer(poiData.id, poiData, (item) => this.buildPopupContent(item));
      }
      layer.bindPopup(this.buildPopupContent(poiData));
      this.notifyChange();
    });
  }

  openAreaForm(layer, area = null) {
    this.formBuilder.openAreaForm(layer, area, (areaData, layer) => {
      if (!area?.id) {
        this.layerManager.areaLayers.set(areaData.id, layer);
        this.layerEvents.bindAreaLayerEvents(layer);
      } else {
        this.layerManager.updateAreaLayer(areaData.id, areaData, (item) => this.buildPopupContent(item));
      }
      layer.bindPopup(this.buildPopupContent(areaData));
      layer.setStyle(MapUtils.getAreaStyle(areaData));
      this.notifyChange();
    });
  }

  buildPopupContent(item) {
    return MapUtils.buildPopupContent(item, HtmlUtils.escapeHTML);
  }

  focusPoi(poiId) {
    const layer = this.layerManager.getPoiLayer(poiId);
    if (!layer) {
      return;
    }

    const latLng = layer.getLatLng();
    this.map.setView(latLng, Math.max(this.map.getZoom(), 0));
    layer.openPopup();
  }

  focusArea(areaId) {
    const layer = this.layerManager.getAreaLayer(areaId);
    if (!layer) {
      return;
    }

    this.map.fitBounds(layer.getBounds(), { padding: [32, 32] });
    layer.openPopup();
  }

  setPoiVisibility(poiId, isVisible) {
    const layer = this.layerManager.getPoiLayer(poiId);
    if (!layer) {
      return;
    }

    this.setLayerVisibility(layer, isVisible);
  }

  setAreaVisibility(areaId, isVisible) {
    const layer = this.layerManager.getAreaLayer(areaId);
    if (!layer) {
      return;
    }

    this.setLayerVisibility(layer, isVisible);
  }

  setLayerVisibility(layer, isVisible) {
    const onMap = this.map.hasLayer(layer);

    if (isVisible && !onMap) {
      layer.addTo(this.map);
      return;
    }

    if (!isVisible && onMap) {
      layer.remove();
    }
  }

  notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange();
    }
  }

  destroy() {
    this.map.off("pm:create", this.handleCreateBound);
    this.layerManager.clear();
    this.map.remove();
  }
}

export default MapController;
