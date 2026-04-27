import json
from pathlib import Path
import uuid


FILE_PATH = Path(__file__).resolve().parents[1] / "data" / "maps.json"


def load_world():
    with open(FILE_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def save_world(data):
    with open(FILE_PATH, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def get_map_by_id(map_id):
    world = load_world()
    map_data = next((item for item in world["maps"] if item["id"] == map_id), None)
    return world, map_data


def create_entity(map_id, collection_name, payload, extra_data=None):
    world, map_data = get_map_by_id(map_id)

    if not map_data:
        return None

    entity = {
        "id": str(uuid.uuid4()),
        "name": payload["name"],
        "description": payload.get("description", ""),
        **(extra_data or {}),
    }

    map_data[collection_name].append(entity)
    save_world(world)

    return entity


def update_entity(entity_id, collection_name, payload):
    world = load_world()

    for map_data in world["maps"]:
        for entity in map_data[collection_name]:
            if entity.get("id") == entity_id:
                entity.update(payload)
                save_world(world)
                return entity

    return None


def delete_entity(entity_id, collection_name):
    world = load_world()

    for map_data in world["maps"]:
        initial_length = len(map_data[collection_name])
        map_data[collection_name] = [
            entity for entity in map_data[collection_name]
            if entity.get("id") != entity_id
        ]

        if len(map_data[collection_name]) != initial_length:
            save_world(world)
            return True

    return False
