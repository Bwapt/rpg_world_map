async function loadMap(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;

    const bounds = [[50, 50], [img.height, img.width]];

    img.onload = () => {
      const map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: 1,
        minZoom: -2,
        zoomSnap: 0.25,
        maxBounds: bounds,
      });

      L.imageOverlay(imageUrl, bounds).addTo(map);
      map.fitBounds(bounds);

      resolve(map);
    };
  });
}

loadMap("assets/maps/cite_franche.png");