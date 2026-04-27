import BaseService from "./base.service.js";

class PoiService extends BaseService {
  constructor(http) {
    super(http, "poi");
  }

  getByMap(mapId) {
    return this.http.get(`/poi/${mapId}`);
  }
}

export default PoiService;
