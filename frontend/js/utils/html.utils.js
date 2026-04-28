/**
 * Fonctions statiques d'echappement HTML utilisees avant d'injecter du contenu.
 */
class HtmlUtils {
  /**
   * Echappe une valeur pour du contenu texte HTML.
   *
   * @param {unknown} value Valeur a afficher.
   * @returns {string} Texte sans caracteres HTML actifs.
   */
  static escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /**
   * Echappe une valeur pour un attribut HTML.
   *
   * @param {unknown} value Valeur a placer dans un attribut.
   * @returns {string} Texte compatible avec un attribut HTML.
   */
  static escapeAttribute(value) {
    return HtmlUtils.escapeHTML(value)
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}

export default HtmlUtils;
