from flask import Blueprint, request, jsonify
from services.world_service import load_world, save_world

world_bp = Blueprint("world", __name__)


@world_bp.get("/world")
def get_world():
    return jsonify(load_world())


@world_bp.post("/world")
def update_world():
    data = request.json
    save_world(data)
    return {"status": "ok"}
