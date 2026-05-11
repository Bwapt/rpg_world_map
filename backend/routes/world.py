"""Routes Flask liees au monde global et aux maps."""

import queue

from flask import Blueprint, Response, jsonify, request, stream_with_context
from services.event_stream import format_sse, subscribe, unsubscribe
from services.world_service import create_map, delete_map, load_world, save_world

world_bp = Blueprint("world", __name__)


@world_bp.get("/world")
def get_world():
    """Retourne le monde complet avec ses maps, POI et zones."""
    return jsonify(load_world())


@world_bp.get("/events")
def get_events():
    """Ouvre un flux Server-Sent Events pour les modifications du monde."""
    subscriber = subscribe()

    def stream():
        try:
            yield ": connected\n\n"
            while True:
                try:
                    event = subscriber.get(timeout=25)
                    yield format_sse(event)
                except queue.Empty:
                    yield ": keep-alive\n\n"
        finally:
            unsubscribe(subscriber)

    return Response(
        stream_with_context(stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@world_bp.post("/world")
def update_world():
    """Remplace le contenu persiste du monde par le JSON recu."""
    data = request.json
    save_world(data)
    return {"status": "ok"}


@world_bp.post("/maps")
def add_map():
    """Cree une nouvelle map depuis un nom et un fichier image."""
    name = request.form.get("name", "").strip()
    image_file = request.files.get("image")

    if not name:
        return {"error": "map name is required"}, 400

    if not image_file:
        return {"error": "map image is required"}, 400

    map_data = create_map(name, image_file)
    return {"map": map_data}


@world_bp.delete("/maps/<map_id>")
def remove_map(map_id):
    """Supprime une map et son image locale si elle existe."""
    deleted_map = delete_map(map_id)

    if not deleted_map:
        return {"error": "map not found"}, 404

    return {"status": "deleted", "map": deleted_map}
