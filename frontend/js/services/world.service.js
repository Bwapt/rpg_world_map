/**
 * Service dedie aux operations globales du monde et des cartes.
 */
class WorldService {
  /**
   * @param {HttpClient} http Client HTTP partage.
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * @returns {Promise<object>} Monde complet, incluant maps, POI et zones.
   */
  getWorld() {
    return this.http.get("/world");
  }

  /**
   * Cree une map avec upload d'image via FormData.
   *
   * @param {{name: string, image: File}} mapInput Donnees saisies dans la modale.
   * @param {Function} [onProgress] Callback de progression d'upload.
   * @returns {Promise<object>} Reponse API contenant la map creee.
   */
  createMap({ name, image }, onProgress) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);
    return typeof onProgress === "function"
      ? this.http.postWithUploadProgress("/maps", formData, onProgress)
      : this.http.post("/maps", formData);
  }

  /**
   * @param {string} mapId Identifiant de la map a supprimer.
   * @returns {Promise<object>} Reponse API contenant la map supprimee.
   */
  deleteMap(mapId) {
    return this.http.delete(`/maps/${mapId}`);
  }
}

export default WorldService;
