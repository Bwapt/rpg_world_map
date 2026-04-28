from flask import Blueprint, request
from services.world_service import (
    create_entity,
    delete_entity,
    get_map_by_id,
    update_entity,
)


poi_bp = Blueprint("poi", __name__)


@poi_bp.get("/poi/<map_id>")
def get_pois(map_id):
    _, map_data = get_map_by_id(map_id)

    if not map_data:
        return {"error": "map not found"}, 404

    return {"pois": map_data["pois"]}


@poi_bp.post("/poi")
def create_poi():
    data = request.json
    poi = create_entity(
        data["mapId"],
        "pois",
        data,
        {
            "x": data["x"],
            "y": data["y"],
            "icon": data.get("icon", "default"),
        },
    )

    if not poi:
        return {"error": "map not found"}, 404

    return {"poi": poi}


@poi_bp.delete("/poi/<poi_id>")
def delete_poi(poi_id):
    deleted = delete_entity(poi_id, "pois")

    if not deleted:
        return {"error": "poi not found"}, 404

    return {"status": "deleted"}


@poi_bp.patch("/poi/<poi_id>")
def update_poi(poi_id):
    payload = request.json
    poi = update_entity(poi_id, "pois", payload)

    if not poi:
        return {"error": "poi not found"}, 404

    return {"status": "updated", "poi": poi}
