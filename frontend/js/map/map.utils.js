import { MAP_DEFAULTS } from "../config/app.constants.js";

/**
 * Pure Leaflet helpers for icons, area styles, and coordinate conversions.
 */
class MapUtils {
  /**
   * Catalogue des icones disponibles dans le formulaire de POI.
   *
   * @type {Array<{value: string, label: string, glyph: string}>}
   */
  static POI_ICON_OPTIONS = [
    { value: "default", label: "Pin par defaut", glyph: "" },
    { value: "inn", label: "Taverne", glyph: "🍺" },
    { value: "castle", label: "Chateau", glyph: "🏰" },
    { value: "shop", label: "Boutique", glyph: "🛒" },
    { value: "temple", label: "Temple", glyph: "⛪" },
    { value: "danger", label: "Danger", glyph: "⚔" },
    { value: "star", label: "Important", glyph: "⭐" }
  ];

  /**
   * Fallback color for drawn areas.
   *
   * @type {string}
   */
  static DEFAULT_AREA_COLOR = MAP_DEFAULTS.areaColor;

  /**
   * @param {string} iconKey Cle fonctionnelle de l'icone.
   * @returns {string} Glyphe affiche sur la map.
   */
  static getPoiGlyph(iconKey) {
    const option = MapUtils.POI_ICON_OPTIONS.find((item) => item.value === iconKey);
    return option?.glyph || "⭐";
  }

  /**
   * Genere les options HTML du select d'icone.
   *
   * @param {string} selectedIcon Cle de l'icone selectionnee.
   * @returns {string} Liste de balises option.
   */
  static renderPoiIconOptions(selectedIcon) {
    return MapUtils.POI_ICON_OPTIONS.map((option) => {
      const selected = option.value === selectedIcon ? "selected" : "";
      const label = option.glyph ? `${option.glyph} ${option.label}` : option.label;
      return `<option value="${option.value}" ${selected}>${label}</option>`;
    }).join("");
  }

  /**
   * @param {object} area Zone sauvegardee.
   * @returns {object} Style Leaflet applique au polygone.
   */
  static getAreaStyle(area) {
    const color = area?.color || MapUtils.DEFAULT_AREA_COLOR;
    return {
      color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 3
    };
  }

  /**
   * Applique l'icone Leaflet d'un POI sur un marker existant.
   *
   * @param {L.Marker} layer Marker Leaflet a modifier.
   * @param {string} [iconKey] Cle de l'icone sauvegardee.
   * @returns {void}
   */
  static applyPoiMarkerIcon(layer, iconKey = "default") {
    if (!iconKey || iconKey === "default") {
      layer.setIcon(new L.Icon.Default());
      return;
    }

    const glyph = MapUtils.getPoiGlyph(iconKey);
    const icon = L.divIcon({
      className: "poi-icon-wrapper",
      html: `<div class="poi-icon">${glyph}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -28]
    });

    layer.setIcon(icon);
  }

  /**
   * Construit le HTML de preview affiche dans les popups Leaflet.
   *
   * @param {object} item POI ou zone.
   * @param {(value: unknown) => string} escapeHTML Fonction d'echappement.
   * @returns {string} Markup de popup.
   */
  static buildPopupContent(item, escapeHTML) {
    const name = item.name || "";
    const description = (item.description || "").trim();
    const meta = item.icon && item.icon !== "default"
      ? `<span class="map-popup-preview__meta">${MapUtils.getPoiGlyph(item.icon)}</span>`
      : "";
    const descriptionMarkup = description
      ? `<p>${escapeHTML(description)}</p>`
      : "";

    return `
      <div class="map-popup-preview">
        <div class="map-popup-preview__header">
          <strong>${escapeHTML(name)}</strong>
          ${meta}
        </div>
        ${descriptionMarkup}
      </div>
    `;
  }

  /**
   * Convertit un polygone Leaflet vers le format persiste par l'API.
   *
   * @param {L.Polygon} layer Polygone Leaflet.
   * @returns {Array<{x: number, y: number}>} Points serialisables.
   */
  static getPolygonPoints(layer) {
    return layer.getLatLngs()[0].map((point) => ({
      x: point.lng,
      y: point.lat
    }));
  }

  /**
   * Cree un marker Leaflet depuis un POI sauvegarde.
   *
   * @param {{x: number, y: number, icon?: string}} poi POI provenant de l'API.
   * @returns {L.Marker} Marker pret a ajouter a la map.
   */
  static createPoiMarker(poi) {
    const marker = L.marker([poi.y, poi.x]);
    MapUtils.applyPoiMarkerIcon(marker, poi.icon);
    return marker;
  }
}

export default MapUtils;
