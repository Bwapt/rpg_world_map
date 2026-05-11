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

## Data Management

The app stores user data in `backend/data/maps.json`, which is not committed to git. If the file doesn't exist, the app starts with an empty world.

- Example data structure: `backend/data/maps.json.example`
- Uploaded map images are stored in `frontend/assets/maps/`
- All user data persists locally and is not included in the repository

## Run

Prerequisites:

- Python 3 installed.
- `pip` available for Python.
- (Optional) Node.js installed to run npm scripts.
- Docker + Docker Compose available for containerized launch.

Local launch:

```bash
chmod +x ./run.sh
./run.sh
```

or with npm:

```bash
npm start
```

Then open:

- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8001`

If you prefer to run backend and frontend separately:

```bash
npm run backend
npm run frontend
```

### Maintenance

Clean up temporary files and caches:

```bash
npm run clean
```

Docker launch (local):

Start the stack with Docker Compose:

```bash
docker compose up --build
```

Stop the stack:

```bash
docker compose down --volumes --remove-orphans
```

Docker Compose does not publish host ports. It starts two private services on the
`rpg_world_map` Docker network:

- `frontend`: Nginx serving the static app on container port `80`.
- `backend`: Flask/Gunicorn API on container port `8001`.

The frontend image expects a local `frontend/nginx.conf` file at build time.
This file is ignored by Git and can contain your personal reverse-proxy/API
proxy setup.

## Docker Deployment

This project uses a simple Docker Compose setup.

- No host ports are published by `docker-compose.yml`.
- Docker services share the private `rpg_world_map` network.
- The external entrypoint should target the `frontend` container on port `80`.
- The frontend Nginx container can proxy API routes to `backend:8001` internally.

Start the stack:

```bash
docker compose up --build
```

Stop the stack:

```bash
docker compose down --volumes --remove-orphans
```

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

## Frontend Notes

- JavaScript modules are served directly as static files, without a bundler.
- Entry modules use query-string versions to avoid stale browser caches after
  frontend code changes.
- Newly-created POI and regions are finalized client-side immediately after the
  API `POST` response so they can be moved, edited, and deleted without a page
  reload.

## V1 Manual Checklist

Before tagging or merging a v1 release, verify:

- The app opens at `http://localhost:8000`.
- The backend answers at `http://localhost:8001/world`.
- Docker mode starts without publishing host ports.
- Docker mode builds the frontend image with the local ignored
  `frontend/nginx.conf`.
- A map can be added with an image.
- A POI can be created, edited, focused, hidden, and deleted.
- A region can be drawn, edited, focused, hidden, and deleted.
- Sidebar map switching still remounts the correct map.
