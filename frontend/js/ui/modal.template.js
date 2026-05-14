import { UI_TEXT } from "../config/app.constants.js";
import HtmlUtils from "../utils/html.utils.js";

/**
 * Builds modal markup strings used by ModalManager.
 */
class ModalTemplate {
  /**
   * Builds the "add map" modal form.
   *
   * @returns {string} Modal markup.
   */
  renderAddMapModal() {
    return `
      <h2>Ajouter une map</h2>
      <label>
        Nom
        <input name="name" type="text" />
      </label>
      <label>
        Image
        <input name="image" type="file" accept="image/*" />
        <span class="modal__help">Taille maximale : ${UI_TEXT.maxMapImageSize}</span>
      </label>
      <p class="modal__error" data-image-error hidden></p>
      <div class="modal-progress" data-upload-progress hidden>
        <div class="modal-progress__meta">
          <span>Upload</span>
          <span data-upload-progress-label>0%</span>
        </div>
        <div class="modal-progress__track">
          <div class="modal-progress__bar" data-upload-progress-bar></div>
        </div>
      </div>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm" data-action="confirm">Valider</button>
      </div>
    `;
  }

  /**
   * Builds the map deletion confirmation modal.
   *
   * @param {object} map Map selected for deletion.
   * @returns {string} Modal markup.
   */
  renderDeleteMapModal(map) {
    return `
      <h2>Supprimer la map</h2>
      <p>${HtmlUtils.escapeHTML(map.name || map.id)}</p>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm is-danger" data-action="confirm">Supprimer</button>
      </div>
    `;
  }
}

export default ModalTemplate;
