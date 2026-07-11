#!/usr/bin/env bash
# HASAN SHOP — one-command production deployment (Docker Compose)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"

echo "=== HASAN SHOP Production Deploy ==="

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Creating $ENV_FILE from .env.production.example — EDIT SECRETS before production use"
  cp .env.production.example "$ENV_FILE"
fi

echo "=== Building images ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" build

echo "=== Starting stack (migrations run first) ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

echo "=== Waiting for health ==="
bash "$ROOT/scripts/deploy/validate-deployment.sh" --env-file "$ENV_FILE"

echo "=== Deploy complete ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
