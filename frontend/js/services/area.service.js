import BaseService from "./base.service.js";

class AreaService extends BaseService {
  constructor(http) {
    super(http, "area");
  }

  getByMap(mapId) {
    return this.http.get(`/area/${mapId}`);
  }
}

export default AreaService;
