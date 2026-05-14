import BaseService from "./base.service.js";
import { API_ROUTES } from "../config/app.constants.js";

/**
 * Service REST pour les zones dessinees sur une map.
 */
class AreaService extends BaseService {
  /**
   * @param {HttpClient} http Client HTTP partage.
   */
  constructor(http) {
    super(http, API_ROUTES.area.slice(1));
  }

  /**
   * @param {string} mapId Identifiant de la map parente.
   * @returns {Promise<object>} Liste des zones de la map.
   */
  getByMap(mapId) {
    return this.http.get(`${API_ROUTES.area}/${mapId}`);
  }
}

export default AreaService;
