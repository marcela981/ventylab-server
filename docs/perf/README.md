<!--
  Funcionalidad: Método y entorno de las pruebas de carga
  Descripción: Cómo se miden la carga HTTP (k6) y la de telemetría (mqttx, publicador Node con sello de tiempo y 30 clientes Socket.io), en qué máquina y con qué versiones se midió, cómo repetir las pruebas contra el stack local y cómo medir la latencia en el VPS o con el ventilador real sin publicar nada
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Load tests (block C7)

Results: [`http-results.md`](http-results.md) and [`telemetry-results.md`](telemetry-results.md). Raw k6 and telemetry summaries: [`raw/`](raw/).

Load tests are manual. They never run in `npm run verify` or CI, and they only target the local Docker stack (`run-load.mjs` refuses any non-loopback backend or broker).

## Environment of the recorded run (2026-10-13)

| Item | Value |
|---|---|
| Host | Windows 11 Home 10.0.26200, AMD Ryzen 5 3500U (4 cores / 8 threads), 5.9 GB RAM (low-memory laptop, nothing else running) |
| Docker | Docker Desktop, engine 29.8.0 on WSL2 (VM: 8 CPUs, 2.8 GiB), Compose v5.5.1 |
| Stack | `docker-compose.yml` + `docker-compose.local.yml`, profile `postgres`: backend image built from the working tree (`node:22-alpine`, `NODE_ENV=production`), `postgres:17-alpine`, `eclipse-mosquitto:2.0.20`, `nodered/node-red:4.0.9` |
| Load tools | `grafana/k6:1.3.0` (Docker), `emqx/mqttx-cli:v1.12.1` (Docker), Node.js 22.23.2 on the host with the repository's `socket.io-client` 4.8 and `mqtt` 5 |
| Data | Demo seed (`npx tsx prisma/demo/run-demo-command.ts seed`) plus the load-only data of `scripts/load/seed-load-data.ts` |

All processes share one laptop, so the load generators compete with the backend for CPU. Numbers are an upper bound of what the VPS would show for the same load, not a capacity limit.

## Method

### Load-only data

`scripts/load/seed-load-data.ts` (idempotent; refuses a non-local database or one without the demo marker) adds, on top of the demo seed and never inside it:

- 30 students `load-student-01..30@ventylab.load` (demo password) in one STUDENT group created by the first demo teacher and supervised by the demo teacher group, so both demo teachers can open its analytics panel;
- each load student gets a copy of the progress of a demo student (page, lesson and module progress), and the group gets the evaluation assignments of demo group A;
- a GROUP reservation of the ventilator for that group, active from now for 90 minutes, so the 30 students are the holders of the `ventilator` room.

### HTTP (k6)

`scripts/load/k6/http-load.js`, run in Docker on the stack network (`http://backend:4000`, no Windows port forwarding in the path):

- `students`: 30 VUs (one per load student, JWT from `POST /api/auth/login` in `setup`), each iteration `GET /api/progress/overview`, `/api/progress/summary`, `/api/progress/modules/:moduleId`, `/api/my-evaluations`, `/api/modules/:id/full`, 1 s think time after every request;
- `teachers`: 2 VUs (the two demo teachers), `GET /api/analytics/groups/:groupId/dashboard` of the 30-student group and `GET /api/evaluations`, 1 s think time;
- 3 minutes, constant VUs. Each VU sends its own `X-Forwarded-For` address: the backend trusts one proxy hop and throttles 100 requests/min per client IP, so without it the whole class would share one IP and be throttled, which is not what happens behind Traefik with real students;
- thresholds per endpoint (`p(95) < 1000 ms`, error rate `< 1 %`) only to make k6 export per-endpoint sub-metrics; the summary (`raw/http-summary.json`) has avg, min, p50, p90, p95, p99, max and count per endpoint.

### Telemetry

Two phases of 5 minutes each (after 5 s of warm-up), both with 30 Socket.io clients (`scripts/load/telemetry/measure-latency.mjs`), one per load student, connected with the JWT in the handshake, joined to room `ventilator` by the server because they hold the active reservation:

