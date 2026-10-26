<!--
 * Funcionalidad: Contexto del backend para asistentes de IA
 * Descripción: Estado real del backend NestJS de VentyLab: stack, arquitectura, familias de rutas, roles y permisos, contrato OpenAPI compartido con ventilab-web, contrato Socket.io (incluido el lote ventilator:telemetry), MQTT, variables de entorno, migraciones versionadas, despliegue en un contenedor persistente de una sola réplica sobre Dokploy y comandos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
-->

# VentyLab server: AI context

NestJS backend of VentyLab, an educational cyber-physical system for teaching mechanical ventilation (thesis of Marcela Mazo Castro, Universidad del Valle). Sibling repo: `../ventilab-web` (Next.js frontend).

- The frontend is **already migrated to this contract**: it consumes a generated OpenAPI client (`ventilab-web/src/shared/api-client/generated/schema.d.ts`, built from a copy of `openapi/openapi.json` by `npm run generate:api`). Its `npm run check:api` script (`scripts/check-api-contract.mjs`) regenerates the client and fails if it differs from what is committed, which keeps both repos in sync.
- Conventions live in `.claude/skills/*/SKILL.md` (authorization, configuration, error-handling, swagger) and the ADRs in `docs/adr/`. Feature logs and author checklists live in `odd/tasks/*.md`. Operations: `docs/runbook.md`, `docs/operations/environment-variables.md`.

## Stack (from `package.json`)

- Node >= 22, TypeScript ^5.7, NestJS ^11 (`config`, `jwt`, `swagger`, `throttler`, `schedule`, `event-emitter`, `websockets`, `platform-socket.io`)
- Prisma ^6.19 + PostgreSQL (pooled `DATABASE_URL` for the app, `DIRECT_URL` for migrations)
- Validation: `class-validator` + `class-transformer`; i18n: `nestjs-i18n` (en, es)
- Auth: `@nestjs/jwt` (access + refresh tokens, no refresh rotation), `bcrypt`, Google ID token sign-in (`google-auth-library`)
- Realtime and IoT: `socket.io` ^4.8, `mqtt` ^5 (Node-RED / ESP ventilator), `@influxdata/influxdb-client` (optional telemetry storage)
- AI gateway: Gemini (`@google/generative-ai`), OpenAI, Anthropic and a custom HTTP provider (HTTP adapters) behind ports, with circuit breaker, quotas and prices
- Ops: `helmet`, `compression`, `@sentry/nestjs` (optional), Scalar API docs at `/api/docs` (JSON at `/api/docs-json`), `nodemailer`, Supabase Storage for media
- Tooling: ESLint 9, Jest 30 + ts-jest, testcontainers (Postgres, Mosquitto), husky + lint-staged, madge, knip (through npx), `tsx` for scripts

## Architecture and layout

Modular monolith, Clean Architecture + DDD per feature (ADR 0001–0003). Dependencies flow inward: `presentation -> application -> domain`, `infrastructure -> domain`.

```
src/
  main.ts              bootstrap: shared HTTP hardening (helmet, body limits, CORS), compression (not for SSE), RealtimeIoAdapter, global pipes, docs, listen(PORT, 0.0.0.0)
  instrument.ts        Sentry init (reads env through common/infrastructure/config/sentry-config.ts)
  app.module.ts        global modules (config, i18n, schedule, throttler, events, Sentry) + every feature module
  composition/         @Global composition root: binds settings ports and cross-feature ports (ADR 0003)
  i18n/{en,es}/        one JSON namespace per feature + common
  common/              ports, domain base classes, Prisma, audit/error logs, realtime gateway, config, security, storage, docs, http
  features/<feature>/  domain/ application/ infrastructure/ presentation/ <feature>.module.ts (37 features)
```

Prisma schema: `prisma/schema.prisma`, **59 models**. `PrismaService` is the only client in `src`.

## Routes

