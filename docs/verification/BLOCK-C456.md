<!--
  Funcionalidad: Evidencia del bloque C de calidad (C4, C5 y C6)
  Descripción: Pruebas de concurrencia contra PostgreSQL real (exactamente un ganador), seis flujos e2e de punta a punta con validación de contrato y Socket.io, y pruebas de resiliencia (caída del broker MQTT, base de datos lenta, corte de streams SSE de IA y suscriptores del bus de eventos que fallan): qué prueba cada una, cómo ejecutarlas, vacíos y defectos encontrados
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block C verification — C4 concurrency, C5 E2E flows and C6 resilience

Observed on 2026-10-13, Windows 11, Node 22, Docker Desktop, branch `main` (uncommitted working tree on top of `cc04870`).

## How to run

```text
npx jest --config test/jest/jest.integration.config.js --runInBand test/integration/concurrency test/integration/resilience
npx jest --config test/jest/jest.e2e.config.js --runInBand test/e2e/flows test/e2e/resilience
npm run test:integration / npm run test:e2e      # whole suites, both run by npm run verify
```

Everything runs inside the existing `test:integration` and `test:e2e` suites (block B Testcontainers PostgreSQL and `eclipse-mosquitto:2`, fake AI providers, `resetDatabase`, factories). No `.env`, Supabase, real AI provider, real MQTT topic or ventilator is touched: MQTT traffic uses the per-run `test/<runId>` namespace (the test ventilator client refuses any other topic), the delay proxy only forwards to `localhost`, and the Google double never contacts Google.

## New test infrastructure (reused by every spec)

| File | Purpose |
|---|---|
| `test/support/contract-api.ts` | `contractCaller(baseUrl)`: every flow request goes through `callApi` and `expectMatchesSpec`, so each JSON response (2xx and errors) is validated against `openapi/openapi.json`. |
| `test/support/realtime.ts` | Real `socket.io-client` that authenticates (`authenticate` → `authenticated`) and records every event; `next(event, predicate)` waits for one. |
| `test/support/mqtt-test-client.ts` | Simulated ventilator on the test broker: periodic JSON telemetry on `MQTT_TELEMETRY_TOPIC`, settings that confirm a command, subscription to the prefixed command topic. |
| `test/support/tcp-delay-proxy.ts` | `node:net` proxy (built-ins only): connect delay (cold start), per-chunk delay both ways, hot retarget, drop all connections; local targets only. |
| `test/support/env-overrides.ts` | `createE2eAppWithEnvironment(overrides)`: `ConfigModule` validates the environment when `AppModule` is first evaluated, so overrides are applied before loading `e2e-app` lazily (`jest.requireActual`) and restored afterwards. |
| `test/support/polling.ts` | `waitUntil(read, accept)` for async handlers, telemetry and reconnection, without fixed sleeps. |
| `test/support/e2e-app.ts` (1.2) | New `configure` option to override more providers (Google verifier). |
| `test/support/containers.ts` (1.1) | `startMosquittoContainer()` / `mosquittoUrl()` so a spec can own, stop and replace a broker. |
| `test/factories/clinical-cases.factory.ts` (1.1) | `SIMULATION_READY_CASE_PROFILE` + `makeClinicalCaseSimulationReady()` (mechanics, initial settings, initial state, sex, height). |
| `src/features/auth/application/testing/google-auth-test-doubles-spec.ts` | `FakeGoogleIdTokenVerifier` + `withFakeGoogleVerifier` (overrides `GOOGLE_ID_TOKEN_VERIFIER_TOKEN`). |
| `src/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec.ts` (1.1) | `SignalRecordingLlmProvider`: a `FakeLlmProvider` that keeps the `AbortSignal` of every stream. |

## C4 — concurrency (exactly one winner)

| # | Requirement | Status | Spec | What it proves |
|---|---|---|---|---|
| 1 | Same reservation slot | covered (block B) | `reservations-concurrency.integration-spec.ts` | 20 concurrent creations → 1 created, 19 `ReservationConflictError`. |
| 2 | Double attempt submit | new | `test/integration/concurrency/submissions-concurrency.integration-spec.ts` | 8 concurrent evaluation submits → all return the same result (submit is idempotent by contract), 1 attempt, `GRADED` once, exactly 1 `GRADE_PUBLISHED` notification (events published once). 8 concurrent quiz attempts → 1 fulfilled, 7 `QuizAlreadyAttemptedError`, 1 row. 8 concurrent activity submits → 1 fulfilled, 7 `ActivitySubmissionAlreadyCompletedError`, 1 `activity_submission_submitted` audit row (**BUG-10**, fixed). |
| 3 | Double attempt start | covered (C2) + new | `evaluation-attempts.integration-spec.ts` (C2); `submissions-concurrency.integration-spec.ts` | Evaluation start: 10 → 1 `created`. New: 8 concurrent activity submission starts → 1 fulfilled, 7 `ActivitySubmissionAlreadyCompletedError`, 1 row. |
| 4 | Simultaneous ventilator-control preemption | new | `test/integration/concurrency/ventilator-preemption-concurrency.integration-spec.ts` | 6 teachers preempt the same active reservation → 1 fulfilled, 5 `ReservationConflictError`/`ReservationNotScheduledError`; target `PREEMPTED`, exactly 1 overlapping `SCHEDULED` reservation, 1 `reservation.preempted` audit row. 6 simultaneous control takeovers of the same operator → `fulfilled + 423 = 6`, one audit row per winner, no two winners replaced the same operator (audit chain without forks) and the in-memory operator is the chain's last link. |
| 5 | Platform setting, same version | covered (C2) | `platform-settings.integration-spec.ts` | 8 updates from version 0 → 1 applied, 7 `PlatformSettingVersionConflictError`. |

