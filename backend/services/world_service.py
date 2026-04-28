"""Service de persistence JSON pour les maps, POI et zones."""

import json
import re
from pathlib import Path
import uuid


FILE_PATH = Path(__file__).resolve().parents[1] / "data" / "maps.json"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MAPS_DIR = PROJECT_ROOT / "frontend" / "assets" / "maps"


def load_world():
    """Charge le monde depuis le fichier JSON et complete les champs optionnels."""
    with open(FILE_PATH, "r", encoding="utf-8") as file:
        world = json.load(file)

    for map_data in world.get("maps", []):
        map_data.setdefault("name", prettify_map_name(map_data["id"]))
        map_data.setdefault("pois", [])
        map_data.setdefault("areas", [])

    return world


def save_world(data):
    """Persiste le monde complet dans le fichier JSON."""
    with open(FILE_PATH, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def prettify_map_name(map_id):
    """Transforme un identifiant technique en libelle lisible."""
    return map_id.replace("_", " ").strip().title()


def slugify(value):
    """Convertit une chaine libre en fragment d'identifiant compatible fichier."""
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "map"


def generate_map_id(name):
    """Genere un identifiant unique de map a partir de son nom."""
    return f"{slugify(name)}_{uuid.uuid4().hex[:8]}"


def save_map_image(image_file, map_id):
    """Sauvegarde l'image uploadee et retourne son chemin relatif frontend."""
    MAPS_DIR.mkdir(parents=True, exist_ok=True)
    extension = Path(image_file.filename or "").suffix.lower() or ".png"
    image_path = MAPS_DIR / f"{map_id}{extension}"
    image_file.save(image_path)
    return f"assets/maps/{image_path.name}"


def get_map_by_id(map_id):
    """Retourne le monde et la map correspondant a l'identifiant donne."""
    world = load_world()
    map_data = next((item for item in world["maps"] if item["id"] == map_id), None)
    return world, map_data


def create_map(name, image_file):
    """Cree une map, sauvegarde son image et persiste le monde."""
    world = load_world()
    map_id = generate_map_id(name)
    image = save_map_image(image_file, map_id)

    map_data = {
        "id": map_id,
        "name": name,
        "image": image,
        "pois": [],
        "areas": [],
    }

    world["maps"].append(map_data)
    save_world(world)

    return map_data


def delete_map(map_id):
    """Supprime une map du monde et retire son image locale si possible."""
    world = load_world()

    for index, map_data in enumerate(world["maps"]):
        if map_data["id"] != map_id:
            continue

        image_path = PROJECT_ROOT / "frontend" / map_data["image"]
        if image_path.exists():
            image_path.unlink()

        deleted_map = world["maps"].pop(index)
        save_world(world)
        return deleted_map

    return None


def create_entity(map_id, collection_name, payload, extra_data=None):
    """Cree une entite dans une collection de map."""
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
    """Met a jour une entite existante dans toutes les maps."""
    world = load_world()

    for map_data in world["maps"]:
        for entity in map_data[collection_name]:
            if entity.get("id") == entity_id:
                entity.update(payload)
                save_world(world)
                return entity

    return None


def delete_entity(entity_id, collection_name):
    """Supprime une entite existante dans toutes les maps."""
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
