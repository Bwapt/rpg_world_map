import HtmlUtils from "../utils/html.utils.js";

class ModalManager {
  constructor(modalRoot) {
    this.modalRoot = modalRoot;
  }

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
      </label>
      <div class="modal__actions">
        <button type="button" class="modal__cancel" data-action="cancel">Annuler</button>
        <button type="button" class="modal__confirm" data-action="confirm">Valider</button>
      </div>
    `;

    const { close } = this.openModal(content);
    const nameInput = content.querySelector('[name="name"]');
    const imageInput = content.querySelector('[name="image"]');

    content.querySelector('[data-action="cancel"]').addEventListener("click", close);
    content.querySelector('[data-action="confirm"]').addEventListener("click", async () => {
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

      await onConfirm({ name, image });
      close();
    });
  }

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