Takeover note: control is an in-memory compare-and-set. A takeover that read the state after another committed legitimately replaces that teacher, so "exactly one" is not the contract; the asserted invariant is "no lost update".

## C5 — E2E flows (`test/e2e/flows/`)

| # | Spec | Status | What it proves |
|---|---|---|---|
| 1 | `google-student-progress.e2e-spec.ts` | new | `POST /api/auth/google` with the fake verifier creates a `STUDENT` without password; level 2 locked; viewing the 2 pages of level 1 completes lesson → module (100 %) → level (`completed`) → section (`1/2` levels); level 2 `unlock-status` turns `isLocked: false` with the prerequisite completed. |
| 2 | `mixed-evaluation-grading.e2e-spec.ts` | new | Teacher creates an EXAM (single choice, true/false, open text) through the API, sets `READY`, assigns it to the group; student gets `notification:new` `EVALUATION_ACTIVATED` on the socket, starts and submits → `PENDING_REVIEW` with choice answers auto-scored; teacher sees it in the queue, grades the open question → `GRADED`, publishes; student gets `GRADE_PUBLISHED` on the socket; feedback reaches `READY` with the fake provider; grade in `/api/me/summary`; analytics stats `1 attempt / 1 graded / 1 published`. |
| 3 | `practical-exam-simulation.e2e-spec.ts` | new | EXAM session bound to the SIMULATION question, 2 `PARAM_CHANGE` events, end; the answer is bound to the session and submitted with no score from the client; the stored `autoScore` equals `points × score` of the server replay and the attempt is `GRADED` and published. A FREE session cannot be bound to the exam answer (422). |
| 4 | `ventilator-reservation-preemption.e2e-spec.ts` | new | Leader reserves for the group; a member takes control and sends a command → 202; the command arrives on `test/<runId>/…/command` with its `correlationId`; simulated telemetry with matching settings → `APPLIED`; teacher without confirmation → 409 `reservations.conflict_preemptable`; teacher preempts → 201, member gets `ventilator:control-changed` (no operator) and `notification:new` `RESERVATION_PREEMPTED`; reservation `PREEMPTED`; next command → 403; `/api/audit` lists the `reservation.preempted` entry. |
| 5 | `ai-providers-down.e2e-spec.ts` | new + gap (BUG-11) | Providers: gemini 503, openai timeout (1 s per-use-case timeout through `AI_USE_CASE_SETTINGS`), anthropic 502, breaker threshold raised so every call tries every provider. Grade feedback `READY` with every item `DETERMINISTIC`, only `FALLBACK` rows for `GRADE_FEEDBACK`, admin stats `fallbackRate: 1`; simulation advice SSE ends with `done` `source: DETERMINISTIC` and a `FALLBACK` row. Notes analysis has **no** deterministic fallback: it answers the documented 503 with an `ERROR` row (pinned by a plain test) and the expected fallback is an `it.failing` test (BUG-11, open). |
| 6 | `superadmin-protection.e2e-spec.ts` | new | Role change by an admin, a second admin and the superadmin, the legacy `PATCH /api/admin/users/:id/role`, and deactivation by each → 403 with `users.superadmin_role_immutable` / `users.superadmin_status_immutable`, row unchanged; direct SQL `UPDATE` role/status/email and `DELETE` are all rejected by the trigger; an ordinary admin can still be demoted. |

Every JSON response of the six flows is validated against `openapi/openapi.json` (status documented and body schema).

## C6 — resilience

