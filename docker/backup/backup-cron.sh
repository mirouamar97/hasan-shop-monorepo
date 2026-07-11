#!/bin/sh
# HASAN SHOP — scheduled PostgreSQL backups (production Docker)
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
INTERVAL_SEC="${BACKUP_INTERVAL_SEC:-86400}"

run_backup() {
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/hasan_shop_${TIMESTAMP}.sql.gz"
  mkdir -p "$BACKUP_DIR"
  echo "[$(date -Iseconds)] Starting backup..."
  PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST:-postgres}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "${POSTGRES_USER:-hasan_shop}" \
    -d "${POSTGRES_DB:-hasan_shop}" \
    --no-owner --no-acl | gzip > "$BACKUP_FILE"
  find "$BACKUP_DIR" -name "hasan_shop_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
  echo "[$(date -Iseconds)] Backup saved: $BACKUP_FILE"
}

if [ "${BACKUP_ENABLED}" != "true" ]; then
  echo "BACKUP_ENABLED=false — service idle"
  exec tail -f /dev/null
fi

echo "Backup service active (interval ${INTERVAL_SEC}s)"
while true; do
  run_backup
  sleep "$INTERVAL_SEC"
done
