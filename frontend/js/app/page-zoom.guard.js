class PageZoomGuard {
  constructor(mapSelector = "#map") {
    this.mapSelector = mapSelector;
  }

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

  isMapEventTarget(target) {
    return target instanceof Element && Boolean(target.closest(this.mapSelector));
  }
}

export default PageZoomGuard;
