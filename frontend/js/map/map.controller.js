import MapFormBuilder from "./map.form.builder.js";
import MapLayerEvents from "./map.layer.events.js";
import MapLayerManager from "./map.layer.manager.js";
import MapUtils from "./map.utils.js";
import { setupGeomanControls } from "./geoman.config.js";
import HtmlUtils from "../utils/html.utils.js";
import { EVENT_TYPES } from "../config/app.constants.js";

/**
 * Orchestrateur d'une map active: Geoman, donnees, formulaires, focus et visibilite.
 */
class MapController {
  /**
   * @param {L.Map} map Instance Leaflet active.
   * @param {string} mapId Identifiant de la map affichee.
   * @param {PoiService} poiService Service des POI.
   * @param {AreaService} areaService Service des zones.
   * @param {{onChange?: Function}} [options] Callbacks optionnels.
   */
  constructor(map, mapId, poiService, areaService, options = {}) {
    this.map = map;
    this.mapId = mapId;
    this.poiService = poiService;
    this.areaService = areaService;
    this.onChange = options.onChange || null;
    this.handleCreateBound = (event) => this.handleCreate(event);

    this.layerManager = new MapLayerManager();
    this.formBuilder = new MapFormBuilder(poiService, areaService, mapId);
    this.layerEvents = new MapLayerEvents(this.layerManager, poiService, areaService, {
      openPoiForm: (layer, poi) => this.openPoiForm(layer, poi),
      openAreaForm: (layer, area) => this.openAreaForm(layer, area),
      buildPopupContent: (item) => this.buildPopupContent(item),
      notifyChange: () => this.notifyChange()
    });
  }

  /**
   * Initialise les outils de dessin, charge les donnees et branche les evenements.
   *
   * @returns {Promise<void>}
   */
  async init() {
    this.setupGeoman();
    await this.loadData();
    this.bindEvents();
  }

  /**
   * Configure la toolbar Geoman pour cette map.
   *
   * @returns {void}
   */
  setupGeoman() {
    setupGeomanControls(this.map);
  }

  /**
   * Charge les POI et zones depuis l'API puis branche les handlers Leaflet.
   *
   * @returns {Promise<void>}
   */
  async loadData() {
    const poiResponse = await this.poiService.getByMap(this.mapId);
    await this.layerManager.renderPois(this.map, poiResponse.pois || [], (item) => this.buildPopupContent(item));

    const areaResponse = await this.areaService.getByMap(this.mapId);
    await this.layerManager.renderAreas(this.map, areaResponse.areas || [], (item) => this.buildPopupContent(item));

    this.layerEvents.bindAll();
  }

  /**
   * Branche les evenements globaux de creation Geoman.
   *
   * @returns {void}
   */
  bindEvents() {
    this.map.on("pm:create", this.handleCreateBound);
  }

  /**
   * Repartit une creation Geoman vers le bon formulaire.
   *
   * @param {object} event Evenement pm:create.
   * @returns {Promise<void>}
   */
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

  /**
   * Ouvre le formulaire de creation ou modification d'un POI.
   *
   * @param {L.Marker} layer Marker concerne.
   * @param {object|null} [poi] POI existant, ou null en creation.
   * @returns {void}
   */
  openPoiForm(layer, poi = null) {
    this.formBuilder.openPoiForm(layer, poi, (poiData, layer) => {
      if (!poi?.id) {
        layer.remove();
        this.upsertRemotePoi(poiData);
        this.notifyChange();
        return;
      } else {
        layer.data = poiData;
        this.layerManager.updatePoiLayer(poiData.id, poiData, (item) => this.buildPopupContent(item));
      }
      layer.bindPopup(this.buildPopupContent(poiData));
      this.notifyChange();
    });
  }

  /**
   * Ouvre le formulaire de creation ou modification d'une zone.
   *
   * @param {L.Polygon} layer Polygone concerne.
   * @param {object|null} [area] Zone existante, ou null en creation.
   * @returns {void}
   */
  openAreaForm(layer, area = null) {
    this.formBuilder.openAreaForm(layer, area, (areaData, layer) => {
      if (!area?.id) {
        layer.remove();
        this.upsertRemoteArea(areaData);
        this.notifyChange();
        return;
      } else {
        layer.data = areaData;
        this.layerManager.updateAreaLayer(areaData.id, areaData, (item) => this.buildPopupContent(item));
      }
      layer.bindPopup(this.buildPopupContent(areaData));
      layer.setStyle(MapUtils.getAreaStyle(areaData));
      this.notifyChange();
    });
  }

  /**
   * @param {object} item POI ou zone.
   * @returns {string} HTML de popup securise.
   */
  buildPopupContent(item) {
    return MapUtils.buildPopupContent(item, HtmlUtils.escapeHTML);
  }

  /**
   * Centre la carte sur un POI et ouvre sa popup.
   *
   * @param {string} poiId Identifiant du POI.
   * @returns {void}
   */
  focusPoi(poiId) {
    const layer = this.layerManager.getPoiLayer(poiId);
    if (!layer) {
      return;
    }

    const latLng = layer.getLatLng();
    this.map.setView(latLng, Math.max(this.map.getZoom(), 0));
    layer.openPopup();
  }

