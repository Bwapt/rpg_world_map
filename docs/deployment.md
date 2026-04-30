# Deployment

This project supports multiple deployment strategies for different use cases.

## Docker Configurations

### 1. Production-like Setup (with nginx)

The traditional setup uses nginx as a reverse proxy:

```text
Internet
  -> nginx:80
  -> frontend:80 (static files)
  -> backend:8001 (API)
```

**Use when:**
- You want production-like architecture
- Single entry point for the application
- Clean URL routing without CORS complexity
- Preparing for real production deployment

**Start:**
```bash
docker compose --profile nginx up --build
```

### 2. Development Setup (direct ports)

Simplified setup without nginx:

```text
Internet
  -> frontend:8000 (static files)
  -> backend:8001 (API)
```

**Use when:**
- Development and testing
- Debugging individual services
- Simpler Docker setup
- No need for nginx complexity

**Start:**
```bash
docker compose up --build
```

## Architecture

Nginx reaches containers by Docker service name:

- `frontend:80`
- `backend:8001`

## Production Start

Cloudflare Tunnel is optional. The main app stack does not require a Cloudflare domain to run locally.

Create `.env` from the example:

```bash
cp .env.example .env
```

Set the tunnel token only if you want to use Cloudflare Tunnel:

```env
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token
```

Start the stack with the tunnel profile:

```bash
docker compose --profile nginx --profile tunnel up -d --build
```

Check containers:

```bash
docker compose --profile nginx --profile tunnel ps
```

Follow logs:

```bash
docker compose logs -f nginx cloudflared
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

For a local smoke test without Cloudflare, use the nginx profile:

```bash
docker compose --profile nginx up -d --build
```

Then open:

```text
http://localhost:8080
```

Stop the local stack:

```bash
docker compose down
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
docker compose --profile nginx --profile tunnel up -d --build
```

Restart only the backend:

```bash
docker compose restart backend
```

Inspect the private network:

```bash
docker network inspect rpg-world-map
```
