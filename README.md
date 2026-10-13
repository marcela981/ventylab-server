<!--
 * Funcionalidad: README del backend
 * Descripción: Requisitos, arranque local con Docker, configuración del entorno, comandos de prueba y verificación, semillas, despliegue, estructura del proyecto y enlaces a la documentación del backend de VentyLab
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
-->

# VentyLab server

Backend of VentyLab, an educational cyber-physical system for teaching mechanical ventilation: NestJS 11, TypeScript, PostgreSQL through Prisma, Socket.io, MQTT for the physical ventilator and a language-model gateway for feedback. Architecture: modular monolith with one hexagonal feature per folder (see [`docs/adr`](docs/adr/README.md) and [`CLAUDE.md`](CLAUDE.md)).

## Requirements

- Node.js 22 (`engines.node >= 22`) and npm.
- Docker (with Compose v2) for the local database, the test containers and the full local stack.

## Environment

- Copy [`.env.example`](.env.example) to `.env` for local development. Every variable, its default and whether it is required are described in [`docs/operations/environment-variables.md`](docs/operations/environment-variables.md).
- [`deploy/env.example.proposed`](deploy/env.example.proposed) is the proposed template for a deployed environment.
- Environment variables are validated at boot; the server stops and names every missing or invalid variable.

## Run locally

Development database (PostgreSQL 17) and Mailpit only, server on the host:

```bash
npm ci                                   # also runs prisma generate
docker compose -f compose.development.yml up -d
npm run prisma:deploy                    # apply migrations
npm run start:dev                        # http://localhost:4000, docs at /api/docs
```

Full local profile (backend image, PostgreSQL, Mosquitto, Node-RED and the local edge), built from the repository:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres up -d --build --wait
```

Health: `GET /health` (liveness) and `GET /health/ready` (database readiness).

## Tests and checks

| Command | What it runs |
|---|---|
| `npm run verify` | Full gate: tsc, ESLint, circular imports, Prisma validation, migration drift, unit, perf, contract, integration and e2e suites, OpenAPI drift |
| `npm run verify:drift` | Migrations vs. schema on an empty database |
| `npm run verify:boot` | Boots the app from scratch and checks `/health/ready` |
| `npm run test:unit` | Unit specs with coverage thresholds |
| `npm run test:contract` | OpenAPI/AsyncAPI contract specs |
| `npm run test:perf` | Performance budget specs |
| `npm run test:integration` | Integration specs against a Testcontainers PostgreSQL (`--runInBand`) |
| `npm run test:e2e` | End-to-end specs (Testcontainers PostgreSQL and Mosquitto, fake AI providers) |
| `npm run test:load` / `test:load:http` / `test:load:telemetry` | Load tests (k6 HTTP, mqttx + Socket.io telemetry) against the running local Docker stack, never in CI; see [`docs/perf/README.md`](docs/perf/README.md) |
| `npm run lint` / `npm run lint:check` | ESLint on `src` and `test` (with and without `--fix`) |
| `npm run openapi:generate` / `openapi:check` / `openapi:client` | Regenerate the OpenAPI document, check it is up to date, regenerate the typed client in `packages/api-client` |
| `npm run security:audit` / `security:secrets` | `npm audit` with the documented exceptions, secret scan with gitleaks (Docker) |
| `npm run erd:generate` | Regenerates the ERD in `docs/erd` |
| `npm run knip` | Unused files, exports and dependencies (`npx knip@6.38.0`, see [`docs/maintenance/knip-report.md`](docs/maintenance/knip-report.md)) |

Tests never use a real AI provider, real MQTT topics, the physical ventilator or a remote database.

## Seeds

| Command | Effect |
|---|---|
| `npm run prisma:seed` | Curriculum seed (`prisma/seed.ts`): reloads levels, modules and lessons with `TRUNCATE ... CASCADE`, which also empties progress, pages, notes, evaluations and simulation sessions. Refuses to run with `NODE_ENV=production`. |
| `npm run demo:seed` | Idempotent demo seed (`prisma/demo`): upserts fake accounts, groups, published content, clinical cases, evaluations in every state, reservations and history. Add `-- --init-empty` to mark a brand-new empty database as a demo database when `NODE_ENV=production`. |
| `npm run demo:reset` | Restores exactly the demo state: truncates every business table except `audit_logs` and re-runs the demo seed in one transaction. Prints the row count per table. |

Demo accounts use the password `VentyLab-Demo-2026`:

| Account | Role |
|---|---|
| `SUPERADMIN_EMAIL`, or `superadmin@ventylab.demo` when it is unset | ADMIN (superadmin) |
| `ana.torres@ventylab.demo`, `luis.herrera@ventylab.demo` | TEACHER, members of the teacher group that supervises both student groups |
| `estudiante01@ventylab.demo` … `estudiante05@ventylab.demo` | STUDENT, group A (leader `estudiante01`) |
| `estudiante06@ventylab.demo` … `estudiante10@ventylab.demo` | STUDENT, group B (leader `estudiante06`) |

Demo safety rules:

- The demo commands refuse to run when `NODE_ENV=production` or when `DATABASE_URL` points to a Supabase host, unless the database carries the marker row `app_settings.demo_database = true` (written by the demo seed).
- Dates are computed from the start of the current UTC day with fixed offsets, so "active", "upcoming" and "past" stay meaningful on any day; IDs are deterministic UUIDs.
- `audit_logs` is append-only (database trigger): a reset keeps its rows, and the row-count comparison excludes it.
- If the superadmin email already belongs to an account, the seed promotes it to an active ADMIN without changing its password.

## Deploy

- [`Dockerfile`](Dockerfile): multi-stage Node 22 Alpine image; [`deploy/docker-entrypoint.sh`](deploy/docker-entrypoint.sh) runs `prisma migrate deploy` before starting `node dist/main` and stops if migrations fail; the image health check calls `/health/ready`.
- [`docker-compose.yml`](docker-compose.yml): production stack for Dokploy behind Traefik (labels for `API_DOMAIN`, HTTPS redirect, `dokploy-network`), Mosquitto with authentication, Node-RED and an optional `postgres` profile. [`docker-compose.local.yml`](docker-compose.local.yml) adapts it for local use.
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): the `verify` job runs `npm ci`, `npm run verify` and `npm run build` on pushes and pull requests; the `image` job runs on pushes to `main`, builds the container and pushes it to GHCR only when `PUBLISH_IMAGE` is true.
- Backups and restore: [`docs/operations/backup-restore.md`](docs/operations/backup-restore.md) and `scripts/backup/`.

## Project structure

```
src/
  main.ts, instrument.ts      bootstrap and Sentry preload
  app.module.ts               root module
  common/                     shared kernel: config, persistence, logging, audit, realtime, HTTP
  composition/                composition root binding cross-feature ports
  features/<feature>/         one bounded context each: domain, application, infrastructure, presentation
  i18n/                       es/en messages
