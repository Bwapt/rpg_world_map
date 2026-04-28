// HTML escaping utilities
class HtmlUtils {
  static escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  static escapeAttribute(value) {
    return HtmlUtils.escapeHTML(value)
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}

export default HtmlUtils;
