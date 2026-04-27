class MapController {
  constructor(map, mapId, poiService, areaService) {
    this.map = map;
    this.mapId = mapId;
    this.poiService = poiService;
    this.areaService = areaService;
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
      drawPolygon: false,
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

    try {
      const areaResponse = await this.areaService.getByMap(this.mapId);
      this.renderAreas(areaResponse.areas || []);
    } catch {
      this.renderAreas([]);
    }
  }

  renderPOIs(pois) {
    pois.forEach((poi) => {
      const marker = L.marker([poi.y, poi.x]).addTo(this.map);
      marker.data = poi;
      marker.bindPopup(this.buildPopupContent(poi));
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
    });
  }

  bindEvents() {
    this.map.on("pm:create", (event) => this.handleCreate(event));
  }

  async handleCreate(event) {
    const { layer } = event;

    if (!(layer instanceof L.Marker)) {
      layer.remove();
      return;
    }

    this.openPoiForm(layer);
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
      layer.bindPopup(this.buildPopupContent(layer.data));
    });

    layer.on("pm:remove", async () => {
      if (!layer.data?.id) {
        return;
      }

      await this.poiService.delete(layer.data.id);
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
        this.bindPoiLayer(layer);
      }

      layer.bindPopup(this.buildPopupContent(layer.data));
      layer.closePopup();
    });

    cancelButton.addEventListener("click", () => {
      if (!poi?.id) {
        layer.remove();
        return;
      }

      layer.closePopup();
    });
  }

  buildPopupContent(item) {
    const name = item.name || "";
    const description = item.description || "";

    return `<b>${name}</b><br>${description}`;
  }
}

export default MapController;
