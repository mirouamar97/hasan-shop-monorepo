# HASAN SHOP — Monitoring Guide (M3.5)

**Last Updated**: 2026-07-10  
**Scope**: Health endpoints, logging, alerts, observability hooks

---

## Health Endpoints

### API — `GET /api/v1/health`

Primary liveness/readiness probe for the NestJS API.

**Response shape:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-07-10T12:00:00.000Z",
  "services": {
    "database": "up",
    "redis": "up",
    "meilisearch": "up"
  }
}
```

| `status` | Meaning |
|----------|---------|
| `ok` | All probed services `up` |
| `degraded` | Mixed state (not currently emitted — reserved) |
| `error` | At least one service `down` |

### Probed dependencies

| Service | Check method |
|---------|--------------|
| PostgreSQL | Drizzle `SELECT` via `HealthRepository.ping()` |
| Redis | `PING` command |
| Meilisearch | HTTP `GET {MEILISEARCH_HOST}/health` |

### Not yet probed via API

| Service | Status | Workaround |
|---------|--------|------------|
| MinIO / S3 | Not in `/health` | Docker healthcheck + upload smoke test |
| Carrier APIs | External | Monitor shipment error rates in app logs |

### Other useful endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/settings/public` | Smoke test — confirms DB + settings readable |
| `GET /api/v1/auth/csrf` | Auth bootstrap health (CSRF cookie issuance) |

### Recommended probe configuration

| Environment | Interval | Timeout | Failure threshold |
|-------------|----------|---------|-------------------|
| Production LB | 30s | 5s | 3 consecutive failures → drain |
| Kubernetes | 10s (liveness), 30s (readiness) | 3s | Restart / remove from service |
| Uptime monitor | 60s | 10s | Page on 2 failures |

```bash
curl -sf https://api.hasan-shop.dz/api/v1/health | jq '.status'
```

---

## Logging

### Configuration

| Variable | Default | Production |
|----------|---------|------------|
| `LOG_LEVEL` | `info` | `info` or `warn` |
| `LOG_FORMAT` | `json` | `json` (required for aggregation) |

Logging uses `@hasan-shop/logger` (Pino). JSON logs include timestamp, level, message, and contextual fields.

### What to log

| Area | Level | Fields |
|------|-------|--------|
| HTTP errors (5xx) | `error` | route, status, correlation ID |
| Auth failures | `warn` | email (hashed), IP, lockout state |
| Order status changes | `info` | orderId, fromStatus, toStatus, actorId |
| Shipment creation failures | `warn` | orderId, carrier, error (non-blocking) |
| Webhook rejections | `warn` | carrier, reason (signature, replay, timestamp) |
| Automation side effects | `info` | orderId, action (fulfillment init, inventory release) |

### Log shipping

In production, ship stdout to your aggregator (Datadog, Loki, CloudWatch, etc.). Enable `OTEL_ENABLED=true` when OpenTelemetry collector is available:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

---

## Metrics (Recommended)

Not all metrics are instrumented in M3.5. Recommended dashboards:

| Metric | Type | Alert threshold |
|--------|------|-----------------|
| `health_status` | Gauge | `!= ok` for 2 min |
| `http_request_duration_p95` | Histogram | > 2s on checkout |
| `order_created_total` | Counter | Drop > 50% vs 24h baseline |
| `webhook_rejected_total` | Counter | Spike > 10/min |
| `db_connection_errors` | Counter | Any sustained increase |
| `redis_errors` | Counter | Any in 5 min window |
| `low_stock_alerts` | Counter | Informational daily digest |

---

## Alerts

### P0 — Page immediately

| Alert | Condition |
|-------|-----------|
| API down | Health check fails 3× in 5 min |
| Database down | `services.database = down` |
| Redis down | `services.redis = down` (blocks sessions + lockout) |
| Error rate spike | 5xx > 5% of requests over 5 min |

### P1 — Notify on-call (business hours)

| Alert | Condition |
|-------|-----------|
| Meilisearch degraded | `services.meilisearch = down` (search broken, checkout OK) |
| Webhook auth failures | > 20 rejected webhooks/hour |
| Disk / volume usage | Postgres or MinIO > 80% |
| Backup failure | Scheduled backup job failed |

### P2 — Daily review

| Alert | Condition |
|-------|-----------|
| Low stock items | `fetchLowStock` count > threshold |
| Carrier API latency | P95 quote latency > 5s |
| Coverage regression | CI coverage below 60% API target |

---

## CI Monitoring

GitHub Actions `CI` workflow provides build-time signals:

- `lint-and-typecheck` — static analysis
- `test` — unit + integration + coverage artifact
- `smoke` — API boot verification
- `build` — compile all apps

Failed `smoke` or `test` jobs block merge to `main`/`develop`.

---

## Incident Response Quick Reference

1. Check `GET /api/v1/health` and Docker `docker compose ps`
2. Review recent deploys and migration runs
3. Inspect API logs for 5xx and webhook rejection spikes
4. Verify Postgres connectivity (`DATABASE_URL`, SSL, connection pool)
5. Verify Redis (`REDIS_URL`, memory, eviction policy)
6. Roll back application containers before rolling back DB schema
7. Restore from backup if data corruption suspected — see `BACKUP_RECOVERY.md`

---

## Future Observability (M4+)

- [ ] MinIO health probe in `/api/v1/health`
- [ ] OpenTelemetry traces on checkout and fulfillment paths
- [ ] SLO dashboards for checkout success rate and track lookup latency
- [ ] Synthetic E2E monitors against production storefront
