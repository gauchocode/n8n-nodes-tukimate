# Docker Rebuild

Rebuild and restart Docker containers.

## Usage

```
/rebuild [options]
```

**Options:**
- `(sin argumentos)` - Rebuild normal: `docker compose build && docker compose up -d`
- `no-cache` o `full` - Rebuild completo: `docker compose build --no-cache && docker compose up -d`
- `app` - Solo el contenedor app: `docker compose build app && docker compose up -d`

## Examples

- `/rebuild` - Rebuild rápido
- `/rebuild no-cache` - Rebuild desde cero (si hay problemas de cache)
- `/rebuild app` - Solo rebuild del contenedor de la app

## When to use

- Changes to `Dockerfile` or `docker-compose.yml`
- Changes to `next.config.js` or `tailwind.config.ts`
- New dependencies installed
- Hot reload not reflecting changes
- User explicitly requests rebuild

## Execution

Run from the project root:

```bash
# Normal
docker compose build && docker compose up -d

# No cache
docker compose build --no-cache && docker compose up -d

# Only app
docker compose build app && docker compose up -d
```
