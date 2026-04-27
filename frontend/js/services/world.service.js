class WorldService {
  constructor(http) {
    this.http = http;
  }

  getWorld() {
    return this.http.get("/world");
  }

  createMap({ name, image }) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);
    return this.http.post("/maps", formData);
  }

  deleteMap(mapId) {
    return this.http.delete(`/maps/${mapId}`);
  }
}

export default WorldService;
