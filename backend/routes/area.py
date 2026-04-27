from flask import Blueprint, request
from services.world_service import (
    create_entity,
    delete_entity,
    get_map_by_id,
    update_entity,
)


area_bp = Blueprint("area", __name__)


@area_bp.get("/area/<map_id>")
def get_areas(map_id):
    _, map_data = get_map_by_id(map_id)

    if not map_data:
        return {"error": "map not found"}, 404

    return {"areas": map_data["areas"]}


@area_bp.post("/area")
def create_area():
    data = request.json
    area = create_entity(
        data["mapId"],
        "areas",
        data,
        {"points": data.get("points", [])},
    )

    if not area:
        return {"error": "map not found"}, 404

    return {"area": area}


@area_bp.patch("/area/<area_id>")
def update_area(area_id):
    payload = request.json
    area = update_entity(area_id, "areas", payload)

    if not area:
        return {"error": "area not found"}, 404

    return {"status": "updated", "area": area}


@area_bp.delete("/area/<area_id>")
def delete_area(area_id):
    deleted = delete_entity(area_id, "areas")

    if not deleted:
        return {"error": "area not found"}, 404

    return {"status": "deleted"}
