import BaseService from "./base.service.js";
import { API_ROUTES } from "../config/app.constants.js";

/**
 * Service REST pour les points d'interet.
 */
class PoiService extends BaseService {
  /**
   * @param {HttpClient} http Client HTTP partage.
   */
  constructor(http) {
    super(http, API_ROUTES.poi.slice(1));
  }

  /**
   * @param {string} mapId Identifiant de la map parente.
   * @returns {Promise<object>} Liste des POI de la map.
   */
  getByMap(mapId) {
    return this.http.get(`${API_ROUTES.poi}/${mapId}`);
  }
}

export default PoiService;
