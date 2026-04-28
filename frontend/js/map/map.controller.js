import MapFormBuilder from "./map.form.builder.js";
import MapLayerManager from "./map.layer.manager.js";
import MapUtils from "./map.utils.js";
import HtmlUtils from "../utils/html.utils.js";

class MapController {
  static GEOMAN_TRANSLATIONS = {
    tooltips: {
      placeMarker: "Cliquez pour placer un point d'intérêt",
      firstVertex: "Cliquez pour placer le premier point",
      continueLine: "Cliquez pour ajouter un point",
      finishLine: "Cliquez sur le dernier point pour terminer",
      finishPoly: "Cliquez sur le premier point pour fermer la zone"
    },
    actions: {
      finish: "Terminer",
      cancel: "Annuler",
      removeLastVertex: "Retirer le dernier point"
    },
    buttonTitles: {
      drawMarkerButton: "Ajouter un point d'intérêt",
      drawPolyButton: "Dessiner une zone",
      drawLineButton: "Dessiner une ligne",
      drawCircleButton: "Dessiner un cercle",
      drawRectButton: "Dessiner un rectangle",
      editButton: "Modifier les éléments",
      dragButton: "Déplacer les éléments",
      cutButton: "Découper une zone",
      deleteButton: "Supprimer un élément",
      drawCircleMarkerButton: "Ajouter un marqueur rond",
      drawTextButton: "Ajouter du texte",
      rotateButton: "Faire pivoter",
      scaleButton: "Redimensionner"
    }
  };

  constructor(map, mapId, poiService, areaService, options = {}) {
    this.map = map;
    this.mapId = mapId;
    this.poiService = poiService;
    this.areaService = areaService;
    this.onChange = options.onChange || null;
    this.handleCreateBound = (event) => this.handleCreate(event);
    
    this.layerManager = new MapLayerManager(poiService, areaService);
    this.formBuilder = new MapFormBuilder(poiService, areaService, mapId);
  }

  async init() {
    this.setupGeoman();
    await this.loadData();
    this.bindEvents();
  }

  setupGeoman() {
    this.map.pm.setLang("fr", MapController.GEOMAN_TRANSLATIONS, "en");
    this.map.pm.addControls({
      position: "topleft",
      drawMarker: true,
      drawPolygon: true,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      rotateMode: false,
      removalMode: true
    });
  }

  async loadData() {
    const poiResponse = await this.poiService.getByMap(this.mapId);
    await this.layerManager.renderPOIs(this.map, poiResponse.pois || [], (item) => this.buildPopupContent(item));

    const areaResponse = await this.areaService.getByMap(this.mapId);
    await this.layerManager.renderAreas(this.map, areaResponse.areas || [], (item) => this.buildPopupContent(item));

    // Setup event listeners after rendering
    this.setupLayerEventListeners();
  }

  setupLayerEventListeners() {
    this.layerManager.poiLayers.forEach((layer) => {
      this.bindPoiLayerEvents(layer);
    });

    this.layerManager.areaLayers.forEach((layer) => {
      this.bindAreaLayerEvents(layer);
    });
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

  bindPoiLayerEvents(layer) {
    layer.on("dblclick", () => {
      this.openPoiForm(layer, layer.data);
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
      layer.bindPopup(this.buildPopupContent(layer.data));
      this.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.layerManager.poiLayers.delete(layer.data.id);
      await this.poiService.delete(layer.data.id);
      this.notifyChange();
    });
  }

  bindAreaLayerEvents(layer) {
    layer.on("dblclick", () => {
      this.openAreaForm(layer, layer.data);
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
      layer.bindPopup(this.buildPopupContent(layer.data));
      this.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.layerManager.areaLayers.delete(layer.data.id);
      await this.areaService.delete(layer.data.id);
      this.notifyChange();
    });
  }

  openPoiForm(layer, poi = null) {
    this.formBuilder.openPoiForm(layer, poi, (poiData, layer) => {
      if (!poi?.id) {
        MapUtils.applyPoiMarkerIcon(layer, poiData.icon);
        this.layerManager.poiLayers.set(poiData.id, layer);
        this.bindPoiLayerEvents(layer);
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
        this.bindAreaLayerEvents(layer);
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
