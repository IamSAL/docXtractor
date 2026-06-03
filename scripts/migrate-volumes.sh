#!/usr/bin/env bash
# Migrate Docker named volumes to host-mounted folders under ./data/
# Run once on an existing deployment, then bring the stack back up.
# Safe to re-run: skips copy if destination already has content.
set -euo pipefail

ENV="${1:-prod}"  # prod | stage | dev

case "$ENV" in
  prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    PG_VOLUME="docxtractor_postgres_data"
    MINIO_VOLUME="docxtractor_minio_data"
    REDIS_VOLUME="docxtractor_redis_data"
    PG_DST="./data/postgres"
    MINIO_DST="./data/minio"
    REDIS_DST="./data/redis"
    ;;
  stage)
    COMPOSE_FILE="docker-compose.stage.yml"
    PG_VOLUME="docxtractor_stage_postgres_data"
    MINIO_VOLUME="docxtractor_stage_minio_data"
    REDIS_VOLUME="docxtractor_stage_redis_data"
    PG_DST="./data/stage-postgres"
    MINIO_DST="./data/stage-minio"
    REDIS_DST="./data/stage-redis"
    ;;
  dev)
    COMPOSE_FILE="docker-compose.yml"
    PG_VOLUME="docxtractor_postgres_data"
    MINIO_VOLUME="docxtractor_minio_data"
    REDIS_VOLUME=""
    PG_DST="./data/postgres"
    MINIO_DST="./data/minio"
    REDIS_DST=""
    ;;
  *)
    echo "Usage: $0 [prod|stage|dev]" >&2
    exit 1
    ;;
esac

copy_volume() {
  local vol="$1"
  local dst="$2"
  local label="$3"

  if [ -z "$vol" ]; then return; fi

  # Check volume exists
  if ! docker volume inspect "$vol" > /dev/null 2>&1; then
    echo "  [skip] volume $vol does not exist (nothing to migrate)"
    return
  fi

  mkdir -p "$dst"

  # Skip if destination already has content
  if [ -n "$(ls -A "$dst" 2>/dev/null)" ]; then
    echo "  [skip] $dst already has content — not overwriting"
    return
  fi

  echo "  Copying $label ($vol → $dst) ..."
  docker run --rm \
    -v "${vol}:/src:ro" \
    -v "$(pwd)/${dst#./}:/dst" \
    alpine sh -c "cp -a /src/. /dst/"
  echo "  Done."
}

echo "=== DocXtractor volume migration ($ENV) ==="
echo "Stopping stack..."
docker compose -f "$COMPOSE_FILE" down

echo "Migrating postgres..."
copy_volume "$PG_VOLUME" "$PG_DST" "postgres"

echo "Migrating minio..."
copy_volume "$MINIO_VOLUME" "$MINIO_DST" "minio"

if [ -n "$REDIS_DST" ]; then
  echo "Migrating redis..."
  copy_volume "$REDIS_VOLUME" "$REDIS_DST" "redis"
fi

echo ""
echo "Migration complete. Bring the stack back up with:"
echo "  docker compose -f $COMPOSE_FILE up -d"