prisma/                       schema, migrations, curriculum seed, demo seed (prisma/demo)
test/                         factories, support, integration, e2e, contract and Uppaal specs
scripts/                      verify, OpenAPI, ERD, security, backup, load and thesis audit scripts
openapi/                      generated OpenAPI 3.1 and AsyncAPI documents
packages/api-client/          typed client generated from the OpenAPI document
deploy/                       entrypoint, Mosquitto config, local compose environment
docs/                         architecture, operations and verification documentation
```

## Documentation

- Architecture decisions: [`docs/adr`](docs/adr/README.md)
- Entity-relationship diagram: [`docs/erd/erd.md`](docs/erd/erd.md)
- Runbook: [`docs/runbook.md`](docs/runbook.md)
- Hardware test protocol: [`docs/hardware-test-protocol.md`](docs/hardware-test-protocol.md) and the ventilator docs in [`docs/ventilator`](docs/ventilator/README.md)
- API: OpenAPI at `/api/docs` and [`openapi/`](openapi), legacy endpoints in [`docs/api/legacy-endpoints.md`](docs/api/legacy-endpoints.md)
- Verification evidence: [`docs/verification`](docs/verification) and [`docs/operation/VERIFICATION.md`](docs/operation/VERIFICATION.md)
- Security: [`docs/security`](docs/security)
- Performance: [`docs/ventilator/telemetry-bench.md`](docs/ventilator/telemetry-bench.md) and `npm run test:perf`
- Operation features: [`docs/operation/ANALYTICS.md`](docs/operation/ANALYTICS.md), [`docs/operation/SYSTEM-STATUS.md`](docs/operation/SYSTEM-STATUS.md)
- Uppaal traceability: [`docs/traceability-uppaal.md`](docs/traceability-uppaal.md)
- Maintenance: [`docs/maintenance/knip-report.md`](docs/maintenance/knip-report.md)
