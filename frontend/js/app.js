const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

// Dimensions de ton image (à ajuster si besoin)
const w = 4960;
const h = 3507;

// Image en fond
const imageUrl = 'assets/maps/cite_franche.png';

const bounds = [[0, 0], [h, w]];

L.imageOverlay(imageUrl, bounds).addTo(map);

map.fitBounds(bounds);