- No global prefix; every controller declares `api/<resource>`. Health is the exception: `GET /`, `/health`, `/api/health`, `/health/ready`, `/api/health/ready` (public, no throttling).
- 356 method + route combinations (53 controllers), exactly the operations of `openapi/openapi.json`. 24 of them are deprecated controller aliases (`api/cases`, `api/cards`, `api/evaluation/quizzes`) with `Deprecation`/`Link` headers.
- Route families: `auth`, `authorization`, `users`, `me/summary`, `admin` (+ `admin/ai-ratings`, `admin/ai-telemetry`, `admin/ai/providers`), `levels`, `modules`, `lessons`, `steps`, `pages`, `sections`, `curriculum`, `teaching` (curriculum editor), `overrides`, `changelog`, `progress`, `quizzes`, `clinical-cases`, `activities`, `activity-assignments`, `activity-submissions`, `evaluations`, `evaluation-assignments`, `evaluation-attempts`, `evaluation-grading`, `my-evaluations`, `groups`, `scores`, `teacher-students`, `teachers`, `students`, `notes`, `notifications`, `media`, `tutor`, `ai-ratings`, `analytics`, `audit`, `platform-settings`, `system`, `reservations`, `ventilator` (telemetry, commands, control), `simulation` (legacy simulator plus `simulation/sessions/*` of the isomorphic engine, ADR 0005).
- `api/auth`: `register`, `login`, `google`, `refresh`, `logout`, `me`, `nextauth-token`. There is **no** `register/superuser` route. `nextauth-token` (guarded by `x-nextauth-bridge-secret`) is no longer called by the frontend, which removed NextAuth.
- Public routes: health, `POST api/auth/register|login|google|refresh`, `GET api/simulation/health`. Content reads use `OptionalJwtAuthGuard`. Everything else uses `JwtAuthGuard` + `PermissionsGuard` with `@RequirePermissions(...)` (method metadata replaces class metadata; all listed permissions are required).
- Legacy routes deprecated with `@DeprecatedRoute`: `PATCH api/admin/users/:id/role`, `GET api/pages/by-legacy-json/:id`, `GET/PUT api/progress/lesson/:lessonId`. List in `docs/api/legacy-endpoints.md`.

## Roles and authorization

- Fixed roles `STUDENT < TEACHER < ADMIN` (`src/features/users/domain/value-objects/user-role.ts`). `SUPERUSER` no longer exists: it was folded into `ADMIN` (audit action `role_folded_superuser_to_admin`).
- Role to permission map in code: `src/features/authorization/domain/role-permissions.ts` (catalog in `permission-catalog.ts`); permissions are embedded in the JWT.
- `SUPERADMIN_EMAIL`: that account is kept `ADMIN` and active at startup; its role and status are immutable (DB trigger `protect_superadmin`, 403 `common.superadmin_protected`).
- Refresh tokens are revoked per user through `refreshTokensRevokedAt`. Only `ThrottlerGuard` is global (in-memory storage).

## Response envelope and errors

```json
{ "success": true, "message": "...", "data": {}, "code": null, "timestamp": "...", "traceId": null, "pagination": null }
```

- `pagination` (`total`, `pages`, `page`, `limit`, `next`, `previous`) is filled only on paginated routes (`page` >= 1, `limit` 1–100). `traceId` is `null` on success; the trace id travels in the `x-trace-id` / `x-request-id` headers.
- Errors (`HttpExceptionFilter`): `success: false`, `code` = domain code (`<feature>.<reason>`, HTTP status in `src/common/presentation/errors-map.ts`), translated `message` (`x-lang`, `?lang` or `Accept-Language`). Validation: 400 `validation_error` with `data.errors: [{ field, message }]`. Prisma `P2002` → 409 `common.conflict`, `P2025` → 404 `common.not_found`. `retryAt` sets `Retry-After`. Stacks go to logs, Sentry and `error_logs`, never to the response.
- CORS exposes `Content-Disposition`, `Date`, `Retry-After`, `X-Export-Truncated`, `x-trace-id`, `x-request-id`.

## Realtime contract (Socket.io)

- `RealtimeGateway` on the HTTP server (namespace `/`, path `/socket.io`), same CORS origins as HTTP. Contract file: `openapi/asyncapi.yaml`.
- Handshake: `auth.token` or `Authorization: Bearer`; later `authenticate` (`"<jwt>"` or `{ token }`). Valid → rooms `user:{id}`, `role:{role}`, `group:{id}` and `authenticated { userId }`; invalid → `auth_error { message }` and disconnect; no token → connected without rooms.
- Client → server: `authenticate`, `ventilator:join` (joins the `ventilator` room if the user holds the active reservation, else `ventilator:join-rejected`), `ventilator:heartbeat` (operator presence).
- Server → client:
  - `ventilator:telemetry` — the main channel: batched `{ frames: TelemetryFrame[], serverTs }`, volatile, flushed every `VENTILATOR_FLUSH_INTERVAL_MS` (33 ms) to the `ventilator` room + `role:TEACHER` + `role:ADMIN`.
  - `ventilator:alarm`, `ventilator:availability`, `ventilator:connected` / `ventilator:disconnected`, `ventilator:control-changed`, `ventilator:command-status`, `reservation:preempted`.
  - `evaluation:activated` (group), `grade:published`, `notification:new`, `user:role-changed` (user), `system:status-changed` (TEACHER/ADMIN roles).
  - Emitted but not consumed by the frontend: `ventilator:data` (legacy single reading, only per user for the legacy patient simulation `api/simulation/patient/*`) and `achievement:unlocked` (user). `ventilator:reserved` / `ventilator:released` are no longer emitted.

## MQTT and the physical ventilator

