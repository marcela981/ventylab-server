<!--
  Funcionalidad: Evidencia del bloque B de calidad
  Descripción: Infraestructura de pruebas (Testcontainers PostgreSQL y Mosquitto, proveedores de IA falsos, fábricas, restablecimiento de la base de datos, separación de suites), cómo ejecutarla, justificación de dependencias y salidas observadas
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block B verification — test infrastructure

Observed on 2026-10-12, Windows 11, Node 22, Docker Desktop, branch `main` (uncommitted working tree on top of `1152bd4`).

## Suites

| Script | Config | Scope | Docker |
|---|---|---|---|
| `npm test` / `npm run test:unit` | `jest` key of `package.json` (unchanged: `rootDir: src`, ts-jest, `@/` mapper, `reflect-metadata`) | `src/**/*.spec.ts` | no |
| `npm run test:integration` | `test/jest/jest.integration.config.js` | `*.integration-spec.ts` under `src/` and `test/` | PostgreSQL |
| `npm run test:e2e` | `test/jest/jest.e2e.config.js` | `test/e2e/**/*.e2e-spec.ts` | PostgreSQL + Mosquitto |
| `npm run test:load` | — | prints how to run the k6/mqttx scripts of `scripts/load/` (placeholder until block C7); never called by `verify` or CI | no |

`npm test` keeps its previous command (`jest --passWithNoTests`). `test:unit` adds `--ci`. Both container configs derive from the unit config (`test/jest/jest.container-suite.config.js`) so transforms and module settings stay identical.

`npm run verify` already ran every script among `test:unit`, `test:integration`, `test:e2e` present in `package.json`; with the scripts added it now runs the three suites in that order after the drift check. `scripts/verify/verify.mjs` needed no change. `npm run lint:check` and verify's ESLint step now cover `test/**/*.ts`.

## How it works

