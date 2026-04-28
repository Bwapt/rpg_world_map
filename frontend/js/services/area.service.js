import BaseService from "./base.service.js";

/**
 * Service REST pour les zones dessinees sur une map.
 */
class AreaService extends BaseService {
  /**
   * @param {HttpClient} http Client HTTP partage.
   */
  constructor(http) {
    super(http, "area");
  }

  /**
   * @param {string} mapId Identifiant de la map parente.
   * @returns {Promise<object>} Liste des zones de la map.
   */
  getByMap(mapId) {
    return this.http.get(`/area/${mapId}`);
  }
}

export default AreaService;
