/**
 * Petit wrapper autour de fetch pour centraliser l'URL API, le JSON et les erreurs.
 */
class HttpClient {
  /**
   * @param {string} [baseURL] Origine du backend Flask.
   */
  constructor(baseURL = HttpClient.getDefaultBaseURL()) {
    this.baseURL = baseURL;
  }

  /**
   * Garde le mode dev historique, tout en utilisant l'origine courante en Docker.
   *
   * @returns {string} Origine API par defaut.
   */
  static getDefaultBaseURL() {
    const { protocol, hostname, port } = window.location;

    if (port === "8000") {
      return `${protocol}//${hostname}:8001`;
    }

    return "";
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

    const contentType = response.headers.get("Content-Type") || "";
    const result = contentType.includes("application/json")
      ? await response.json()
      : { error: `HTTP ${response.status}` };

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  }

  /**
   * Execute une requete avec suivi de progression d'upload.
   *
   * @param {"POST"|"PATCH"} method Methode HTTP.
   * @param {string} endpoint Chemin API, slash initial inclus.
   * @param {FormData} data Corps multipart a envoyer.
   * @param {(progress: {loaded: number, total: number, percent: number|null}) => void} [onProgress] Callback de progression.
   * @returns {Promise<object>} Corps JSON renvoye par l'API.
   */
  requestWithUploadProgress(method, endpoint, data, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, `${this.baseURL}${endpoint}`);
      xhr.responseType = "json";

      xhr.upload.addEventListener("progress", (event) => {
        if (typeof onProgress !== "function") {
          return;
        }

        onProgress({
          loaded: event.loaded,
          total: event.lengthComputable ? event.total : 0,
          percent: event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : null
        });
      });

      xhr.addEventListener("load", () => {
        const result = xhr.response || {};
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(result.error || `HTTP ${xhr.status}`));
          return;
        }

        resolve(result);
      });

      xhr.addEventListener("error", () => reject(new Error("Erreur réseau pendant l'upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload annulé")));
      xhr.send(data);
    });
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
   * @param {string} endpoint Chemin API a creer.
   * @param {FormData} data Donnees multipart a envoyer.
   * @param {Function} [onProgress] Callback de progression.
   * @returns {Promise<object>} Reponse JSON.
   */
  postWithUploadProgress(endpoint, data, onProgress) {
    return this.requestWithUploadProgress("POST", endpoint, data, onProgress);
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