- **One container set per run.** `globalSetup` (`test/jest/integration.global-setup.ts`, `test/jest/e2e.global-setup.ts`) starts `postgres:17-alpine` through `@testcontainers/postgresql` (and `eclipse-mosquitto:2` for e2e), runs `prisma migrate deploy` once with a minimal environment and an explicit `DATABASE_URL`/`DIRECT_URL`, and publishes `VENTYLAB_TEST_DATABASE_URL`, `VENTYLAB_TEST_MQTT_URL` and `VENTYLAB_TEST_RUN_ID` to the test files. `test/jest/global-teardown.ts` stops the containers; Ryuk removes them if the run crashes.
- **runInBand.** Both container suites run with `--runInBand`: every file shares one database, and a single worker is the simplest option that cannot race on `resetDatabase`. Per-worker schemas were not needed.
- **Explicit environment.** `test/jest/test-env.setup.ts` (`setupFiles`, before any application import) assigns a value to **every** key of `EnvironmentVariables` (`test/support/test-env.ts`): container URLs, fixed test JWT secrets, `NODE_ENV=test`, `SUPERADMIN_EMAIL=superadmin@ventylab.test`, blank AI/Supabase/Sentry/InfluxDB/SMTP/Google credentials, unreachable `http://127.0.0.1:9` for optional URL settings, and declared defaults for the rest. Because every key is already set, neither `ConfigModule`, `dotenv` nor the Prisma client can fill a value in from `.env`. `test/jest/no-dotenv.setup.ts` additionally replaces `dotenv` in Jest's module registry, so `.env` is never parsed by application code.
- **Guard.** `assertLocalTestEnvironment` throws when `DATABASE_URL`/`DIRECT_URL` or `MQTT_BROKER_URL` is not `localhost`/`127.0.0.1`, when any provider key or Supabase/Sentry value is non-blank, or when `NODE_ENV` is not `test`. It runs in the setup file, in `createTestPrismaClient`, and in `createE2eApp` against the values the booted `ConfigService` actually holds.
- **MQTT isolation.** The broker is a throwaway container with anonymous access (config inlined in `test/support/containers.ts`, only for that container). Topics use `test/<runId>`: `MQTT_TEST_TOPIC_PREFIX=test/<runId>` (applied by the app to the command and ack topics) and explicit `MQTT_TELEMETRY_TOPIC=test/<runId>/ventynet/data`, `MQTT_ALARM_TOPIC=test/<runId>/ventilab/device/001/alarm`.
- **Database reset.** `resetDatabase(prisma)` (`test/support/database.ts`) runs, in one transaction, `SET LOCAL session_replication_role = replica`, one `TRUNCATE TABLE <all public tables except _prisma_migrations> RESTART IDENTITY CASCADE`, and re-inserts the rows the migrations seed. In replica mode ordinary triggers do not fire, so the `audit_logs_append_only_truncate` trigger does not block it; outside `resetDatabase` the trigger still rejects `TRUNCATE` (asserted by the smoke spec). The seeded rows (`app_settings.superadmin_email`, the two `sections`) are copied once into the `test_baseline` schema by `globalSetup`, after pointing `superadmin_email` to the test superadmin, and restored on every reset.
- **Fake AI.** `src/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec.ts` builds `ILlmProvider` fakes for `success`, `server-error` (HTTP 503 → `SERVER`), `timeout` (blocks until the attempt's `AbortSignal` aborts → `TIMEOUT`) and `partial-stream` (yields deltas, then `ECONNRESET` → `NETWORK`), on top of the existing `FakeLlmProvider` (new `partial` behavior). `withFakeAiProviders(builder, ...)` overrides `AI_PROVIDERS_TOKEN` in a Nest `TestingModuleBuilder`; `createE2eApp` uses it and refuses to start if any non-fake provider is registered.
- **E2E app.** `test/support/e2e-app.ts` compiles `AppModule`, applies the `main.ts` HTTP/WebSocket setup (trust proxy, body limits, CORS, `RealtimeIoAdapter`, `TrimPipe` + `I18nValidationPipe`; no Sentry instrumentation, helmet, compression or docs) and listens on a free `127.0.0.1` port.
- **Factories** (`test/factories/`): users by role and the superadmin (`SUPERADMIN_EMAIL`, known password `Test-Password-123`, bcrypt cost 4); student/teacher groups with members and leader, enforcing the domain rules through `group-membership-policy` (allowed roles, one active student group per student, one leader who is a member, leader only in student groups, `memberRole` and `simulatorLeaderId` in sync); section → level → module → lesson → page (+ page section) and lesson steps; evaluations of type EXAM/QUIZ/WORKSHOP with SINGLE_CHOICE/MULTIPLE_CHOICE/TRUE_FALSE/OPEN_TEXT/SIMULATION questions and options, plus group assignments; clinical cases; user and group reservations on non-overlapping 15-minute slots. A per-file sequence keeps emails, slugs and orders unique.
- **Tokens.** `mintAccessToken(user, app?)` signs with the application's `JwtTokenGenerator` and `buildJwtPayload` (from a running app, or built from the test `JWT_SECRET`/`JWT_EXPIRES_IN`).

## Dependencies added (devDependencies)

| Package | Why |
|---|---|
| `testcontainers@^12.2.0` | Container lifecycle from Jest: random host ports, wait strategies, and the Ryuk reaper that removes containers when a run crashes or is interrupted. Also starts `eclipse-mosquitto:2` through `GenericContainer` (no broker-specific module needed). The `scripts/verify/lib` helpers are ESM `.mjs` built for the verify CLI and have no crash-safe cleanup outside that process. |
| `@testcontainers/postgresql@^12.2.0` | Typed PostgreSQL module (credentials, database, readiness wait) for `postgres:17-alpine`, the same image the drift check uses. |

## Proof specs

- `src/features/ai/application/services/ai-gateway-fallback.spec.ts` (unit, 8 tests): deterministic fallback on `complete` for server-error (retried once), timeout (no retry) and partial-stream; streamed fallback for server-error and timeout before the first chunk; identical result and record across runs; next provider of the chain before the fallback; a stream cut after content was delivered ends in `AiStreamInterruptedError` without fallback (existing orchestrator contract). These characterize existing behavior, so there was no RED phase.
- `test/integration/infra.integration-spec.ts` (8 tests): local container with every migration applied; the 4 protection triggers exist; `TRUNCATE audit_logs` is still rejected; `resetDatabase` empties every table incl. `audit_logs` and restores the seeded rows; the superadmin trigger protects the test superadmin; factories create every entity; a second active student group for one student is refused; minted tokens verify.
- `src/features/reservations/.../reservations-concurrency.integration-spec.ts`: no longer gated by `RUN_DB_INTEGRATION`; it resets the database, creates its student with the factory and passes (1 of 20 concurrent creations succeeds, 19 conflicts).
- `test/e2e/health.e2e-spec.ts` (4 tests): app boots against both containers with fake AI; `GET /health/ready` 200; only fake providers registered; a Socket.io client `authenticate`s with a minted token (`authenticated` with the user id); an invalid token gets `auth_error`.

## Observed results

```text
$ npx tsc --noEmit -p tsconfig.json     → 0 errors (tsconfig include now "src/**/*", "test/**/*")
$ npx eslint "test/**/*.ts" <new src files> → 0 problems
$ npm run test:integration              → Test Suites: 2 passed; Tests: 9 passed (≈65 s incl. containers)
$ npm run test:e2e                      → Test Suites: 1 passed; Tests: 4 passed (≈180 s warm, ≈280 s first run with image pulls)
$ docker ps -a (after the runs)         → no testcontainers, ryuk or ventylab-verify containers left
```

```text
$ npm run test:unit                     → Test Suites: 230 passed; Tests: 1718 passed
$ npm run verify (3 runs)               → typecheck, lint (src + test), madge, prisma validate, drift + triggers PASS;
                                          tests (test:unit) FAIL: engine-determinism.spec.ts
                                          "replays ten simulated minutes … in under 500 ms" received 617.97 / 514.29 / 662.47 ms
$ npx jest …/engine-determinism.spec.ts → 3 passed (the budget test takes 109 ms alone)
```

`verify` stops at the first failure, so inside `verify` the integration and e2e steps were not reached; they pass when run on their own (above). The failing assertion is the BUG-8 timing budget, which is CPU-contention sensitive under the full parallel unit run even without coverage; the simulation feature is outside this block and was not changed.

## Findings

- **MQTT test prefix covers commands only.** `MQTT_TEST_TOPIC_PREFIX` is applied by `ventilator-commands-config.ts` to the command/ack topics when `NODE_ENV=test`; the telemetry and alarm topics (`ventilator-telemetry-config.ts`) are used as configured. Not a production bug (tests and production use different brokers), but a test run pointed at a shared broker would subscribe to real telemetry topics. The test environment therefore sets those topics explicitly under `test/<runId>`, and the broker is a throwaway container. Business code unchanged.
- **`readDbIntegrationSettings`** (`src/common/infrastructure/config/env.validation.ts`) has no caller now that the concurrency spec runs under `test:integration`; it is outside this block's edit surface (candidate for the knip report in block G).
- **Migration `20261006120000_identity_features`** seeds `app_settings.superadmin_email` with the author's address; tests point it to `superadmin@ventylab.test` in the container baseline instead of using personal data.
- **Slow e2e boot.** The first e2e file spends most of its time transpiling and booting the full `AppModule`; container start plus migrations take about a minute per suite.
