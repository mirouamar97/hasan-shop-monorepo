#!/usr/bin/env bash
# Assert Docker Compose services are healthy (health-checked containers + HTTP probes).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Services with Docker HEALTHCHECK definitions
docker_health_services=(postgres redis meilisearch)

for svc in "${docker_health_services[@]}"; do
  status="$(docker inspect --format='{{.State.Health.Status}}' "hasan-shop-${svc}" 2>/dev/null || echo "missing")"
  if [[ "$status" != "healthy" ]]; then
    echo "Service hasan-shop-${svc} is not healthy (status=${status})" >&2
    docker compose ps >&2
    docker compose logs --tail=50 "$svc" >&2 || true
    exit 1
  fi
  echo "Docker healthy: $svc"
done

# MinIO image has no curl/mc — verify via host HTTP probe
if ! docker inspect hasan-shop-minio >/dev/null 2>&1; then
  echo "Container hasan-shop-minio is not running" >&2
  docker compose ps >&2
  exit 1
fi
echo "Docker running: minio"

# HTTP-level probes (poll until success or timeout)
bash "$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:7700/health" 60
bash "$ROOT/scripts/ci/wait-for-url.sh" "http://localhost:9000/minio/health/live" 60

echo "All infrastructure services verified."