  /**
   * Cadre la carte sur une zone et ouvre sa popup.
   *
   * @param {string} areaId Identifiant de la zone.
   * @returns {void}
   */
  focusArea(areaId) {
    const layer = this.layerManager.getAreaLayer(areaId);
    if (!layer) {
      return;
    }

    this.map.fitBounds(layer.getBounds(), { padding: [32, 32] });
    layer.openPopup();
  }

  /**
   * @param {string} poiId Identifiant du POI.
   * @param {boolean} isVisible Etat de visibilite cible.
   * @returns {void}
   */
  setPoiVisibility(poiId, isVisible) {
    const layer = this.layerManager.getPoiLayer(poiId);
    if (!layer) {
      return;
    }

    this.setLayerVisibility(layer, isVisible);
  }

  /**
   * @param {string} areaId Identifiant de la zone.
   * @param {boolean} isVisible Etat de visibilite cible.
   * @returns {void}
   */
  setAreaVisibility(areaId, isVisible) {
    const layer = this.layerManager.getAreaLayer(areaId);
    if (!layer) {
      return;
    }

    this.setLayerVisibility(layer, isVisible);
  }

  /**
   * Ajoute ou retire un layer Leaflet de la map sans perdre son etat.
   *
   * @param {L.Layer} layer Layer concerne.
   * @param {boolean} isVisible Etat de visibilite cible.
   * @returns {void}
   */
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

  /**
   * Applique une modification recue d'un autre client sans remonter toute la map.
   *
   * @param {{type: string, payload: object}} event Evenement distant.
   * @returns {boolean} True si la map active a ete modifiee.
   */
  applyRemoteChange(event) {
    const { type, payload } = event;
    if (!payload || payload.mapId !== this.mapId) {
      return false;
    }

    if (type === EVENT_TYPES.poiCreated) {
      this.upsertRemotePoi(payload.poi);
      return true;
    }

    if (type === EVENT_TYPES.poiUpdated) {
      this.upsertRemotePoi(payload.poi);
      return true;
    }

    if (type === EVENT_TYPES.poiDeleted) {
      this.removeRemotePoi(payload.poiId);
      return true;
    }

    if (type === EVENT_TYPES.areaCreated) {
      this.upsertRemoteArea(payload.area);
      return true;
    }

    if (type === EVENT_TYPES.areaUpdated) {
      this.upsertRemoteArea(payload.area);
      return true;
    }

    if (type === EVENT_TYPES.areaDeleted) {
      this.removeRemoteArea(payload.areaId);
      return true;
    }

    return false;
  }

  /**
   * Ajoute ou met a jour un POI recu du serveur.
   *
   * @param {object} poi Donnees du POI.
   * @returns {void}
   */
  upsertRemotePoi(poi) {
    if (!poi?.id) {
      return;
    }

    const layer = this.layerManager.getPoiLayer(poi.id);
    if (layer) {
      this.layerManager.updatePoiLayer(poi.id, poi, (item) => this.buildPopupContent(item));
      return;
    }

    const newLayer = this.layerManager.addPoiLayer(poi, (item) => this.buildPopupContent(item));
    newLayer.addTo(this.map);
    this.layerEvents.bindPoiLayerEvents(newLayer);
  }

  /**
   * Supprime un POI recu du serveur.
   *
   * @param {string} poiId Identifiant du POI.
   * @returns {void}
   */
  removeRemotePoi(poiId) {
    const layer = this.layerManager.getPoiLayer(poiId);
    if (!layer) {
      return;
    }

    layer.remove();
    this.layerManager.poiLayers.delete(poiId);
  }

  /**
   * Ajoute ou met a jour une zone recue du serveur.
   *
   * @param {object} area Donnees de la zone.
   * @returns {void}
   */
  upsertRemoteArea(area) {
    if (!area?.id) {
      return;
    }

    const layer = this.layerManager.getAreaLayer(area.id);
    if (layer) {
      this.layerManager.updateAreaLayer(area.id, area, (item) => this.buildPopupContent(item));
      return;
    }

    const newLayer = this.layerManager.addAreaLayer(area, (item) => this.buildPopupContent(item));
    newLayer.addTo(this.map);
    this.layerEvents.bindAreaLayerEvents(newLayer);
  }

  /**
   * Supprime une zone recue du serveur.
   *
   * @param {string} areaId Identifiant de la zone.
   * @returns {void}
   */
  removeRemoteArea(areaId) {
    const layer = this.layerManager.getAreaLayer(areaId);
    if (!layer) {
      return;
    }

    layer.remove();
    this.layerManager.areaLayers.delete(areaId);
  }

  /**
   * Notifie l'application qu'une entite a change.
   *
   * @returns {void}
   */
  notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange();
    }
  }

  /**
   * Nettoie les listeners et detruit l'instance Leaflet.
   *
   * @returns {void}
   */
  destroy() {
    this.map.off("pm:create", this.handleCreateBound);
    this.layerManager.clear();
    this.map.remove();
  }
}

export default MapController;