- Enabled only when `MQTT_BROKER_URL` (alias `MQTT_URL`) is set. Topics from env: `MQTT_TELEMETRY_TOPIC` (`/ventynet/data`), `MQTT_COMMAND_TOPIC` (`ventilab/device/001/command`), `MQTT_ALARM_TOPIC` (`ventilab/device/001/alarm`), optional `MQTT_COMMAND_ACK_TOPIC`.
- Reconnect: exponential backoff with jitter, base `MQTT_RECONNECT_BASE_MS` (1 s), capped at `MQTT_RECONNECT_MAX_MS` (30 s), retried indefinitely.
- Telemetry pipeline: decoder `auto|json|hex`, sequence reordering, staleness watchdog, recordings, optional Influx sink. Commands: single operator (ADR 0006), rate limit, timeout, safety limits.
- Reservations: `pg_advisory_xact_lock` on `VENTILATOR_DEVICE_ID` inside the transaction (ADR 0007).

## Environment variables

Validated at startup by `src/common/infrastructure/config/env.validation.ts` (106 variables); `.env.example` lists all of them. `process.env` is read only under `src/common/infrastructure/config/`.

- Required (no default): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `NEXTAUTH_BRIDGE_SECRET`, `SUPERADMIN_EMAIL`, `CORS_ORIGIN`, `FRONTEND_URL`, `PRODUCTION_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`.
- Optional and unused by live flows: `NEXTAUTH_SECRET`, `ADMIN_API_KEY` (`AdminApiKeyGuard` exists but no route applies it).
- Everything else is optional or has a default (MQTT, `VENTILATOR_*`, AI, Supabase, media, reservations, simulation, analytics). Telemetry frequency is set by `VENTILATOR_FLUSH_INTERVAL_MS`; there is no `WS_MAX_HZ`.
- Admin-editable runtime settings (platform settings) override some defaults without a restart (ADR 0009).

## Database and migrations

- `prisma/migrations/` **is tracked by git** (27 migrations, latest `20261017120000_user_student_code`). `.gitignore` keeps `*.sql` backups ignored but re-includes `prisma/migrations/**/migration.sql`.
- The container entrypoint runs `prisma migrate deploy` (through `DIRECT_URL`) on every start and refuses to start if it fails.
- Target database: PostgreSQL hosted on Dokploy (the optional `postgres` profile of `docker-compose.yml`, or a Dokploy-managed Postgres).

## Deployment

- The backend runs as a **persistent, single-replica Docker container** on a VPS with Dokploy and Traefik (`Dockerfile`, `docker-compose.yml`, `deploy/`), next to Mosquitto and Node-RED. Traefik terminates TLS and passes WebSockets and SSE without buffering.
- It is **not serverless** (Vercel Functions or Lambda are not viable) because it holds long-lived state in one process: Socket.io connections and rooms in memory (no Redis adapter), a persistent MQTT client, 33 ms telemetry flush and simulation loops, `setInterval` watchdogs, `@nestjs/schedule` crons, an in-memory throttler, an in-process event bus, a batched Influx writer, long SSE streams and the exclusive ventilator operator in memory. Cold starts would also rerun migrations.
- Scaling past one replica would first need a Socket.io Redis adapter, shared throttler storage, a distributed operator lock and leader-elected crons.
- CI (`.github/workflows/ci.yml`): `npm ci`, `npm run verify`, `npm run build`; image build on push to `main`. Dokploy deploys from the repo or the image.

## How to run

- Local: `docker compose -f compose.development.yml up -d` (Postgres + mailpit), copy `.env.example` to `.env`, `npm ci`, `npm run prisma:migrate`, `npm run start:dev`.
- Scripts: `build`, `start:prod`, `lint`, `lint:check`, `test` / `test:unit` / `test:integration` / `test:e2e` / `test:contract` / `test:load`, `openapi:generate` / `openapi:check` / `openapi:client`, `verify`, `verify:boot`, `verify:drift`, `prisma:*`, `demo:seed` / `demo:reset`, `knip`, `security:audit`, `security:secrets`, `erd:generate`.
- After changing a controller or DTO: `npm run openapi:generate`, commit `openapi/openapi.json`, then run `npm run generate:api` and `npm run check:api` in `ventilab-web`.

## Other folders

- `openapi/`: generated OpenAPI 3.1 and AsyncAPI contracts. `packages/api-client/`: generated TypeScript client.
- `test/`: e2e, integration, contract and load suites with their support code. `scripts/`: OpenAPI generation, verification, load tests, thesis audit scripts (`audit-output/`), `simulate-ventilator.ts`.
- `contracts/`: legacy shared contracts, not imported by `src`. `__deferred_tests__/`: legacy tests outside the build.
- `docs/`: ADRs, ERD, runbook, operations, security, verification reports, ventilator protocol.
