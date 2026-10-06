# VentyLab server: AI context

Backend of VentyLab, an educational cyber-physical system for teaching mechanical ventilation (thesis of Marcela Mazo Castro, Universidad del Valle). Sibling repo: `../ventilab-web` (Next.js frontend, has its own `AI_CONTEXT.md`; it still targets the legacy Express contract and is migrated separately).

The server was rebuilt in October 2026 from `template-backend-nestjs` (NestJS 11, hexagonal/DDD features), keeping Prisma and the existing database. Conventions live in `CLAUDE.md`, `AGENTS.md` and `.claude/skills/*/SKILL.md`; the migration log and author checklist live in `odd/tasks/nestjs-template-migration.md`.

## Stack (from `package.json`)

- Node >= 22, TypeScript ^5.7, NestJS ^11 (`@nestjs/core`, `common`, `platform-express`, `config`, `jwt`, `swagger`, `throttler`, `schedule`, `event-emitter`, `websockets`, `platform-socket.io`, `axios`)
- Prisma ^6.19 + PostgreSQL (Neon: pooled `DATABASE_URL` + `DIRECT_URL`)
- Validation: `class-validator` ^0.14 + `class-transformer`; i18n: `nestjs-i18n` ^10 (en, es)
- Auth: `@nestjs/jwt` (access + refresh tokens), `bcrypt` ^6, NextAuth bridge with a shared secret
- Realtime and IoT: `socket.io` ^4.8, `mqtt` ^5.15 (Node-RED / ESP ventilator), `@influxdata/influxdb-client` ^1.35 (telemetry, optional)
- AI: `@google/generative-ai` ^0.24 (Gemini) behind the `IAITextGenerator` port
- Ops: `helmet`, `compression`, `@sentry/nestjs` (optional), `@scalar/express-api-reference` (API docs at `/api/docs`, JSON at `/api/docs-json`, IP allow-list), `nodemailer`
- Tooling: ESLint 9 (typescript-eslint, stylistic, import), Jest 30 + ts-jest, husky + lint-staged, `tsx` for scripts

## Architecture and layout

Clean Architecture + DDD. Dependencies flow inward: `presentation -> application -> domain`, `infrastructure -> domain`.

```
src/
  main.ts              bootstrap: helmet, compression, 10mb body, CORS, ValidationPipe, RealtimeIoAdapter, docs, listen(PORT)
  instrument.ts        Sentry init (reads env through common/infrastructure/config/sentry-config.ts)
  app.module.ts        global common modules + every feature module
  @types/              express Request augmentation (request.user: JwtPayload)
  i18n/{en,es}/        one JSON namespace per feature + common
  common/
    application/       ports: event bus, transaction manager, AI text generator, realtime publisher, access token verifier, password hasher
    domain/            aggregate root, domain events, domain errors, audit log entity, value objects, utils (generateId = UUID v7)
    infrastructure/    config (env validation), persistence/prisma (PrismaService, transaction manager, resolveClient),
                       audit-log + error-log repositories, ai (Gemini adapter), realtime (gateway, IO adapter, publisher),
                       logging (AppLogger), context (request context), events (NestEventBus), email, security, storage, docs, http, pipes
    presentation/      APIResponseBuilder, HttpExceptionFilter, errors-map.ts, health controller, guards, middlewares (trace id), decorators
  features/<feature>/
    domain/            entities (aggregates), events, errors, repository interfaces + tokens, value objects, pure services, read models
    application/       commands, use cases (*.usecase.ts), results, application services
    infrastructure/    persistence/prisma/{mappers,repositories}/*-prisma.repository.ts, event handlers, adapters
    presentation/      controllers, DTOs (*.dto.ts), presentation mappers
    <feature>.module.ts
```

Prisma schema: `prisma/schema.prisma`, 35 models (the 33 legacy models with their original table and column names, plus `AuditLog` and `ErrorLog`). `PrismaService` is the only client in `src`.

