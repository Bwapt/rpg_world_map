import BaseService from "./base.service.js";

/**
 * Service REST pour les points d'interet.
 */
class PoiService extends BaseService {
  /**
   * @param {HttpClient} http Client HTTP partage.
   */
  constructor(http) {
    super(http, "poi");
  }

  /**
   * @param {string} mapId Identifiant de la map parente.
   * @returns {Promise<object>} Liste des POI de la map.
   */
  getByMap(mapId) {
    return this.http.get(`/poi/${mapId}`);
  }
}

export default PoiService;
