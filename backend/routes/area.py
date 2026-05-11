"""Routes Flask dediees aux zones dessinees."""

from flask import Blueprint, request
from services.event_stream import publish
from services.world_service import (
    create_entity,
    delete_entity,
    get_entity_context,
    get_map_by_id,
    update_entity,
)


area_bp = Blueprint("area", __name__)


@area_bp.get("/area/<map_id>")
def get_areas(map_id):
    """Liste les zones d'une map donnee."""
    _, map_data = get_map_by_id(map_id)

    if not map_data:
        return {"error": "map not found"}, 404

    return {"areas": map_data["areas"]}


@area_bp.post("/area")
def create_area():
    """Cree une zone rattachee a une map."""
    data = request.json
    area = create_entity(
        data["mapId"],
        "areas",
        data,
        {
            "points": data.get("points", []),
            "color": data.get("color", "#3b82f6"),
        },
    )

    if not area:
        return {"error": "map not found"}, 404

    publish("area:created", {"mapId": data["mapId"], "area": area})
    return {"area": area}


@area_bp.patch("/area/<area_id>")
def update_area(area_id):
    """Met a jour les champs d'une zone existante."""
    payload = request.json
    area = update_entity(area_id, "areas", payload)

    if not area:
        return {"error": "area not found"}, 404

    map_data, _ = get_entity_context(area_id, "areas")
    publish("area:updated", {"mapId": map_data["id"], "area": area})
    return {"status": "updated", "area": area}


@area_bp.delete("/area/<area_id>")
def delete_area(area_id):
    """Supprime une zone par identifiant."""
    map_data, area = get_entity_context(area_id, "areas")
    deleted = delete_entity(area_id, "areas")

    if not deleted:
        return {"error": "area not found"}, 404

    publish("area:deleted", {"mapId": map_data["id"], "areaId": area_id, "area": area})
    return {"status": "deleted"}
