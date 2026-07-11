#!/bin/sh
# HASAN SHOP — PostgreSQL backup script
# Usage: ./docker/backup/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hasan_shop_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)"

PGPASSWORD="${POSTGRES_PASSWORD:-hasan_shop_dev}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-hasan_shop}" \
  -d "${POSTGRES_DB:-hasan_shop}" \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "hasan_shop_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup completed at $(date)"
