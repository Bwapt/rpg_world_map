import HtmlUtils from "../utils/html.utils.js";

const MAX_MAP_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_MAP_IMAGE_SIZE_LABEL = "25 Mo";

/**
 * Gere l'ouverture et la fermeture des modales globales de l'application.
 */
class ModalManager {
  /**
   * @param {HTMLElement} modalRoot Conteneur racine des modales.
   */
  constructor(modalRoot) {
    this.modalRoot = modalRoot;
  }

  /**
   * Affiche une modale generique et retourne son controleur de fermeture.
   *
   * @param {HTMLElement} content Contenu DOM de la modale.
   * @returns {{close: Function}} API de fermeture.
   */
  openModal(content) {
    this.modalRoot.innerHTML = "";
    this.modalRoot.classList.add("is-open");

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.appendChild(content);
    this.modalRoot.appendChild(overlay);

    const close = () => {
      this.modalRoot.classList.remove("is-open");
      this.modalRoot.innerHTML = "";
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close();
      }
    });

    return { close };
  }

  /**
   * Ouvre la modale de creation de map.
   *
   * @param {(data: {name: string, image: File}, onProgress: Function) => Promise<void>} onConfirm Callback de validation.
   * @returns {void}
   */
  openAddMapModal(onConfirm) {
    const content = document.createElement("div");
    content.className = "modal";
    content.innerHTML = `
      <h2>Ajouter une map</h2>
      <label>
        Nom
        <input name="name" type="text" />
      </label>
      <label>
        Image
        <input name="image" type="file" accept="image/*" />
        <span class="modal__help">Taille maximale : ${MAX_MAP_IMAGE_SIZE_LABEL}</span>
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

    const { close } = this.openModal(content);
    const nameInput = content.querySelector('[name="name"]');
    const imageInput = content.querySelector('[name="image"]');
    const imageError = content.querySelector("[data-image-error]");
    const progressRoot = content.querySelector("[data-upload-progress]");
    const progressLabel = content.querySelector("[data-upload-progress-label]");
    const progressBar = content.querySelector("[data-upload-progress-bar]");
    const cancelButton = content.querySelector('[data-action="cancel"]');
    const confirmButton = content.querySelector('[data-action="confirm"]');

    const updateProgress = ({ percent }) => {
      progressRoot.hidden = false;
      if (typeof percent === "number") {
        progressRoot.classList.remove("is-indeterminate");
        progressLabel.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
        return;
      }

      progressRoot.classList.add("is-indeterminate");
      progressLabel.textContent = "En cours";
      progressBar.style.width = "";
    };

    const clearImageError = () => {
      imageError.hidden = true;
      imageError.textContent = "";
    };

    const showImageError = (message) => {
      imageError.textContent = message;
      imageError.hidden = false;
    };

    imageInput.addEventListener("change", clearImageError);

    cancelButton.addEventListener("click", close);
    confirmButton.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const image = imageInput.files[0];

      if (!name) {
        nameInput.focus();
        return;
      }

      if (!image) {
        imageInput.focus();
        return;
      }

      if (image.size > MAX_MAP_IMAGE_SIZE_BYTES) {
        showImageError(`Image trop lourde. La taille maximale autorisée est de ${MAX_MAP_IMAGE_SIZE_LABEL}.`);
        imageInput.focus();
        return;
      }

      confirmButton.disabled = true;
      cancelButton.disabled = true;
      nameInput.disabled = true;
      imageInput.disabled = true;
      updateProgress({ percent: 0 });

      try {
        await onConfirm({ name, image }, updateProgress);
        updateProgress({ percent: 100 });
        close();
      } catch (error) {
        progressRoot.hidden = true;
        confirmButton.disabled = false;
        cancelButton.disabled = false;
        nameInput.disabled = false;
        imageInput.disabled = false;
        throw error;
      }
    });
  }

  /**
   * Ouvre la modale de confirmation de suppression de map.
   *
   * @param {object} map Map a supprimer.
   * @param {Function} onConfirm Callback de suppression.
   * @returns {void}
   */
  openDeleteMapModal(map, onConfirm) {
    const content = document.createElement("div");
    content.className = "modal";
    content.innerHTML = `
      <h2>Supprimer la map</h2>
      <p>${HtmlUtils.escapeHTML(map.name || map.id)}</p>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm is-danger" data-action="confirm">Supprimer</button>
      </div>
    `;

    const { close } = this.openModal(content);
    content.querySelector('[data-action="cancel"]').addEventListener("click", close);
    content.querySelector('[data-action="confirm"]').addEventListener("click", async () => {
      await onConfirm();
      close();
    });
  }
}

export default ModalManager;