| # | Spec | Status | What it proves |
|---|---|---|---|
| 1 | `test/e2e/resilience/mqtt-broker-outage.e2e-spec.ts` | new | App and simulated ventilator use a dedicated Mosquitto container behind the delay proxy (reconnect backoff 200–1000 ms). Command `APPLIED` while up; after `stop()` of the broker container the app keeps answering, `/health` and `/health/ready` stay 200 (readiness only checks the database, as documented), `/api/system/status` reports `mqttBroker: down`, `connected: false`, global `DEGRADED`, and a command answers 503 `ventilator-commands.device_offline`; after a new broker container starts and the proxy is retargeted, the status returns to `up` and a new command reaches `APPLIED` (reconnection and resubscription work). |
| 2 | `test/e2e/resilience/slow-database.e2e-spec.ts` | new | App boots against PostgreSQL behind the proxy with a 2 s connect delay (cold start) and 100 ms per chunk: requests succeed. With 1.2 s per chunk (`HEALTH_CHECK_TIMEOUT_MS` = 1 s): `/health/ready` answers 503 `{status: "not_ready"}` within the timeout plus margin, `/health` stays 200 and fast, an authenticated read still succeeds (slowly); without latency readiness returns to 200. |
| 3 | `test/e2e/resilience/ai-sse-client-abort.e2e-spec.ts` | new | Student opens the tutor deepen SSE against a slow fake stream, reads the first chunk and closes the socket: the provider's `AbortSignal` is aborted, exactly one `ABORTED` `PAGE_DEEPEN` telemetry row, one incomplete assistant message shorter than the full answer, no `Logger.error` call and no unhandled rejection. |
| 4 | `test/integration/resilience/event-bus-subscriber-isolation.integration-spec.ts` | new | Real `@OnEvent` subscribers on `EventsModule`: a synchronous one that throws (`suppressErrors: false`, so the bus handles it), an asynchronous one that rejects with the default options, a raw listener that throws and one that returns a rejected promise. `publish` does not throw, healthy synchronous and asynchronous subscribers still run for every event, the bus logs `Subscriber of … failed` for its 3 failures, the event-emitter wrapper logs the default async failure, and there is no unhandled rejection. |

Observation (not a defect of the production configuration): an `@OnEvent(..., { async: true, suppressErrors: false })` listener that rejects escapes the bus as an unhandled rejection, because the event-emitter async wrapper does not return the listener's promise. No handler in `src/` uses `suppressErrors: false`, and the skill requires async handlers to catch everything.

## Bugs

- **BUG-10 — concurrent activity submits all succeed (fixed).** Repro: 8 concurrent `SubmitSubmissionUseCase.execute` for one DRAFT submission → 8 fulfilled and 8 `activity_submission_submitted` audit rows (`submissions-concurrency.integration-spec.ts`, RED observed). Cause: the use case read and saved the submission without any lock, unlike start/evaluation submit. Fix: `IActivitySubmissionsRepository.lockStudentAttempt(activityId, userId, transaction)` takes the same `pg_advisory_xact_lock` key used when the submission is created; `SubmitSubmissionUseCase` takes it after the ownership checks and re-reads the submission under the lock, so the documented `ActivitySubmissionAlreadyCompletedError` (409) reaches every loser. Regression: the integration race (1 fulfilled, 7 × 409, 1 audit row) and `submit-submission.usecase.spec.ts` (lock before the second read and the save; a submission committed meanwhile is rejected without saving).
- **BUG-11 — notes analysis has no deterministic fallback (open, not fixed).** Repro: with every provider failing, `POST /api/notes/analyze` answers 503 `AiProvidersUnavailableError` and writes an `ERROR` row (`ai-providers-down.e2e-spec.ts`). `AITextNotesAnalyzer` calls `AiGateway.complete("NOTES_ANALYSIS", …)` without `fallback`, while the C5 requirement and the AI gateway convention expect a deterministic answer. Not fixed because 503 is the documented contract of the route (OpenAPI `503 The AI service is not available`). Proposed fix: build a deterministic analysis from the notes (e.g. most frequent terms as key concepts, a template summary, `gaps: []`, generic suggestions), pass it as `fallback`, return it when `result.source === "DETERMINISTIC"`, update the OpenAPI description, and turn the `it.failing` test into a plain test.

## Gaps

- C5.5 notes analysis: see BUG-11.
- C6.2 checks a cold start at boot and slow round trips; a connection dropped by the server in the middle of a run (pooled connection reset) is not exercised. `PrismaService` has no query timeout; connect and pool timeouts come only from `DATABASE_URL` parameters.
- C4.4 control takeover: in-memory state (one process), so the race is proven within one instance only.

## Observed results

```text
npx tsc --noEmit -p tsconfig.json                         → 0 errors
npx eslint <27 new/changed .ts files>                     → 0 problems
npx madge --circular --extensions ts src                  → no circular dependency
integration test/integration/concurrency + resilience     → 3 suites, 9/9
e2e flows/superadmin + flows/google                       → 10/10
e2e flows/mixed + flows/practical                         → 3/3
e2e flows/ventilator                                      → 1/1
e2e resilience/mqtt + flows/ai-providers                  → 7/7 (1 it.failing for BUG-11)
e2e resilience/slow                                       → 4/4
e2e resilience/ai-sse                                     → 1/1
unit src/features/activities                              → 4 suites, 20/20
whole test/e2e (--runInBand)                              → not observed: killed by the OS for low memory
docker ps                                                 → empty (leftovers of the killed run removed)
```

The whole e2e suite (including the block C3/D specs together with these) still has to be run once with enough free memory (`npm run test:e2e` or `npm run verify`).
