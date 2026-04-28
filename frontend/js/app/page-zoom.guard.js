/**
 * Bloque les raccourcis de zoom navigateur hors de la map Leaflet.
 */
class PageZoomGuard {
  /**
   * @param {string} [mapSelector] Selecteur du conteneur map autorise a zoomer.
   */
  constructor(mapSelector = "#map") {
    this.mapSelector = mapSelector;
  }

  /**
   * Branche les listeners globaux de prevention du zoom page.
   *
   * @returns {void}
   */
  attach() {
    document.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (this.isMapEventTarget(event.target)) {
        return;
      }

      event.preventDefault();
    }, { capture: true, passive: false });

    document.addEventListener("gesturestart", (event) => {
      if (!this.isMapEventTarget(event.target)) {
        event.preventDefault();
      }
    }, { capture: true });

    document.addEventListener("keydown", (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const isBrowserZoomShortcut = ["+", "-", "=", "0"].includes(key);

      if (isBrowserZoomShortcut) {
        event.preventDefault();
      }
    });
  }

  /**
   * @param {EventTarget|null} target Cible d'un evenement DOM.
   * @returns {boolean} True si l'evenement vient de la map.
   */
  isMapEventTarget(target) {
    return target instanceof Element && Boolean(target.closest(this.mapSelector));
  }
}

export default PageZoomGuard;
