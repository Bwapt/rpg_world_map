import MapUtils from "./map.utils.js";
import HtmlUtils from "../utils/html.utils.js";

/**
 * Construit les formulaires Leaflet de creation et modification des entites de map.
 */
class MapFormBuilder {
  /**
   * @param {PoiService} poiService Service des POI.
   * @param {AreaService} areaService Service des zones.
   * @param {string} mapId Identifiant de la map active.
   */
  constructor(poiService, areaService, mapId) {
    this.poiService = poiService;
    this.areaService = areaService;
    this.mapId = mapId;
  }

  /**
   * Ouvre le formulaire POI dans la popup du marker.
   *
   * @param {L.Marker} layer Marker concerne.
   * @param {object|null} poi POI existant, ou null en creation.
   * @param {(poiData: object, layer: L.Marker) => void} onSave Callback de sauvegarde.
   * @param {Function} [onCancel] Callback reserve pour une annulation future.
   * @returns {Promise<void>}
   */
  async openPoiForm(layer, poi, onSave, onCancel) {
    const container = this.buildPoiFormContainer(poi);
    layer.bindPopup(container).openPopup();
    this.attachPoiFormHandlers(layer, poi, container, onSave, onCancel);
  }

  /**
   * Ouvre le formulaire de zone dans la popup du polygone.
   *
   * @param {L.Polygon} layer Polygone concerne.
   * @param {object|null} area Zone existante, ou null en creation.
   * @param {(areaData: object, layer: L.Polygon) => void} onSave Callback de sauvegarde.
   * @param {Function} [onCancel] Callback reserve pour une annulation future.
   * @returns {Promise<void>}
   */
  async openAreaForm(layer, area, onSave, onCancel) {
    const container = this.buildAreaFormContainer(area);
    layer.bindPopup(container).openPopup();
    this.attachAreaFormHandlers(layer, area, container, onSave, onCancel);
  }

  /**
   * @param {object|null} poi POI existant.
   * @returns {HTMLDivElement} Conteneur du formulaire POI.
   */
  buildPoiFormContainer(poi) {
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
            value="${HtmlUtils.escapeAttribute(poi?.name || "")}"
          />
        </label>
        <label class="map-popup__field">
          <span>Description</span>
          <textarea
            name="description"
            placeholder="Description"
          >${HtmlUtils.escapeHTML(poi?.description || "")}</textarea>
        </label>
        <label class="map-popup__field">
          <span>Icone</span>
          <select name="icon">
            ${MapUtils.renderPoiIconOptions(poi?.icon || "default")}
          </select>
        </label>
        <div class="map-popup__actions">
          <button type="button" class="map-popup__button is-primary" data-action="save">Valider</button>
          <button type="button" class="map-popup__button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * @param {object|null} area Zone existante.
   * @returns {HTMLDivElement} Conteneur du formulaire de zone.
   */
  buildAreaFormContainer(area) {
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
            value="${HtmlUtils.escapeAttribute(area?.name || "")}"
          />
        </label>
        <label class="map-popup__field">
          <span>Description</span>
          <textarea
            name="description"
            placeholder="Description"
          >${HtmlUtils.escapeHTML(area?.description || "")}</textarea>
        </label>
        <label class="map-popup__field">
          <span>Couleur</span>
          <input
            class="map-popup__color"
            name="color"
            type="color"
            value="${HtmlUtils.escapeAttribute(area?.color || MapUtils.DEFAULT_AREA_COLOR)}"
          />
        </label>
        <div class="map-popup__actions">
          <button type="button" class="map-popup__button is-primary" data-action="save">Valider</button>
          <button type="button" class="map-popup__button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Branche validation et annulation du formulaire POI.
   *
   * @param {L.Marker} layer Marker concerne.
   * @param {object|null} poi POI existant.
   * @param {HTMLElement} container Conteneur du formulaire.
   * @param {(poiData: object, layer: L.Marker) => void} onSave Callback de sauvegarde.
   * @param {Function} [onCancel] Callback reserve pour une annulation future.
   * @returns {void}
   */
  attachPoiFormHandlers(layer, poi, container, onSave, onCancel) {
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

      let response;
      if (poi?.id) {
        response = await this.poiService.update(poi.id, payload);
      } else {
        response = await this.poiService.create({
          mapId: this.mapId,
          ...payload
        });
        onSave(response.poi, layer);
        return;
      }

      layer.closePopup();
      onSave(response.poi, layer);
    });

    cancelButton.addEventListener("click", () => {
      if (!poi?.id) {
        layer.remove();
        return;
      }

      layer.closePopup();
    });
  }

  /**
   * Branche validation et annulation du formulaire de zone.
   *
   * @param {L.Polygon} layer Polygone concerne.
   * @param {object|null} area Zone existante.
   * @param {HTMLElement} container Conteneur du formulaire.
   * @param {(areaData: object, layer: L.Polygon) => void} onSave Callback de sauvegarde.
   * @param {Function} [onCancel] Callback reserve pour une annulation future.
   * @returns {void}
   */
  attachAreaFormHandlers(layer, area, container, onSave, onCancel) {
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
        points: MapUtils.getPolygonPoints(layer)
      };

      if (!payload.name) {
        nameInput.focus();
        return;
      }

      let response;
      if (area?.id) {
        response = await this.areaService.update(area.id, payload);
      } else {
        response = await this.areaService.create({
          mapId: this.mapId,
          ...payload
        });
        onSave(response.area, layer);
        return;
      }

      layer.closePopup();
      onSave(response.area, layer);
    });

    cancelButton.addEventListener("click", () => {
      if (!area?.id) {
        layer.remove();
        return;
      }

      layer.closePopup();
    });
  }
}

export default MapFormBuilder;
