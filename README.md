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

#### Option 1: With nginx proxy (recommended for production-like setup)

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start the local stack with nginx proxy:

```bash
npm run docker:up
```

3. Stop the local stack:

```bash
npm run docker:down
```

The app is available at:

- Frontend: `http://localhost:8080`

#### Option 2: Direct ports (simpler for development)

For development without nginx complexity:

```bash
npm run docker:dev:up
```

This exposes:
- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8001`

Stop with:

```bash
npm run docker:down
```

Docker launch (Cloudflare Tunnel):

This mode is optional and only required if you want to expose the app through Cloudflare Tunnel.

1. Set up Cloudflare Tunnel:
   - Create a tunnel in Cloudflare Zero Trust dashboard
   - Get the tunnel token
   - Configure the tunnel to route your hostname (e.g., `maps.yourdomain.com`) to `http://host.docker.internal:8080` (or your host IP:8080 if host.docker.internal doesn't work)

2. Copy the example environment file and configure:

```bash
cp .env.example .env
# Edit .env to add your CLOUDFLARED_TOKEN
```

3. Start the stack with the tunnel profile:

```bash
npm run docker:tunnel:up
```

4. Stop the stack:

```bash
npm run docker:down
```

The public app endpoint is your configured Cloudflare hostname, for example:

- `https://maps.yourdomain.com`

The script starts:

- Flask API from `backend/app.py`.
- Static frontend server from `frontend/`.

## Docker Deployment

The project supports multiple Docker configurations:

### Production-like setup (with nginx)
- Uses nginx as reverse proxy for clean URL routing
- Frontend and backend communicate through internal Docker network
- Single entry point at `http://localhost:8080`
- Recommended for production deployment or when you want the full stack experience

### Development setup (direct ports)
- No nginx complexity
- Frontend and backend exposed on separate ports
- CORS enabled for cross-origin requests
- Simpler for development and debugging

Both setups support the optional Cloudflare Tunnel overlay for public access.

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
