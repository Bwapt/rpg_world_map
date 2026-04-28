/**
 * Petit wrapper autour de fetch pour centraliser l'URL API, le JSON et les erreurs.
 */
class HttpClient {
  /**
   * @param {string} [baseURL] Origine du backend Flask.
   */
  constructor(baseURL = "http://localhost:8001") {
    this.baseURL = baseURL;
  }

  /**
   * Execute une requete HTTP et retourne le JSON parse.
   *
   * @param {"GET"|"POST"|"PATCH"|"DELETE"} method Methode HTTP.
   * @param {string} endpoint Chemin API, slash initial inclus.
   * @param {object|FormData|null} [data] Corps optionnel de la requete.
   * @returns {Promise<object>} Corps JSON renvoye par l'API.
   */
  async request(method, endpoint, data = null) {
    const config = {
      method,
    };

    if (data instanceof FormData) {
      config.body = data;
    } else if (data) {
      config.headers = { "Content-Type": "application/json" };
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  }

  /**
   * @param {string} endpoint Chemin API a lire.
   * @returns {Promise<object>} Reponse JSON.
   */
  get(endpoint) {
    return this.request("GET", endpoint);
  }

  /**
   * @param {string} endpoint Chemin API a creer.
   * @param {object|FormData} data Donnees a envoyer.
   * @returns {Promise<object>} Reponse JSON.
   */
  post(endpoint, data) {
    return this.request("POST", endpoint, data);
  }

  /**
   * @param {string} endpoint Chemin API a modifier.
   * @param {object} data Champs a envoyer.
   * @returns {Promise<object>} Reponse JSON.
   */
  patch(endpoint, data) {
    return this.request("PATCH", endpoint, data);
  }

  /**
   * @param {string} endpoint Chemin API a supprimer.
   * @returns {Promise<object>} Reponse JSON.
   */
  delete(endpoint) {
    return this.request("DELETE", endpoint);
  }
}

export default HttpClient;
