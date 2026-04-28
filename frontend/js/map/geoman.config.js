const GEOMAN_TRANSLATIONS = {
  tooltips: {
    placeMarker: "Cliquez pour placer un point d'intérêt",
    firstVertex: "Cliquez pour placer le premier point",
    continueLine: "Cliquez pour ajouter un point",
    finishLine: "Cliquez sur le dernier point pour terminer",
    finishPoly: "Cliquez sur le premier point pour fermer la zone"
  },
  actions: {
    finish: "Terminer",
    cancel: "Annuler",
    removeLastVertex: "Retirer le dernier point"
  },
  buttonTitles: {
    drawMarkerButton: "Ajouter un point d'intérêt",
    drawPolyButton: "Dessiner une zone",
    drawLineButton: "Dessiner une ligne",
    drawCircleButton: "Dessiner un cercle",
    drawRectButton: "Dessiner un rectangle",
    editButton: "Modifier les éléments",
    dragButton: "Déplacer les éléments",
    cutButton: "Découper une zone",
    deleteButton: "Supprimer un élément",
    drawCircleMarkerButton: "Ajouter un marqueur rond",
    drawTextButton: "Ajouter du texte",
    rotateButton: "Faire pivoter",
    scaleButton: "Redimensionner"
  }
};

const GEOMAN_CONTROLS = {
  position: "topleft",
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: false,
  drawRectangle: false,
  drawCircle: false,
  drawCircleMarker: false,
  drawText: false,
  editMode: true,
  dragMode: false,
  cutPolygon: false,
  rotateMode: false,
  removalMode: true
};

function setupGeomanControls(map) {
  map.pm.setLang("fr", GEOMAN_TRANSLATIONS, "en");
  map.pm.addControls(GEOMAN_CONTROLS);
}

export { setupGeomanControls };