## Features and routes

No global prefix; every controller declares `api/<resource>`. Unless noted, routes use `JwtAuthGuard` + `PermissionsGuard` with `@RequirePermissions(...)`. P = public, O = optional JWT. Role to permission mapping: `src/features/authorization/domain/role-permissions.ts` (STUDENT < TEACHER < ADMIN < SUPERUSER; SUPERUSER bypasses the guard).

| Feature | Base routes | Access summary |
|---|---|---|
| auth | `api/auth` (`register`, `register/superuser`, `login`, `refresh`, `logout`, `me`, `nextauth-token`) | P for register/login/refresh; `x-admin-api-key` for superuser register; `x-nextauth-bridge-secret` for the NextAuth exchange; JWT for `me`/`logout` |
| authorization | `api/authorization/permissions`, `roles` | JWT |
| users | `api/users/me` (GET, PATCH), `me/change-password`, `me/stats`, `students`, `students/:id` | JWT; `students:read_all`, `students:read` (teachers limited to assigned students) |
| levels | `api/levels` (+ `curriculum`, `roadmap`, `reorder`, `:id/modules`, `:id/prerequisites`, `:id/unlock-status`, `:id/can-delete`) | reads P/O; `progress:read_own`; `levels:create/update/delete` |
| modules | `api/modules` (+ `:id/lessons`, `:id/lessons/count`, `:id/progress`, `:id/resume`, `:id/prerequisites`) | reads P; `progress:read_own`; `modules:*` |
| lessons | `api/lessons` (+ `:id/next`, `:id/previous`, `:id/steps`, `:id/complete`, `:id/access`) | reads P; `progress:update_own`; `lessons:*` |
| steps | `api/steps` (alias `api/cards`, + `:id/next`, `:id/previous`, `reorder`) | reads P; `steps:*` |
| pages | `api/pages/by-legacy-json/:id`, `by-lesson/:id`, `by-module/:id`, `:id` | P |
| curriculum | `api/curriculum/overview`, `beginner`, `prerequisitos`, `level/:level`, `modules/:moduleId/unlocked`, `modules/:moduleId/next` | O; `progress:read_own` |
| overrides | `api/overrides` CRUD | `overrides:*` |
| changelog | `api/changelog`, `recent`, `stats`, `:entityType/:entityId` | `changelog:read` (teachers see their own changes) |
| curriculum-editor | `api/teaching/tree`, `node`, `node/:id`, `lesson/:id/content` | `curriculum:manage` |
| progress | `api/progress/*` (overview, module, lesson, details, resume, milestones, achievements, skills, step update, complete); `api/teaching/lessons/:id/complete`, `modules/unlocked`, `modules/:id/access`, `lessons/:id/access` | `progress:read_own`, `progress:update_own` |
| quizzes | `api/quizzes` (alias `api/evaluation/quizzes`, + `my-attempts`, `:quizId`, `:quizId/my-attempt`, `:quizId/attempt`) | `quizzes:read`, `quizzes:attempt` |
| clinical-cases | `api/clinical-cases` (alias `api/cases`, + `:caseId`, `:caseId/attempts`, `:caseId/evaluate` throttled 10/min) | `clinical-cases:read`, `clinical-cases:evaluate` |
| activities | `api/activities` (+ `catalog`, `catalog/:id`, `:id/publish`, `:id/submissions`), `api/activity-assignments`, `api/activity-submissions` (`my`, `for-activity/:id`, `:id/submit`, `:id/grade`, `:id/reset`) | `activities:*`, `activity-assignments:*`, `activity-submissions:*` |
| groups | `api/groups` (+ `:id/members`, `:id/members/:userId`, `:id/lead`) | `groups:read/create/update/delete/manage_members` |
| scores | `api/scores`, `scores/:id`, `students/:studentId`, `my-scores` | `scores:create/delete/read` |
| teacher-students | `api/teacher-students` CRUD, `api/teachers/:id/students`, `teachers/:teacherId/students/:studentId(/progress)`, `teachers/me/students/:studentId/check`, `api/students/:id/teachers` | `teacher-students:manage`, `teacher-students:read` + self-or-permission guard |
| admin | `api/admin/students`, `students/:id/progress`, `teachers`, `users/:id/role`, `statistics` | `students:read`, `users:read`, `users:update_role`, `admin-statistics:read` |
| simulation | `api/simulation/health` (P), `status`, `sessions`, `patient`, `command`, `reserve` (POST, DELETE), `session`, `session/save`, `patient/configure`, `patient/start`, `patient/stop` | `simulation:read`, `simulation:control` |
| health (common) | `GET /`, `/health`, `/api/health` | P |

