<!--
  Funcionalidad: Evidencia del bloque F de calidad (despliegue y operación)
  Descripción: Archivos de despliegue y operación (imagen Docker, migraciones automáticas, docker-compose de producción y local, Mosquitto con ACL, CI, respaldos, Sentry y variables de entorno), decisiones, cómo validarlos y verificaciones observadas
  Versión: 1.1
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block F verification — deploy and operations files

Written on 2026-10-12, Windows 11, Docker Compose v5.5.1, branch `main` (uncommitted working tree). Nothing was deployed and no image was built or container started in this block (low-memory machine, other suites running); only static validation was done. The full local run below is left to the author.

## Files

| File | What it does |
|---|---|
| `Dockerfile` | Multi-stage on `node:22-alpine`: `build` (full `npm ci`, `prisma generate`, `nest build`), `deps` (`npm ci --omit=dev`), `prisma-cli` (Prisma CLI pinned to the lockfile version, installed apart with its engines), `runtime` (prod `node_modules` + generated client + CLI + `dist` + `prisma/schema.prisma` + `prisma/migrations`), user `node`, `HEALTHCHECK` on `/health/ready` with Node's `fetch`, entrypoint below. |
| `.dockerignore` | Keeps `.env*`, `node_modules`, `dist`, tests, docs, scripts and tooling out of the build context. |
| `deploy/docker-entrypoint.sh` | Runs `prisma migrate deploy` (through `DIRECT_URL`) before `exec`-ing the app; exits non-zero, so the container never starts the app, when `DATABASE_URL`/`DIRECT_URL` are missing or a migration fails. |
| `docker-compose.yml` | VPS stack: `backend`, `mosquitto-auth` (one-shot passwd generator), `mosquitto`, `node-red`, optional `postgres` (`profiles: [postgres]`); named volumes, healthchecks on all long-running services, Traefik/Dokploy labels. |
| `docker-compose.local.yml` | Local override: no external network, backend on `127.0.0.1:4000`, Postgres on `127.0.0.1:55432`, backend waits for Postgres. |
| `deploy/local/compose.env` | Local-only dummy values (interpolation + backend env). Not secrets; never use on a server. |
| `deploy/mosquitto/mosquitto.conf` | `allow_anonymous false`, password file, ACL file, persistence, stdout logs. |
| `deploy/mosquitto/acl` | Per-user topic ACL (backend, Node-RED, device, healthcheck); everything else denied. |
| `deploy/mosquitto/generate-passwd.sh` | Builds `/mosquitto/auth/passwd` (salted hashes, `0600`, owner `mosquitto`) from `MQTT_*_USERNAME/PASSWORD` on every start, into the `mosquitto_auth` volume. |
| `.github/workflows/ci.yml` | `verify` job on every push and pull request (Node 22, npm cache, `npm ci`, `npm run verify` with the runner's Docker, `npm run build`); `image` job on pushes to `main` only, after `verify`: Buildx build with GHA cache, pushed to GHCR only when the repository variable `PUBLISH_IMAGE` is `true`. No deploy step. |
| `scripts/backup/pg-backup.sh` | `pg_dump --format=custom` of `public`, timestamped UTC file, atomic rename, retention pruning. |
| `scripts/backup/pg-restore.sh` | `pg_restore --clean --if-exists --single-transaction --exit-on-error`, only with `--confirm <target db name>` matching the URL. |
| `docs/operations/backup-restore.md` | Backup, schedule, restore and the restore test (throwaway container + per-table counts). |
| `docs/operations/environment-variables.md` | Every variable of `env.validation.ts`, those read outside it, and the compose interpolation variables. |
| `deploy/env.example.proposed` | Ready-to-copy `.env.example` content with non-real values. |

`src/instrument.ts` and `sentry-config.ts` were checked and left unchanged: `Sentry.init` runs only when `readSentryConfig()` returns a `dsn`, which is `undefined` for an unset or empty `SENTRY_DSN`.

## Decisions

- **Prisma CLI in the runtime image**: `prisma` is a devDependency, so `npm ci --omit=dev` drops it. Instead of shipping all dev dependencies, the `prisma-cli` stage installs exactly the lockfile's `prisma` version in `/opt/prisma-cli` (its install scripts download the schema engine at build time; `prisma --version` fails the build otherwise). The generated client comes from the `build` stage, as before.
- **Migrations always run at start**: no flag to skip them. Prisma takes an advisory lock, so two replicas starting at once do not race. `prisma/migrations/*.sql` is gitignored in this repo: the image built from a git checkout (CI) only contains migrations that were added with `git add -f`.
- **Healthcheck = readiness**: `/health/ready` pings the database, so a database outage marks the container unhealthy. Traefik's Docker provider stops routing to unhealthy containers, so during an outage the proxy answers 503 instead of the app. `start_period` 90 s covers migrations.
- **Mosquitto credentials from environment**: no password file is committed. A one-shot `mosquitto-auth` service (same image, `mosquitto_passwd -b`) writes the hashed file into a volume that the broker mounts read-only. Rotating a password = change the variable and `docker compose up -d` (the generator reruns, then restart the broker: `docker compose restart mosquitto`).
- **Broker exposure**: the broker port is bound to `127.0.0.1` by default. The physical ventilator needs `MQTT_BIND_ADDRESS=0.0.0.0` (plus a firewall rule limiting source IPs). This listener is plain MQTT with passwords; a TLS listener (8883 with certificates) is not configured here.
- **Node-RED** is not routed through Traefik and its editor is on `127.0.0.1:1880` only (SSH tunnel: `ssh -L 1880:127.0.0.1:1880 <vps>`). Before exposing it, set `adminAuth` in `/data/settings.js` (volume `node_red_data`). Flows read the broker host and credentials from `MQTT_BROKER_HOST`, `MQTT_NODERED_USERNAME`, `MQTT_NODERED_PASSWORD` (`${...}` in the broker node).
- **Postgres optional**: base compose works with Supabase through `DATABASE_URL`/`DIRECT_URL`; `--profile postgres` adds the bundled server (then point both URLs at `postgres:5432`). The backend `depends_on: postgres` is `required: false`, so it is ignored when the profile is off.
- **Traefik/Dokploy**: router on `websecure` with `tls.certresolver` (`letsencrypt` by default), HTTP router that only redirects to HTTPS, service port 4000, external network `dokploy-network` (`TRAEFIK_NETWORK`). Socket.io (`/socket.io`, long-polling then WebSocket upgrade) works through Traefik without extra labels; with a single backend replica no sticky sessions are needed (more replicas would need sticky cookies and a Socket.io adapter). **SSE** (`/api/tutor/...` and `/api/simulation/sessions/{id}/assist`, `text/event-stream`): no `compress` or `buffering` middleware is attached to the router (both would hold events back); Traefik flushes `text/event-stream` responses immediately, and the app itself skips compression for that content type. If the domain is configured in the Dokploy UI instead, Dokploy generates its own labels: keep it without middlewares and do not duplicate the router.
- **CI triggers**: every push and every pull request (previously only some branches). Publishing is opt-in through a repository variable, never a default; the `GITHUB_TOKEN` (`packages: write` in that job only) is the only credential.
- **Backups**: only the `public` schema (Prisma's), so Supabase internals are not dumped and a restore into vanilla PostgreSQL works; the restore runs in one transaction so a failure leaves the target unchanged.

## How to validate

### Static (no containers)

```text
docker compose -f docker-compose.yml --env-file <dummy env> config -q
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres config -q
docker compose -f compose.development.yml config -q
bash -n deploy/docker-entrypoint.sh deploy/mosquitto/generate-passwd.sh scripts/backup/pg-backup.sh scripts/backup/pg-restore.sh
```

### Full local stack (author)

```text
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres up -d --build --wait
```

`--wait` returns 0 only when `postgres`, `mosquitto`, `node-red` and `backend` are healthy (and `mosquitto-auth` completed). Then:

```text
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres ps
curl -i http://127.0.0.1:4000/health/ready          # 200 {"status":"ready"}
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres logs backend | grep -i "migrat"
# Auth: the device user can connect and publish telemetry; an unknown user is rejected
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres exec mosquitto mosquitto_pub -h 127.0.0.1 -u ventylab-device -P local-only-device-mqtt -t /ventynet/data -m '{}' -d
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres exec mosquitto mosquitto_pub -h 127.0.0.1 -u nobody -P wrong -t /ventynet/data -m '{}'   # connection refused: not authorised
# Tear down (removes the local volumes)
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres down -v
```

The backend logs as `NODE_ENV=production` (JSON lines); `/api/docs` answers 404 without an ADMIN token, as designed.

## Observed (static only)

| Command | Result |
|---|---|
| `docker compose -f docker-compose.yml --env-file <scratch dummy env> config -q` | exit 0 |
| same with `--profile postgres` | exit 0 |
| `docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres config -q` | exit 0 (rendered: `edge` network `ventylab-local-edge` not external, backend `depends_on` mosquitto + postgres healthy, env from `deploy/local/compose.env`) |
| `docker compose -f compose.development.yml config -q` | exit 0 (file unchanged) |
| `node -e` + `yaml.parse` of `ci.yml`, `docker-compose.yml`, `docker-compose.local.yml` | OK (jobs `verify,image`; services `backend,mosquitto-auth,mosquitto,node-red,postgres`) |
| `bash -n` on the 4 shell scripts | OK; no CR line endings |
| `pg-restore.sh` with `--confirm` not matching the URL database / without `--confirm`; `pg-backup.sh` with invalid retention | exit 1 / 2 / 1, nothing executed |

Not run: `docker build`, `docker compose up`, the restore test, the CI workflow on GitHub, and `npx tsc` (no `.ts` file changed).

## Observed: full local stack (2026-10-13, block C7)

Run by the C7 load-test writer on the same laptop (Docker Desktop 29.8.0, Compose v5.5.1), working tree of `main`.

| Command | Result |
|---|---|
| `docker compose ... --profile postgres up -d --build --wait` (first attempt) | image built (multi-stage, `nest build` OK); start failed: `ports are not available: exposing port TCP 127.0.0.1:1883 ... bind: Only one usage of each socket address`. Cause: a Mosquitto service installed on the Windows host already listens on 127.0.0.1:1883 / [::1]:1883 (not part of the stack, left untouched). No file change needed: the port is already configurable. |
| `MQTT_PUBLIC_PORT=11883 docker compose ... --profile postgres up -d --wait` | exit 0; `postgres`, `mosquitto`, `node-red`, `backend` healthy, `mosquitto-auth` exited 0 |
| `docker compose ... ps` | backend `Up (healthy)` 127.0.0.1:4000, mosquitto `Up (healthy)` 127.0.0.1:11883, node-red `Up (healthy)` 127.0.0.1:1880, postgres `Up (healthy)` 127.0.0.1:55432 |
| `docker compose ... logs backend` | entrypoint `applying database migrations (prisma migrate deploy)`, 26 migrations found and applied, app started |
| `curl -i http://127.0.0.1:4000/health/ready` | `200 {"status":"ready"}` |
| Demo seed against the stack Postgres (`DATABASE_URL`/`DIRECT_URL` = `127.0.0.1:55432`, `SUPERADMIN_EMAIL=superadmin@example.com`, `npx tsx prisma/demo/run-demo-command.ts seed`) | `Demo seed finished in 7935 ms`; demo teacher, student and superadmin logins OK |
| Backend MQTT ingest from the stack broker (device credentials, `/ventynet/data`) | 0 invalid / 0 lost over 35 230 frames in the C7 telemetry load (docs/perf/telemetry-results.md) |
| `docker compose ... --profile postgres down -v` | exit 0, 4 volumes removed; `docker ps` without stack containers |

When the host already runs its own broker on 1883, start the local stack with `MQTT_PUBLIC_PORT=<free port>` (for example 11883). Not run in this pass: the mosquitto auth checks with `mosquitto_pub` above (the backend user's subscription and the device user's publications were exercised by the load test instead) and the restore test.
