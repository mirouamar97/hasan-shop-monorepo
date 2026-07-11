#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${CI_LOG_DIR:-$ROOT/ci-logs}"

if [[ -d "$LOG_DIR" ]]; then
  for pidfile in "$LOG_DIR"/*.pid; do
    [[ -f "$pidfile" ]] || continue
    pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
fi

cd "$ROOT"
docker compose down -v --remove-orphans 2>/dev/null || docker compose down --remove-orphans || true

echo "CI stack stopped."