1. **mqttx**: `mqttx bench pub` in Docker on the stack network, 1 connection, `-im 17` (58.8 msg/s, the closest integer interval to 60 msg/s), QoS 0, device credentials, topic `/ventynet/data`.
2. **Node timestamped publisher**: `scripts/load/telemetry/publish-telemetry.mjs` on the host, 60 msg/s with drift-corrected scheduling, each frame carrying `seq` and `deviceTs = Date.now()` at publish time.

Why two phases: `mqttx bench pub` has no per-message placeholder in the payload (`%i`, `%c` and `%u` only apply to the topic and client id), so its frames carry neither a timestamp nor a sequence number, and mqttx runs inside the Docker VM whose clock is not the host's. The Node publisher runs on the host, the same clock as the 30 clients, so `receive time - deviceTs` is a true end-to-end latency (publisher → broker → backend → Socket.io → client) without clock skew. The mqttx phase measures the same pipeline load with the tool requested for block C7 and reports internal latency and delivery.

Measured per phase:

| Metric | Source | Clock |
|---|---|---|
| End-to-end (`deviceTs` → client) | client, every frame of every client | host only (Node phase) |
| Broker-relative (probe subscriber receives the frame → client receives it) | client + an MQTT subscriber on the host, matched by `seq` | host only |
| Internal processing (`processingMs`: MQTT message received → frame queued) and total (`totalMs`: received → batch emitted) | `GET /api/ventilator/telemetry/metrics` (reset at the start of each phase) | backend monotonic clock |
| `serverTs` → client | client | container vs host clocks (indicative only) |
| Delivery | frames received per client vs messages published / seen by the server | counts |

The backend batches frames every `VENTILATOR_FLUSH_INTERVAL_MS` (33 ms), so up to 33 ms of the end-to-end latency is queue wait by design.

## How to rerun

```text
# 1. Local stack (the host's own Mosquitto, if any, may already use 1883: publish the stack broker elsewhere)
set MQTT_PUBLIC_PORT=11883            # PowerShell: $env:MQTT_PUBLIC_PORT='11883'
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres up -d --build --wait
curl http://127.0.0.1:4000/health/ready

# 2. Demo seed in the stack's Postgres (values from deploy/local/compose.env)
DATABASE_URL=postgresql://ventylab:local-only-postgres@127.0.0.1:55432/ventylab \
DIRECT_URL=postgresql://ventylab:local-only-postgres@127.0.0.1:55432/ventylab \
SUPERADMIN_EMAIL=superadmin@example.com npx tsx prisma/demo/run-demo-command.ts seed

# 3. Load (seeds the load-only data, then HTTP, then both telemetry phases; ~15 min)
npm run test:load                 # or test:load:http / test:load:telemetry
#   options: node scripts/load/run-load.mjs --help (VUs, durations, clients, rate, --out-dir)

# 4. Tear down (removes the volumes)
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres down -v
```

`SUPERADMIN_EMAIL` must match the backend's (`superadmin@example.com` in `deploy/local/compose.env`): the telemetry metrics endpoints are ADMIN only and the runner signs in with that account and the demo password.

## Measuring on the VPS or with the real ventilator

`scripts/load/telemetry/measure-latency.mjs` only listens: it has no publish mode, never sends MQTT messages and never sends ventilator commands (only the `ventilator:join` request a browser also sends). `--reset-metrics` is refused unless the backend is local. `publish-telemetry.mjs` refuses any broker that is not `127.0.0.1`/`localhost` and any command or ack topic, so it cannot reach the VPS broker or the device.

```text
node scripts/load/telemetry/measure-latency.mjs \
  --backend-url https://api.<domain> --token <student JWT holding the active reservation> \
  --clients 5 --duration 120 --metrics-token <ADMIN JWT> --out vps-latency.json
# optional, same-clock broker-relative latency (needs a subscriber account with read on /ventynet/data):
#   --broker-url mqtt://<vps>:1883 --mqtt-username <user> --mqtt-password <pw>
```

With the real ventilator, `endToEndFromDeviceTs` is only meaningful when the device clock is NTP-synchronized with the measuring machine; prefer `brokerRelative` (both timestamps on the measuring machine) and the server's `processingMs`/`totalMs`. Use a student token that holds the active reservation (or a teacher/admin token: those roles also receive `ventilator:telemetry`), and do not run the load phases against the VPS.
