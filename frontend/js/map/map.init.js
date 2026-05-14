import { MAP_DEFAULTS } from "../config/app.constants.js";

/**
 * Initialise une carte Leaflet en coordonnees d'image.
 *
 * @param {string} containerId Identifiant DOM du conteneur Leaflet.
 * @param {string} image URL de l'image de map.
 * @param {Function} [onProgress] Callback de progression du chargement image.
 * @returns {Promise<L.Map>} Instance Leaflet cadree sur l'image.
 */
async function initMap(containerId, image, onProgress) {
  const imageUrl = await loadMapImage(image, onProgress);
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  const bounds = [[0, 0], [img.height, img.width]];

  Object.assign(L.Popup.prototype.options, {
    autoPan: true,
    keepInView: true,
    autoPanPaddingTopLeft: L.point(MAP_DEFAULTS.popupPanSide, MAP_DEFAULTS.popupPanTop),
    autoPanPaddingBottomRight: L.point(MAP_DEFAULTS.popupPanSide, MAP_DEFAULTS.popupPanBottom)
  });

  const map = L.map(containerId, {
    crs: L.CRS.Simple,
    maxZoom: 1,
    minZoom: -2,
    zoomDelta: 0.25,
    zoomSnap: 0.25,
    maxBounds: bounds,
    doubleClickZoom: false
  });

  L.imageOverlay(imageUrl, bounds).addTo(map);
  if (imageUrl !== image) {
    map.once("unload", () => URL.revokeObjectURL(imageUrl));
  }

  map.fitBounds(bounds);

  return map;
}

/**
 * Charge l'image de map avec suivi de progression quand le serveur expose sa taille.
 *
 * @param {string} image URL de l'image.
 * @param {(progress: {loaded: number, total: number, percent: number|null}) => void} [onProgress] Callback de progression.
 * @returns {Promise<string>} URL utilisable par Leaflet.
 */
function loadMapImage(image, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", image);
    xhr.responseType = "blob";

    xhr.addEventListener("progress", (event) => {
      if (typeof onProgress !== "function") {
        return;
      }

      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : 0,
        percent: event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : null
      });
    });

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`HTTP ${xhr.status}`));
        return;
      }

      if (typeof onProgress === "function") {
        onProgress({ loaded: xhr.response.size, total: xhr.response.size, percent: 100 });
      }

      resolve(URL.createObjectURL(xhr.response));
    });

    xhr.addEventListener("error", () => reject(new Error("Erreur de chargement de l'image")));
    xhr.send();
  });
}

export default initMap;
