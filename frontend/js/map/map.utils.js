// Map-specific utilities (icons, styles, etc.)
class MapUtils {
  static POI_ICON_OPTIONS = [
    { value: "default", label: "Pin par defaut", glyph: "" },
    { value: "inn", label: "Taverne", glyph: "🍺" },
    { value: "castle", label: "Chateau", glyph: "🏰" },
    { value: "shop", label: "Boutique", glyph: "🛒" },
    { value: "temple", label: "Temple", glyph: "⛪" },
    { value: "danger", label: "Danger", glyph: "⚔" },
    { value: "star", label: "Important", glyph: "⭐" }
  ];

  static DEFAULT_AREA_COLOR = "#3b82f6";

  static getPoiGlyph(iconKey) {
    const option = MapUtils.POI_ICON_OPTIONS.find((item) => item.value === iconKey);
    return option?.glyph || "⭐";
  }

  static renderPoiIconOptions(selectedIcon) {
    return MapUtils.POI_ICON_OPTIONS.map((option) => {
      const selected = option.value === selectedIcon ? "selected" : "";
      const label = option.glyph ? `${option.glyph} ${option.label}` : option.label;
      return `<option value="${option.value}" ${selected}>${label}</option>`;
    }).join("");
  }

  static getAreaStyle(area) {
    const color = area?.color || MapUtils.DEFAULT_AREA_COLOR;
    return {
      color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 3
    };
  }

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

  static buildPopupContent(item, escapeHTML) {
    const name = item.name || "";
    const description = item.description || "";
    const meta = item.icon && item.icon !== "default"
      ? `<span class="map-popup-preview__meta">${MapUtils.getPoiGlyph(item.icon)}</span>`
      : "";

    return `
      <div class="map-popup-preview">
        <div class="map-popup-preview__header">
          <strong>${escapeHTML(name)}</strong>
          ${meta}
        </div>
        <p>${escapeHTML(description || "Sans description")}</p>
      </div>
    `;
  }

  static getPolygonPoints(layer) {
    return layer.getLatLngs()[0].map((point) => ({
      x: point.lng,
      y: point.lat
    }));
  }

  static createPoiMarker(poi) {
    const marker = L.marker([poi.y, poi.x]);
    MapUtils.applyPoiMarkerIcon(marker, poi.icon);
    return marker;
  }
}

export default MapUtils;
