# Deployment

This project is designed to run behind a private Docker network.

Only Cloudflare Tunnel reaches the stack from the outside. The frontend, backend, and Nginx services do not expose public host ports in the production compose file.

## Architecture

```text
Internet
  -> Cloudflare DNS maps.bwaptremotenetwork.com
  -> Cloudflare Tunnel
  -> cloudflared container
  -> nginx container
  -> frontend container
  -> backend container
```

Nginx reaches containers by Docker service name:

- `frontend:80`
- `backend:8001`

## Production Start

Create `.env` from the example:

```bash
cp .env.example .env
```

Set the tunnel token:

```env
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token
```

Start the stack with the tunnel profile:

```bash
docker compose --profile tunnel up -d --build
```

Check containers:

```bash
docker compose --profile tunnel ps
```

Follow logs:

```bash
docker compose --profile tunnel logs -f nginx cloudflared
```

## Cloudflare Tunnel Target

In Cloudflare Zero Trust, the public hostname should be:

```text
maps.bwaptremotenetwork.com
```

The tunnel service target should be:

```text
http://nginx:80
```

Because `cloudflared` and `nginx` share the same Docker network, Cloudflare only needs the internal service name.

## Local Docker Test

For a local smoke test without Cloudflare, use the local override file:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build backend frontend nginx
```

Then open:

```text
http://localhost:8080
```

Stop the local stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

## Persistence

The JSON world data is persisted on the host:

```text
backend/data/maps.json
```

Uploaded map images are persisted on the host and shared with the frontend container:

```text
frontend/assets/maps/
```

## Routing

The browser calls the same origin in production. Nginx routes API endpoints to the backend:

- `/world`
- `/maps`
- `/poi`
- `/area`

All other requests go to the frontend container.

## Useful Commands

Rebuild after code changes:

```bash
docker compose --profile tunnel up -d --build
```

Restart only the backend:

```bash
docker compose restart backend
```

Inspect the private network:

```bash
docker network inspect rpg-world-map
```
