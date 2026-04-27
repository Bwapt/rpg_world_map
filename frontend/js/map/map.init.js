async function initMap(containerId, image) {
  const img = new Image();
  img.src = image;
  await img.decode();

  const bounds = [[0, 0], [img.height, img.width]];

  const map = L.map(containerId, {
    crs: L.CRS.Simple,
    maxZoom: 1,
    minZoom: -2,
    maxBounds: bounds,
  });

  L.imageOverlay(image, bounds).addTo(map);
  map.fitBounds(bounds);

  return map;
}

export default initMap;
