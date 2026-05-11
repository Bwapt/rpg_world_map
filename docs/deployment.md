# Deployment

This project uses Docker Compose to run a simple local frontend/backend stack.

## Docker Setup

The stack includes:

- `frontend`: static web app served on container port `80`.
- `backend`: Flask/Gunicorn API on container port `8001`.
- `rpg_world_map`: private Docker network shared by both services.

`docker-compose.yml` publishes the local development ports:

- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8001`

## Routing

In local Docker mode, the browser loads the frontend from `localhost:8000` and
the API from `localhost:8001`.

The frontend HTTP client automatically targets `localhost:8001` when the app is
opened on port `8000`. API endpoints are served by the backend:

- `/world`
- `/maps`
- `/poi`
- `/area`

## Start The Stack

```bash
docker compose up -d --build
```

## Stop The Stack

```bash
docker compose down --volumes --remove-orphans
```

## Local Non-Docker Mode

For direct local development without Docker:

```bash
./run.sh
```

or:

```bash
npm start
```

This mode exposes:

- Frontend: `http://localhost:8000`
- Backend: `http://localhost:8001`

## Persistence

- Uploaded map images are persisted on the host in `frontend/assets/maps/`.
- JSON world data is persisted on the host in `backend/data/maps.json`.

The backend writes uploaded images to its mounted `/app/frontend/assets/maps`
path. The frontend serves the same host directory read-only from
`/app/assets/maps`.

## Frontend Cache

The frontend is served as native JavaScript modules without a bundler. Module
entrypoints use query-string versions to avoid stale module code after redeploys.

## Useful Commands

Rebuild and start:

```bash
docker compose up -d --build
```

Restart only the frontend:

```bash
docker compose up -d --build frontend
```

Check containers:

```bash
docker compose ps
```

Inspect the private network:

```bash
docker network inspect rpg_world_map
```
