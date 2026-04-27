import initMap from "./map/map.init.js";
import MapController from "./map/map.controller.js";
import HttpClient from "./services/http.service.js";
import WorldService from "./services/world.service.js";
import PoiService from "./services/poi.service.js";
import AreaService from "./services/area.service.js";

async function init() {
  const http = new HttpClient();
  const worldService = new WorldService(http);
  const poiService = new PoiService(http);
  const areaService = new AreaService(http);

  const world = await worldService.getWorld();

  const mapConfig = world.maps[0];

  if (!mapConfig) {
    return;
  }

  const map = await initMap("map", mapConfig.image);
  const controller = new MapController(
    map,
    mapConfig.id,
    poiService,
    areaService
  );

  await controller.init();
}

init();
