import { MAP_DEFAULTS } from "../config/app.constants.js";
import HtmlUtils from "../utils/html.utils.js";
import MapUtils from "./map.utils.js";

/**
 * Builds Leaflet popup form markup for map entities.
 */
class MapFormTemplate {
  /**
   * Builds the POI create/edit form.
   *
   * @param {object|null} poi Existing POI, or null for creation.
   * @returns {string} Form markup.
   */
  renderPoiForm(poi) {
    const title = poi ? "Modifier le Point d'intérêt" : "Créer le Point d'intérêt";

    return `
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
  }

  /**
   * Builds the area create/edit form.
   *
   * @param {object|null} area Existing area, or null for creation.
   * @returns {string} Form markup.
   */
  renderAreaForm(area) {
    const title = area ? "Modifier la zone" : "Créer la zone";

    return `
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
            value="${HtmlUtils.escapeAttribute(area?.color || MAP_DEFAULTS.areaColor)}"
          />
        </label>
        <div class="map-popup__actions">
          <button type="button" class="map-popup__button is-primary" data-action="save">Valider</button>
          <button type="button" class="map-popup__button" data-action="cancel">Annuler</button>
        </div>
      </div>
    `;
  }
}

export default MapFormTemplate;
