/**
 * Client CRUD generique pour les ressources REST exposees par l'API Flask.
 *
 * Convention JS/TS appliquee:
 * - classe en PascalCase;
 * - methodes publiques en camelCase;
 * - nom de ressource injecte au constructeur pour eviter les doublons.
 */
class BaseService {
  /**
   * @param {HttpClient} http Client HTTP partage par les services metier.
   * @param {string} resource Nom de la ressource API, sans slash initial.
   */
  constructor(http, resource) {
    this.http = http;
    this.resource = resource;
  }

  /**
   * Construit le chemin API d'une collection ou d'une entite precise.
   *
   * @param {string} [id] Identifiant optionnel de l'entite.
   * @returns {string} Chemin API complet pour la ressource.
   */
  buildPath(id = "") {
    return id
      ? `/${this.resource}/${id}`
      : `/${this.resource}`;
  }

  /**
   * @returns {Promise<object>} Toutes les entites de la ressource.
   */
  getAll() {
    return this.http.get(this.buildPath());
  }

  /**
   * @param {string} id Identifiant de l'entite a recuperer.
   * @returns {Promise<object>} Entite demandee.
   */
  get(id) {
    return this.http.get(this.buildPath(id));
  }

  /**
   * @param {object|FormData} data Donnees a creer.
   * @returns {Promise<object>} Reponse API de creation.
   */
  create(data) {
    return this.http.post(this.buildPath(), data);
  }

  /**
   * @param {string} id Identifiant de l'entite a modifier.
   * @param {object} data Champs a mettre a jour.
   * @returns {Promise<object>} Reponse API de mise a jour.
   */
  update(id, data) {
    return this.http.patch(this.buildPath(id), data);
  }

  /**
   * @param {string} id Identifiant de l'entite a supprimer.
   * @returns {Promise<object>} Reponse API de suppression.
   */
  delete(id) {
    return this.http.delete(this.buildPath(id));
  }
}

export default BaseService;
