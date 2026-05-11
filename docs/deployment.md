# Deployment

This project uses Docker Compose to run the frontend and backend as private
containers on the same Docker network.

## Docker Setup

The stack includes:

- `frontend`: Nginx serving the static web app on container port `80`.
- `backend`: Flask/Gunicorn API on container port `8001`.
- `rpg_world_map`: private Docker network shared by both services.

`docker-compose.yml` does not publish host ports.

The frontend image expects a local `frontend/nginx.conf` file at build time.
That file is ignored by Git and can contain environment-specific routing.

## Routing

In Docker mode, the browser should reach the app through your external entrypoint
targeting the `frontend` container.

The local frontend Nginx config can proxy API routes to `backend:8001` on the
private Docker network. API endpoints are served by the backend:

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
`/usr/share/nginx/html/assets/maps`.

## Frontend Cache

The frontend is served as native JavaScript modules without a bundler. Module
entrypoints use query-string versions to avoid stale module code after redeploys.
Your local `frontend/nginx.conf` may also set cache headers if needed.

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