Mutations return `data: null` except creates (`{ id }`), quiz attempts and case evaluations (result as `data`), and the get-or-create submission.

## Common building blocks

- **Persistence**: inject `PrismaService`; repositories call `resolveClient(this._prisma, transaction)`; transactions through `TRANSACTION_MANAGER_TOKEN`; aggregates write `audit_logs` through `AUDIT_LOG_REPOSITORY_TOKEN`; new ids via `generateId()` (UUID v7), legacy cuid ids are read as strings.
- **Events**: aggregates record domain events; use cases publish them through `EVENT_BUS_TOKEN` after commit. Handlers write ChangeLog entries, unlock achievements, upsert scores on grading and push socket events (fail-soft).
- **Auth**: `AuthModule` is global and exports `JwtAuthGuard`, `OptionalJwtAuthGuard`, `PermissionsGuard`, `SelfOrPermissionGuard`; decorators `@RequirePermissions`, `@AllowSelfOr`, `@CurrentUser()` (`JwtPayload { sub, email, role, permissions }`). `SUPERADMIN_EMAIL` user has an immutable role.
- **AI**: `AI_TEXT_GENERATOR_TOKEN` (`IAITextGenerator.generate(prompt, { temperature, maxTokens })`), Gemini adapter, throws `AIUnavailableError` / `AIGenerationFailedError`; clinical-case feedback falls back to deterministic feedback.
- **Realtime**: `REALTIME_PUBLISHER_TOKEN` (`emitToUser`, `emitToGroup`, `emitToRole`, `emitToRoom`, `broadcast`, `joinRoom`, `leaveRoom`).
- **Logging and tracing**: Nest `Logger` through `AppLogger` (JSON lines in production); `x-trace-id` / `x-request-id` accepted and echoed; errors stored in `error_logs`.
- **Config**: `process.env` is read only in `src/common/infrastructure/config/` (`env.validation.ts`, `sentry-config.ts`); everything else injects `ConfigService`.

## Realtime and MQTT contract

- Socket.io on the HTTP server, same CORS as HTTP. Handshake JWT (`auth.token` or `Authorization: Bearer`) or the legacy `authenticate` event; replies `authenticated { userId }` or `auth_error { message: "Invalid token" }` and disconnects. Rooms: `user:{id}`, `role:{role}`, `group:{id}`, ventilator room.
- Events: `ventilator:data` (broadcast, or per user to the reservation leader, throttled to `WS_MAX_HZ`; patient simulation sends per user every 33 ms), `ventilator:alarm`, `ventilator:reserved`, `ventilator:released { userId }`, `achievement:unlocked`.
- MQTT: subscribe qos 1 to `MQTT_TELEMETRY_TOPIC` (default `/ventynet/data`) and `ventilab/device/001/alarm`; commands published as JSON qos 1 to `ventilab/device/001/command` (fixed contract constants). Reconnect backoff 5 s x 2^n capped at 60 s, 5 attempts. JSON and hex frames are parsed. Influx (`telemetry` measurement) only when `INFLUXDB_*` are set.
- Reservation: `pg_advisory_xact_lock(hashtext('ventilab-device-001'))` inside a transaction, then expire, check, create.

