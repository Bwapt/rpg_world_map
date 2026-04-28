/**
 * Initialise une carte Leaflet en coordonnees d'image.
 *
 * @param {string} containerId Identifiant DOM du conteneur Leaflet.
 * @param {string} image URL de l'image de map.
 * @returns {Promise<L.Map>} Instance Leaflet cadree sur l'image.
 */
async function initMap(containerId, image) {
  const img = new Image();
  img.src = image;
  await img.decode();

  const bounds = [[0, 0], [img.height, img.width]];

  const map = L.map(containerId, {
    crs: L.CRS.Simple,
    maxZoom: 1,
    minZoom: -2,
    zoomDelta: 0.25,
    zoomSnap: 0.25,
    maxBounds: bounds,
    doubleClickZoom: false
  });

  L.imageOverlay(image, bounds).addTo(map);
  map.fitBounds(bounds);

  return map;
}

export default initMap;
