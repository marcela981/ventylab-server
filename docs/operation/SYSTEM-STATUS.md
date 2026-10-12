# System status

Liveness, readiness and the operational status of the server and its dependencies.

## Endpoints

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /`, `/health`, `/api/health` | Public, not throttled | Liveness: the process answers. Static `{ status: "ok", timestamp }`. |
| `GET /health/ready`, `/api/health/ready` | Public, not throttled | Readiness: `SELECT 1` against the database within `HEALTH_CHECK_TIMEOUT_MS`. `200 { status: "ready" }` or `503 { status: "not_ready" }`, no internal details. |
| `GET /api/system/status` | `system:status` (TEACHER, ADMIN) | Global state and per-component status, cached `SYSTEM_STATUS_CACHE_SECONDS`. |
| `POST /api/system/probe/ai/:provider` | `system:probe` (ADMIN) | One minimal real call to an AI provider through the AI gateway. Throttled to 3 per minute. |

## Components

| Component | Source | States |
| --- | --- | --- |
| `database` | `SELECT 1` with timeout; latency in ms | `up`, `down` |
| `mqttBroker` | Ventilator telemetry status: connected, last message, messages/s | `up`, `down`, `not_configured` (no broker URL) |
| `ventilator` | Device staleness (online / no data) and whether a reservation is active now | `up` (online), `down` (offline during an active reservation), `idle` (offline with no active reservation, or the reservation lookup failed), `not_configured` |
| `aiProviders` | Per known provider: configured, circuit breaker (`closed`, `open`, `half_open`), last success and last error (time and error code only, since process start), p95 latency, error rate and calls over the last 15 minutes from AI telemetry. No model is ever called. | `up` (every configured provider available), `degraded` (some configured provider has its breaker open), `down` (no provider available) |
| `storage` | Media storage `checkHealth()` (lists at most one object) | `up`, `down`, `not_configured` (no storage credentials) |
| `process` | Uptime, RSS, heap used, mean event loop delay since the previous reading (`perf_hooks.monitorEventLoopDelay`), app version (`APP_VERSION` or `package.json`), commit (`APP_COMMIT_SHA` or `GIT_COMMIT`), simulation engine version | always `up` |

## Global state rules

Implemented in `evaluateSystemState` (`src/features/system-status/domain/system-status.ts`):

| Condition | Global state |
| --- | --- |
| Database `down` | `DOWN` |
| MQTT broker `down` | `DEGRADED` |
| Ventilator `down` (offline during an active reservation) | `DEGRADED` |
| AI providers `down` (every provider unconfigured or with its breaker open) | `DEGRADED` |
| Storage `down` | `DEGRADED` |
| Anything else (including `idle`, `not_configured` and a partially degraded AI set) | `OK` |

## Checks and timeouts

Database ping, active reservation lookup, AI telemetry metrics and the storage check run in parallel, each bounded by `HEALTH_CHECK_TIMEOUT_MS` (default 2000 ms, 100–10000). A check that fails or times out counts as unavailable (`down` for database and storage, unknown for the reservation and AI metrics) and never blocks the endpoint. Broker, ventilator, breaker and process readings are in-memory. Concurrent requests share one evaluation; results are cached for `SYSTEM_STATUS_CACHE_SECONDS` (default 5, validated 5–10).

## Change notifications

Every evaluation is compared with the previous one. When the global state or any component state changes, the server emits `system:status-changed` once to the `role:ADMIN` and `role:TEACHER` rooms:

```json
{
  "state": "DEGRADED",
  "previousState": "OK",
  "changedComponents": [{ "component": "mqttBroker", "state": "down", "previousState": "up" }],
  "checkedAt": "2026-10-11T15:04:05.000Z"
}
```

The first evaluation after start only sets the baseline. Clients never poll; evaluations are triggered by:

- requests to `GET /api/system/status` once the cache expired;
- MQTT connection changes (`IMqttConnection.onConnectionChange`);
- the bus events `ventilator.deviceOffline` and `ventilator.deviceOnline`;
- an AI probe (the breaker state may have changed);
- a server timer every 30 s that only runs while at least one ADMIN or TEACHER socket is connected (presence from `realtime.client-authenticated` / `realtime.client-disconnected`), to catch database or broker outages that produce no event.

## AI probe

`POST /api/system/probe/ai/:provider` sends a fixed tiny prompt (`HEALTH_PROBE_PROMPT`, version `1.0.0`) with 8 output tokens, temperature 0 and a 10 s timeout, in one attempt without retries. The call updates the provider's circuit breaker and is recorded in `ai_call_logs` like any other call, with `refType = "health_probe"` and `refId = <provider>`. Because `ai_call_logs.use_case` is a database enum, probes are logged under the `TOPIC_CHECK` use case; filter them out by `refType`. No quota applies (no user is attached). Unknown provider: 404; known provider without credentials: 422. A provider failure is returned as `ok: false` with an error code, never as an HTTP error.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `HEALTH_CHECK_TIMEOUT_MS` | 2000 | 100–10000; readiness and every status check |
| `SYSTEM_STATUS_CACHE_SECONDS` | 5 | 5–10 |
| `APP_VERSION` | `package.json` version | optional |
| `APP_COMMIT_SHA` | — | optional; `GIT_COMMIT` is accepted as an alias |