## Environment variables (names only; see `env.validation.ts`)

Required: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `NEXTAUTH_SECRET`, `NEXTAUTH_BRIDGE_SECRET`, `ADMIN_API_KEY`, `SUPERADMIN_EMAIL`, `CORS_ORIGIN`, `FRONTEND_URL`, `PRODUCTION_URL`, `THROTTLE_TTL`, `THROTTLE_LIMIT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_SECURE`.

Optional: `VERCEL_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SENTRY_DSN`, `SWAGGER_ALLOWED_IPS`, `SMTP_USER`, `SMTP_PASS`, `MQTT_BROKER_URL` (or `MQTT_URL`), `MQTT_CLIENT_ID`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TELEMETRY_TOPIC`, `MQTT_COMMAND_TOPIC` and `MQTT_ALARM_TOPIC` (validated, not read), `WS_MAX_HZ`, `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET`, `GEMINI_API_KEY`.

## Response envelope and errors

Every response goes through `APIResponseBuilder`:

```json
{ "success": true, "message": "...", "data": {}, "code": null, "timestamp": "...", "traceId": "...", "pagination": { "total": 0, "pages": 0, "page": 1, "limit": 20, "next": null, "previous": null } }
```

Errors go through `HttpExceptionFilter`: `success: false`, `code` is the domain error code (`<feature>.<error>`, registered with its HTTP status in `src/common/presentation/errors-map.ts`), `message` is translated from `src/i18n/{en,es}` using `x-lang`, `?lang` or `Accept-Language`. Validation errors use `code: "validation_error"` with a message list. Prisma `P2002` maps to 409 `common.conflict`, `P2025` to 404 `common.not_found`. Stacks never reach the response; they go to logs and `error_logs`.

## How to run

`package.json` scripts: `start`, `start:dev`, `start:debug`, `start:prod` (`node dist/main`), `build` (`nest build`), `lint`, `lint:check`, `format`, `prisma:generate`, `prisma:migrate`, `prisma:deploy`, `prisma:studio`, `prisma:seed` (`tsx prisma/seed.ts`), `test`, `test:watch`, `test:cov`, `test:debug`. Type check: `npx tsc --noEmit -p tsconfig.json` (baseline 0 errors).

Thesis audit scripts (OE1-OE3 evidence, outside Nest): `npx tsx scripts/audit-thesis-objectives.ts` and `npx tsx scripts/audit-e2e/audit-e2e.ts`; they use their own Prisma client in `scripts/lib/prisma.ts` and write to `audit-output/`. `scripts/simulate-ventilator.ts` publishes synthetic MQTT telemetry.

## Unapplied migration

`prisma/migrations/20261004120000_add_audit_and_error_logs/migration.sql` creates `audit_logs` and `error_logs`. It is generated but not applied to Neon. Until it is applied, every write that records an audit log (all aggregate saves) fails at runtime, and error-log rows are dropped (the filter only logs a warning). `prisma/migrations/` is gitignored.

## Known runtime checks pending

The rebuild was verified only statically (tsc, eslint, madge, parity scripts). Pending for the author: boot with and without `SUPERADMIN_EMAIL` and MQTT, `/health`, login with 200/401/403, sockets with and without JWT, content navigation and progress writes, quiz attempt and achievement unlock, case evaluation with and without `GEMINI_API_KEY`, the activity flow and score upsert, groups and teacher-student routes, admin statistics against legacy numbers, simulator telemetry at about 30 Hz, reservation and commands reaching Node-RED, patient simulation, Influx writes, graceful shutdown. Full list in the feature document's author checklist.

## Other folders

- `contracts/`: legacy shared contracts, no longer imported by `src` (simulation constants were copied into domain value objects).
- `__deferred_tests__/`: legacy simulation unit tests, outside the build.
- `audit-output/`: generated audit reports (thesis evidence).
- `docs/json-specs/`: content specs.
