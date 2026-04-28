# RPG World Map

Interactive map editor for tabletop RPG worlds.

The app lets you load illustrated maps, place points of interest, draw regions, edit them directly on the map, and browse the world through a sidebar.

## Features

- Multi-map world navigation.
- Custom map image upload.
- Points of interest with names, descriptions, and icons.
- Polygon regions with names, descriptions, and colors.
- Edit, move, hide, focus, and delete map entities.
- JSON-backed persistence for a lightweight v1.

## Stack

- Frontend: vanilla JavaScript ES modules, Leaflet, Leaflet-Geoman, CSS modules by UI area.
- Backend: Flask, Flask-CORS, JSON file persistence.
- Data: `backend/data/maps.json`.
- Static assets: `frontend/assets/maps/`.

## Run

Start both servers:

```bash
./run.sh
```

Then open:

- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8001`

The script starts:

- Flask API from `backend/app.py`.
- Static frontend server from `frontend/`.

## API

Main endpoints:

- `GET /world`: returns the full world.
- `POST /world`: replaces the full world JSON.
- `POST /maps`: creates a map from `name` and `image` form fields.
- `DELETE /maps/<map_id>`: deletes a map.
- `GET /poi/<map_id>`: lists POI for a map.
- `POST /poi`: creates a POI.
- `PATCH /poi/<poi_id>`: updates a POI.
- `DELETE /poi/<poi_id>`: deletes a POI.
- `GET /area/<map_id>`: lists regions for a map.
- `POST /area`: creates a region.
- `PATCH /area/<area_id>`: updates a region.
- `DELETE /area/<area_id>`: deletes a region.

## Code Conventions

- JavaScript classes use `PascalCase`.
- JavaScript functions, methods, and variables use `camelCase`.
- JavaScript module constants use `UPPER_SNAKE_CASE` when they are static configuration.
- JavaScript public classes and methods are documented with JSDoc.
- Python modules and functions are documented with docstrings.
- CSS is split by responsibility under `frontend/css/modules/`.

## Project Structure

```text
backend/
  app.py
  routes/
  services/
  data/maps.json

frontend/
  index.html
  css/
    style.css
    modules/
  js/
    app/
    map/
    services/
    ui/
    utils/
  assets/maps/
```

## V1 Manual Checklist

Before tagging or merging a v1 release, verify:

- The app opens at `http://localhost:8000`.
- The backend answers at `http://localhost:8001/world`.
- A map can be added with an image.
- A POI can be created, edited, focused, hidden, and deleted.
- A region can be drawn, edited, focused, hidden, and deleted.
- Sidebar map switching still remounts the correct map.
