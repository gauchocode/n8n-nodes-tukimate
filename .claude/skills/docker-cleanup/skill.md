# Docker Cleanup

Clean up unused Docker resources to free disk space.

## Usage

```
/cleanup [option]
```

**Options:**
- `quick` - Limpieza rápida: contenedores parados, redes huérfanas, imágenes colgantes
- `images` - Elimina imágenes no usadas (más agresivo)
- `full` - Limpieza completa: imágenes, volúmenes, redes (⚠️ requiere re-download de imágenes)
- `volumes` - Solo volúmenes no usados

**Default:** `quick` si no se especifica

## Commands

```bash
# Quick (safe)
docker system prune -f

# Images (aggressive)
docker image prune -a -f

# Full (very aggressive)
docker system prune -a -f --volumes

# Volumes only
docker volume prune -f
```

## Space check

```bash
# Ver espacio usado
docker system df
```

## Warnings

- `full` elimina todas las imágenes no usadas → próximo rebuild será más lento
- `volumes` puede eliminar datos de bases de datos locales si no están en uso
