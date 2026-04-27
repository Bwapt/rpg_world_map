class MapController {
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
      const marker = L.marker([poi.y, poi.x]).addTo(this.map);
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

      const polygon = L.polygon(points).addTo(this.map);
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
    const title = poi ? "Modifier le POI" : "Creer le POI";

    container.innerHTML = `
      <div style="min-width: 220px;">
        <h4 style="margin: 0 0 8px;">${title}</h4>
        <input
          name="name"
          placeholder="Nom"
          value="${poi?.name || ""}"
          style="width: 100%; margin-bottom: 8px; box-sizing: border-box;"
        />
        <textarea
          name="description"
          placeholder="Description"
          style="width: 100%; min-height: 80px; margin-bottom: 8px; box-sizing: border-box;"
        >${poi?.description || ""}</textarea>
        <div style="display: flex; gap: 8px;">
          <button type="button" data-action="save">Valider</button>
          <button type="button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    layer.bindPopup(container).openPopup();

    const nameInput = container.querySelector('[name="name"]');
    const descriptionInput = container.querySelector('[name="description"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');

    saveButton.addEventListener("click", async () => {
      const { lat, lng } = layer.getLatLng();
      const payload = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
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
      <div style="min-width: 220px;">
        <h4 style="margin: 0 0 8px;">${title}</h4>
        <input
          name="name"
          placeholder="Nom"
          value="${area?.name || ""}"
          style="width: 100%; margin-bottom: 8px; box-sizing: border-box;"
        />
        <textarea
          name="description"
          placeholder="Description"
          style="width: 100%; min-height: 80px; margin-bottom: 8px; box-sizing: border-box;"
        >${area?.description || ""}</textarea>
        <div style="display: flex; gap: 8px;">
          <button type="button" data-action="save">Valider</button>
          <button type="button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    layer.bindPopup(container).openPopup();

    const nameInput = container.querySelector('[name="name"]');
    const descriptionInput = container.querySelector('[name="description"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');

    saveButton.addEventListener("click", async () => {
      const payload = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
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

    return `<b>${name}</b><br>${description}`;
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

  destroy() {
    this.map.off("pm:create", this.handleCreateBound);
    this.poiLayers.clear();
    this.areaLayers.clear();
    this.map.remove();
  }
}

export default MapController;
