class MapController {
  static POI_ICON_OPTIONS = [
    { value: "default", label: "Pin par defaut", glyph: "" },
    { value: "inn", label: "Taverne", glyph: "🍺" },
    { value: "castle", label: "Chateau", glyph: "🏰" },
    { value: "shop", label: "Boutique", glyph: "🛒" },
    { value: "temple", label: "Temple", glyph: "⛪" },
    { value: "danger", label: "Danger", glyph: "⚔" },
    { value: "star", label: "Important", glyph: "⭐" }
  ];

  static DEFAULT_AREA_COLOR = "#3b82f6";

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
    this.poiLayers = new Map();
    this.areaLayers = new Map();
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
    this.renderPOIs(poiResponse.pois || []);

    const areaResponse = await this.areaService.getByMap(this.mapId);
    this.renderAreas(areaResponse.areas || []);
  }

  renderPOIs(pois) {
    pois.forEach((poi) => {
      const marker = this.createPoiMarker(poi).addTo(this.map);
      marker.data = poi;
      marker.bindPopup(this.buildPopupContent(poi));
      this.poiLayers.set(poi.id, marker);
      this.bindPoiLayer(marker);
    });
  }

  renderAreas(areas) {
    areas.forEach((area) => {
      const points = (area.points || []).map((point) => [point.y, point.x]);

      if (!points.length) {
        return;
      }

      const polygon = L.polygon(points, this.getAreaStyle(area)).addTo(this.map);
      polygon.data = area;
      polygon.bindPopup(this.buildPopupContent(area));
      this.areaLayers.set(area.id, polygon);
      this.bindAreaLayer(polygon);
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

  bindPoiLayer(layer) {
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
      this.applyPoiMarkerIcon(layer, layer.data.icon);
      this.poiLayers.set(layer.data.id, layer);
      layer.bindPopup(this.buildPopupContent(layer.data));
      this.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.poiLayers.delete(layer.data.id);
      await this.poiService.delete(layer.data.id);
      this.notifyChange();
    });
  }

  bindAreaLayer(layer) {
    layer.on("dblclick", () => {
      this.openAreaForm(layer, layer.data);
    });

    layer.on("pm:edit", async () => {
      if (!layer.data?.id) {
        return;
      }

      const response = await this.areaService.update(layer.data.id, {
        points: this.getPolygonPoints(layer)
      });

      layer.data = response.area;
      layer.setStyle(this.getAreaStyle(layer.data));
      this.areaLayers.set(layer.data.id, layer);
      layer.bindPopup(this.buildPopupContent(layer.data));
      this.notifyChange();
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      this.areaLayers.delete(layer.data.id);
      await this.areaService.delete(layer.data.id);
      this.notifyChange();
    });
  }

  openPoiForm(layer, poi = null) {
    const container = document.createElement("div");
    const title = poi ? "Modifier le Point d'intérêt" : "Creer le Point d'intérêt";

    container.innerHTML = `
      <div class="map-popup">
        <h4 class="map-popup__title">${title}</h4>
        <label class="map-popup__field">
          <span>Nom</span>
          <input
            name="name"
            placeholder="Nom"
            value="${this.escapeAttribute(poi?.name || "")}"
          />
        </label>
        <label class="map-popup__field">
          <span>Description</span>
          <textarea
            name="description"
            placeholder="Description"
          >${this.escapeHTML(poi?.description || "")}</textarea>
        </label>
        <label class="map-popup__field">
          <span>Icone</span>
          <select name="icon">
            ${this.renderPoiIconOptions(poi?.icon || "default")}
          </select>
        </label>
        <div class="map-popup__actions">
          <button type="button" class="map-popup__button is-primary" data-action="save">Valider</button>
          <button type="button" class="map-popup__button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    layer.bindPopup(container).openPopup();

    const nameInput = container.querySelector('[name="name"]');
    const descriptionInput = container.querySelector('[name="description"]');
    const iconInput = container.querySelector('[name="icon"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');

    saveButton.addEventListener("click", async () => {
      const { lat, lng } = layer.getLatLng();
      const payload = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        icon: iconInput.value,
        x: lng,
        y: lat
      };

      if (!payload.name) {
        nameInput.focus();
        return;
      }

      if (poi?.id) {
        const response = await this.poiService.update(poi.id, payload);
        layer.data = response.poi;
      } else {
        const response = await this.poiService.create({
          mapId: this.mapId,
          ...payload
        });

        layer.data = response.poi;
        this.poiLayers.set(layer.data.id, layer);
        this.bindPoiLayer(layer);
      }

      layer.bindPopup(this.buildPopupContent(layer.data));
      this.applyPoiMarkerIcon(layer, layer.data.icon);
      layer.closePopup();
      this.notifyChange();
    });

    cancelButton.addEventListener("click", () => {
      if (!poi?.id) {
        layer.remove();
        return;
      }

      layer.closePopup();
    });
  }

  openAreaForm(layer, area = null) {
    const container = document.createElement("div");
    const title = area ? "Modifier la zone" : "Creer la zone";

    container.innerHTML = `
      <div class="map-popup">
        <h4 class="map-popup__title">${title}</h4>
        <label class="map-popup__field">
          <span>Nom</span>
          <input
            name="name"
            placeholder="Nom"
            value="${this.escapeAttribute(area?.name || "")}"
          />
        </label>
        <label class="map-popup__field">
          <span>Description</span>
          <textarea
            name="description"
            placeholder="Description"
          >${this.escapeHTML(area?.description || "")}</textarea>
        </label>
        <label class="map-popup__field">
          <span>Couleur</span>
          <input
            class="map-popup__color"
            name="color"
            type="color"
            value="${this.escapeAttribute(area?.color || MapController.DEFAULT_AREA_COLOR)}"
          />
        </label>
        <div class="map-popup__actions">
          <button type="button" class="map-popup__button is-primary" data-action="save">Valider</button>
          <button type="button" class="map-popup__button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    layer.bindPopup(container).openPopup();

    const nameInput = container.querySelector('[name="name"]');
    const descriptionInput = container.querySelector('[name="description"]');
    const colorInput = container.querySelector('[name="color"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');

    saveButton.addEventListener("click", async () => {
      const payload = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        color: colorInput.value,
        points: this.getPolygonPoints(layer)
      };

      if (!payload.name) {
        nameInput.focus();
        return;
      }

      if (area?.id) {
        const response = await this.areaService.update(area.id, payload);
        layer.data = response.area;
      } else {
        const response = await this.areaService.create({
          mapId: this.mapId,
          ...payload
        });

        layer.data = response.area;
        this.areaLayers.set(layer.data.id, layer);
        this.bindAreaLayer(layer);
      }

      layer.bindPopup(this.buildPopupContent(layer.data));
      layer.setStyle(this.getAreaStyle(layer.data));
      layer.closePopup();
      this.notifyChange();
    });

    cancelButton.addEventListener("click", () => {
      if (!area?.id) {
        layer.remove();
        return;
      }

      layer.closePopup();
    });
  }

  getPolygonPoints(layer) {
    return layer.getLatLngs()[0].map((point) => ({
      x: point.lng,
      y: point.lat
    }));
  }

  buildPopupContent(item) {
    const name = item.name || "";
    const description = item.description || "";
    const meta = item.icon && item.icon !== "default"
      ? `<span class="map-popup-preview__meta">${this.getPoiGlyph(item.icon)}</span>`
      : "";

    return `
      <div class="map-popup-preview">
        <div class="map-popup-preview__header">
          <strong>${this.escapeHTML(name)}</strong>
          ${meta}
        </div>
        <p>${this.escapeHTML(description || "Sans description")}</p>
      </div>
    `;
  }

  createPoiMarker(poi) {
    const marker = L.marker([poi.y, poi.x]);
    this.applyPoiMarkerIcon(marker, poi.icon);
    return marker;
  }

  applyPoiMarkerIcon(layer, iconKey = "default") {
    if (!iconKey || iconKey === "default") {
      layer.setIcon(new L.Icon.Default());
      return;
    }

    const glyph = this.getPoiGlyph(iconKey);
    const icon = L.divIcon({
      className: "poi-icon-wrapper",
      html: `<div class="poi-icon">${glyph}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -28]
    });

    layer.setIcon(icon);
  }

  getPoiGlyph(iconKey) {
    const option = MapController.POI_ICON_OPTIONS.find((item) => item.value === iconKey);
    return option?.glyph || "⭐";
  }

  renderPoiIconOptions(selectedIcon) {
    return MapController.POI_ICON_OPTIONS.map((option) => {
      const selected = option.value === selectedIcon ? "selected" : "";
      const label = option.glyph ? `${option.glyph} ${option.label}` : option.label;
      return `<option value="${option.value}" ${selected}>${label}</option>`;
    }).join("");
  }

  getAreaStyle(area) {
    const color = area?.color || MapController.DEFAULT_AREA_COLOR;

    return {
      color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 3
    };
  }

  escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  escapeAttribute(value) {
    return this.escapeHTML(value)
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange();
    }
  }

  focusPoi(poiId) {
    const layer = this.poiLayers.get(poiId);
    if (!layer) {
      return;
    }

    const latLng = layer.getLatLng();
    this.map.setView(latLng, Math.max(this.map.getZoom(), 0));
    layer.openPopup();
  }

  focusArea(areaId) {
    const layer = this.areaLayers.get(areaId);
    if (!layer) {
      return;
    }

    this.map.fitBounds(layer.getBounds(), { padding: [32, 32] });
    layer.openPopup();
  }

  setPoiVisibility(poiId, isVisible) {
    const layer = this.poiLayers.get(poiId);
    if (!layer) {
      return;
    }

    this.setLayerVisibility(layer, isVisible);
  }

  setAreaVisibility(areaId, isVisible) {
    const layer = this.areaLayers.get(areaId);
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

  destroy() {
    this.map.off("pm:create", this.handleCreateBound);
    this.poiLayers.clear();
    this.areaLayers.clear();
    this.map.remove();
  }
}

export default MapController;
