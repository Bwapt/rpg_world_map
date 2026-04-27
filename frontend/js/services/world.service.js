class WorldService {
  constructor(http) {
    this.http = http;
  }

  getWorld() {
    return this.http.get("/world");
  }
}

export default WorldService;
