<!--
 * Funcionalidad: Contexto del backend para asistentes de IA
 * Descripción: Estado real del backend NestJS de VentyLab: stack, arquitectura, familias de rutas, roles y permisos, contrato OpenAPI compartido con ventilab-web, contrato Socket.io (incluido el lote ventilator:telemetry), MQTT, variables de entorno, migraciones versionadas, despliegue en un contenedor persistente de una sola réplica sobre Dokploy y comandos. v1.2: sin el puente de NextAuth (ruta nextauth-token, NEXTAUTH_SECRET y NEXTAUTH_BRIDGE_SECRET). v1.3 (Bloque 1): reserva inmediata, paciente propio en sesiones FREE, sembrador de arranque de casos clínicos y limitaciones conocidas (operador y sala en memoria, vencimiento por sondeo). v1.4 (Bloque 2): GET /api/lessons/:id/access y nuevas rutas deprecadas. v1.5 (W12 Bloque 2): sección de aprendizaje, gamificación y tutor (orden obligatorio, registro de actividad, logros, valoraciones con superficie y alcance, evento SSE start), 32 migraciones y limitaciones conocidas del bloque. v1.6 (Bloque 3): evaluación por tipo (retroalimentación inmediata, publicación automática, pista, nota parcial), vínculo con el currículo, lista de intentos para calificar, reinicio de intento con concesión auditada, correcciones del feedback IA, 33 migraciones y limitaciones del bloque. v1.7 (Bloque 4): alcance docente por grupos creados o supervisados, directorio y estadísticas corregidos, gamificación y actividad de un estudiante para el staff, grabaciones por usuario, reservas de grupos creados, profesores, valoraciones solo ADMIN con superficie derivada, cambio de contraseña con revocación y reemisión, foto de perfil con almacenamiento local fuera de producción, 34 migraciones y limitaciones del bloque. v1.8 (cierre ola 1 de IA): proveedor externo de terceros, respaldos deterministas del tutor y del análisis de notas, prompts versionados de retroalimentación y notas con idioma y redacción de datos personales, telemetría de detalle por llamada, reintentos con jitter y Retry-After, 35 migraciones y limitaciones nuevas
 * Versión: 1.9 (Bloque A: motor 2.0.0, debriefing, interpretación del caso y ayuda de alarmas)
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
- AI gateway: Gemini (`@google/generative-ai`), OpenAI, Anthropic and an env-configured external third-party provider (HTTP adapters) behind ports, with circuit breaker, retries with jittered backoff, quotas and prices
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

Prisma schema: `prisma/schema.prisma`, **62 models**. `PrismaService` is the only client in `src`.

## Routes

- No global prefix; every controller declares `api/<resource>`. Health is the exception: `GET /`, `/health`, `/api/health`, `/health/ready`, `/api/health/ready` (public, no throttling).
- 369 method + route combinations (54 controllers), exactly the operations of `openapi/openapi.json`. 24 of them are deprecated controller aliases (`api/cases`, `api/cards`, `api/evaluation/quizzes`) with `Deprecation`/`Link` headers.
- Route families: `auth`, `authorization`, `users`, `me/summary`, `admin` (+ `admin/ai-ratings`, `admin/ai-telemetry`, `admin/ai/providers`), `levels`, `modules`, `lessons`, `steps`, `pages`, `sections`, `curriculum`, `teaching` (curriculum editor), `overrides`, `changelog`, `progress`, `quizzes`, `clinical-cases`, `activities`, `activity-assignments`, `activity-submissions`, `evaluations`, `evaluation-assignments`, `evaluation-attempts`, `evaluation-grading`, `my-evaluations`, `groups`, `scores`, `teacher-students`, `teachers`, `students`, `notes`, `notifications`, `media`, `tutor`, `ai-ratings`, `analytics`, `audit`, `platform-settings`, `system`, `reservations`, `ventilator` (telemetry, commands, control), `simulation` (legacy simulator plus `simulation/sessions/*` of the isomorphic engine, ADR 0005).
- `api/auth`: `register`, `login`, `google`, `refresh`, `logout`, `me`, `change-password` (Block 4). There is **no** `register/superuser` route, and the NextAuth bridge (`nextauth-token`) was retired.
- Public routes: health, `POST api/auth/register|login|google|refresh`, `GET api/simulation/health`. Content reads use `OptionalJwtAuthGuard`. Everything else uses `JwtAuthGuard` + `PermissionsGuard` with `@RequirePermissions(...)` (method metadata replaces class metadata; all listed permissions are required).
- Legacy routes deprecated with `@DeprecatedRoute`: `PATCH api/admin/users/:id/role`, `GET api/pages/by-legacy-json/:id`, `GET/PUT api/progress/lesson/:lessonId`, and since Block 2 `GET api/teaching/lessons/:lessonId/access` (successor `GET api/lessons/:id/access`), `GET api/modules/:id/resume`, `GET api/progress/resume/:moduleId`, `GET api/progress/milestones` and `GET api/progress/skills`, and since Block 4 `POST api/users/me/change-password` (successor `POST api/auth/change-password`; it still revokes but does not reissue tokens). List in `docs/api/legacy-endpoints.md`.

## Learning, gamification and AI tutor (Block 2)

- **Mandatory order on the server.** `GET /api/lessons/:id/access` answers `{allowed, reason: module_locked | previous_lesson_incomplete | null, missing[]}` (`CheckLessonAccessUseCase` + the curriculum unlock rules). The same rule makes `GET /api/pages/:id` and `POST /api/progress/pages/:pageId/view` answer **403 `progress.lesson_locked`** with `details.missing`. Staff (TEACHER, ADMIN) bypass it. A published lesson without published pages never blocks (it is skipped).
- **Page view result:** `PageViewResultDTO` carries `lessonJustCompleted` and `moduleCompleted`; `LessonCompletedEvent` is emitted once, from the `created` flag of the `PageProgress` upsert. `lessonCount` of the curriculum tree counts only published lessons with published pages (a published module with 0 is "coming soon" in the web).
- **Gamification** (rules in `docs/bloque2/reglas-gamificacion.md`): idempotent ledger `learning_activity_events` (`@@unique([userId, kind, refId])`, insert-and-skip) and `user_activity_days` with the day in **America/Bogota**. XP: page 5, lesson 50, module 200, first passed evaluation 100, achievement = its `xpReward`; level `floor(xp / 500) + 1`; streak = consecutive Bogotá days ending today or yesterday. Endpoints `GET /api/progress/gamification`, `GET /api/progress/activity?from&to`, `GET /api/progress/activity/recent`; `overview.stats.streakDays` is real. `LearningActivityBackfillService` fills the ledger **on startup** from completions, page progress and published evaluations (idempotent).
- **Achievements:** `Achievement.code` + `@@unique([userId, code])` (duplicates cleaned in the migration) and `xpReward`; unlocked also by passed evaluations and streak days; `achievement:unlocked` on Socket.io (toast only, no persisted notification).
- **`GET /api/me/summary`** adds `continueLearning {moduleId, lessonId, lessonTitle, moduleTitle, percent} | null` from `UserProgress.lastAccessedLessonId`.
- **AI tutor and ratings:** tutor SSE streams (`POST /api/tutor/pages/:pageId/deepen`, `POST /api/tutor/conversations[/:id/messages]`) send a `start` event with `{conversationId, messageId}` before the first `delta`, then `done` / `error`. `AiRating` stores `surface` (`POPUP | ACCORDION | ASSISTANT | NOTES_ANALYSIS`) and `scope` (`LESSON | MODULE | PAGE | FREE`); module questions use the `MODULE_QA` use case (separate from `LESSON_QA`); a stopped answer with saved text can be rated. `GET /api/admin/ai-ratings/stats` filters and groups by `surface` and `scope`.
- **No fake AI provider.** Without keys every AI use case answers its deterministic fallback (TOPIC_CHECK falls back to a term list); only a call without fallback can answer 503. The web E2E specs point `OPENAI_BASE_URL` at a local OpenAI-compatible stand-in (`ventilab-web/scripts/e2e/fake-llm.mjs`).

## Evaluation (Block 3)

Design, default decisions and deviations: `../DISENO_BLOQUE3.md` (§2, §7b and §9). Migration `20261101120000_evaluation_block3` (additive: `evaluation_questions.hint`, `evaluation_answers.revealed_at`, `grade_feedbacks.superseded_at`, table `evaluation_attempt_grants`, enum value `AiRatingSurface.EVALUATION_FEEDBACK`).

- **Policy by type, derived in the domain** (`evaluation-type.ts`: `immediateFeedbackFor`, `autoPublishFor`; no new column). QUIZ and WORKSHOP: immediate feedback and automatic publication; EXAM: no feedback, published by the teacher unless `showResultsImmediately`. An attempt with only closed questions ends GRADED (and PUBLISHED when auto-published); with an OPEN_TEXT question it ends PENDING_REVIEW with `partialClosedScore` (QUIZ and WORKSHOP only), and a WORKSHOP is auto-published when the teacher finishes the review.
- **Immediate check:** `POST /api/my-evaluations/attempts/:attemptId/answers/:questionId/check` `{selectedOptionIds}` upserts the answer under the attempt lock, sets `revealedAt` and returns `{isCorrect, correctOptionIds, explanation}`. 422 `evaluation.answer_check_unavailable` for EXAM or a non-choice question; 409 `evaluation.answer_locked` for a revealed answer (a later PUT too; on submit a revealed answer is ignored). The attempt detail carries the correction of revealed questions only. `hint` reaches the student only in WORKSHOP and never falls back to the explanation.
- **Curriculum link:** `GET /api/my-evaluations` items carry `moduleId`, `levelId`, `levelTitle`, `levelOrder`, `track` and `attemptsAllowed` (maxAttempts + granted extra attempts); optional `?moduleId=` filter.
- **Grading list:** `GET /api/evaluation-grading/attempts?evaluationId&groupId&status[]&page&limit` (evaluationId required; counts by status ignore the status filter; ordered by student then attempt number), scoped like the grading queue.
- **Reset (non-destructive):** `POST /api/evaluation-grading/students/:userId/evaluations/:evaluationId/reset` `{reason}` (1-500) upserts `EvaluationAttemptGrant.extraAttempts` (+1) and audits `EVALUATION_ATTEMPT_RESET` in the same transaction; after commit `ATTEMPT_RESET` is persisted and sent over `notification:new`. 404 when the student has no group or the evaluation is not assigned to it; 409 `evaluation.attempt_in_progress`; 409 `evaluation.assignment_not_active` with `{assignmentId, startsAt, endsAt}`. `start` allows `maxAttempts + extraAttempts`.
- **AI feedback:** `FEEDBACK_READY` only when the grade is already published when generation ends; regenerate marks `supersededAt` instead of deleting (`@Throttle` 5/min, 409 with a PENDING younger than 10 min); a PENDING older than 10 min reads as FAILED; regrading a published grade regenerates. `GET .../feedback` embeds `myRating` per item. Ratings from the result send `surface=EVALUATION_FEEDBACK`.

## AI hardening (wave 1 closure)

Migration `20261104120000_ai_call_log_details` (additive, nullable columns on `ai_call_logs`). Integration guide of the external model: `docs/cierre/ia-terceros.md`.

- **External provider `external`.** Replaces the dead `custom` stub. Env only: `AI_EXTERNAL_BASE_URL` + `AI_EXTERNAL_MODEL` register it; `AI_EXTERNAL_API_KEY`, `AI_EXTERNAL_AUTH_HEADER` (`Authorization` sends `Bearer <key>`, any other header the raw key), `AI_EXTERNAL_FORMAT` (`openai`: OpenAI-compatible `/chat/completions` with SSE, reuses `OpenAIProvider`; `simple`: `POST {model, system, messages, maxTokens, temperature, responseFormat}` → `{text, model?, usage?: {inputTokens, outputTokens}, finishReason?}`, no streaming), `AI_EXTERNAL_TIMEOUT_MS` (0 = only the per-use-case timeout), `AI_EXTERNAL_PRICE_INPUT_PER_MTOK`/`_OUTPUT_PER_MTOK` (default price of `external:<model>`, 0 by default; the effective price falls back to it when the `ai.prices` setting has none). Default chain `gemini → openai → anthropic → external`; the model `default` resolves to `AI_EXTERNAL_MODEL`. **Legacy id:** stored chains, models and the probe route still accept `custom` and resolve it to `external` at read time (no data migration). Probe: `POST /api/system/probe/ai/external`.
- **Deterministic fallbacks.** `PAGE_DEEPEN` answers the page key points (first sentence of each paragraph); `LESSON_QA`/`MODULE_QA`/`FREE_CHAT` an honest "the AI assistant is not available" notice pointing to the content; `NOTES_ANALYSIS` a rule-based analysis (note and word counts, ventilation glossary concepts, coverage of the lesson or module title terms). Every fallback text starts with a "non-AI" label, is recorded as `FALLBACK` with provider `deterministic` (cost 0, excluded from per-provider health), and is flagged to the web with `source`: tutor SSE `done` = `{aiCallId, messageId, conversationId, source}` (`LLM` | `DETERMINISTIC`; the off-topic refusal is `DETERMINISTIC` too) and `NotesAnalysisDTO.source` (with `model: ""`), the same flag SIM_ASSIST (`done.source`) and grade feedback (`source`) already used. The tutor and notes routes no longer document 503. SSE stays one `delta` + `done`.
- **Versioned prompts.** `GRADE_FEEDBACK` (evaluations) and `NOTES_ANALYSIS` are built in the prompt registry from structured inputs (`ai/domain/prompts/grade-feedback-prompt.ts`, `notes-analysis-prompt.ts`), version `2.0.0`, so `promptVersion` follows the real text. The clinical-case evaluation feedback still sends its own consumer prompt through `GRADE_FEEDBACK`, recorded as version `1.0.0` (`PromptTemplate.versionFor`).
- **Grade feedback requester.** Submitting (student), grading or regrading an answer and regenerating (teacher) carry a `GradeFeedbackRequester {userId, role, language}` on the domain events; the feedback is written in the requester's `i18n.lang`. The AI call is **attributed** to the student who owns the attempt (`ai_call_logs.user_id`) and the **quota** is checked for the requester (`AiCallOptions.quotaUserId/quotaUserRole`); a quota rejection yields the deterministic feedback. Expiry closes have no requester: Spanish, no quota.
- **Personal data.** The student's name and email are removed (`redactPersonalData` + `redactableNameTokens`) from evaluation answers and from notes before they reach a provider, as in the tutor and SIM_ASSIST.
- **Telemetry.** `ai_call_logs` adds `language`, `finish_reason` (`stop | length | content_filter | error | unknown`, mapped per adapter from finish_reason / stop_reason / finishReason), `temperature`, `max_output_tokens`, `attempt_trail` (JSON `[{provider, model, outcome: success|error|aborted|fallback, errorCode, latencyMs}]`, retries included) and `provider_request_id` (`x-request-id`/`request-id` header or response id). TTFT is also set for non-streamed calls (= latency until the answer). `GET /api/admin/ai-telemetry/export.csv` exports the new columns.
- **Retries.** One retry per provider for 429/5xx/network errors after a bounded exponential backoff with full jitter (base 500 ms, cap 4 s) or the provider's `Retry-After` (seconds or HTTP date, at most 5 s of waiting); a timeout moves to the next provider. When every attempt was rate limited and the use case has no fallback, the 503 `ai.providers_unavailable` carries `Retry-After` (latest provider value, at most 60 s).
- **Quota.** The daily quota (requests and tokens per role and use case) is unchanged. Token usage is only known after a call, so a call is admitted while the tokens spent so far are below the limit and may overshoot it by one answer.

## Simulator adjustments (Block A)

- **Engine 2.0.0.** Optional `EngineCase.evolution` (`domain/engine/patient-evolution.ts`): physiological insults (SpO2 < 88 %, pH < 7.20, Pplat > 30 or ΔP > 15, auto-PEEP over the case max, MAP < 65) drive a bidirectional severity (compliance loss and shunt as the old deterioration level), overdistension above 30 cmH2O plateau raises shunt and dead space, MAP falls with severity, acidosis and hypoxemia, heart rate responds (`hemodynamics.heartRateBpm`), and `metrics.patient.status` goes `STABLE → UNSTABLE → CRITICAL → ARREST → DECEASED` (arrest after `arrestAfterCriticalMin` of critical exposure, irreversible; a deceased engine ignores later events). Patient alarms `LOW_SPO2`, `LOW_MAP`, `TACHYCARDIA`, `BRADYCARDIA`, `CARDIAC_ARREST`. Patient clock = sim time × multiplier. Without the block the engine behaves as 1.0.0.
- **Version gate.** `SimulationCaseMapper.toDefinition(snapshot, engineVersion)` adds the evolution (case block or one derived from `deterioration`, with MAP thresholds below the case baseline) only when `engineSupportsEvolution(session.engineVersion)`: sessions recorded with 1.0.0 replay and grade unchanged. Seed case `engine-ards-unstable` dies untreated in about 11 patient-minutes and recovers with ARDSNet PEEP and a protective Vt; `seed-cases-evolution.spec.ts` checks that no seeded case stable at start turns critical by waiting.
- **Debrief.** The session summary stores `outcome` (status and the times of first critical state, arrest and death) and `timeline` (decisions with old and new values, alarm onsets, patient status changes; at most 200), from the server replay.
- **Case interpretation.** A FREE session start calls `SIM_CASE_INTERPRETATION` (strict JSON, 8 s budget): each engine parameter is accepted only within ±30 % of the curated value and its physiological range; the record is stored in `patient_profile.interpretation` and replay applies `applied`. Any failure keeps the curated values; exams never interpret.
- **Coaching and alarm help.** `SIM_ASSIST` 1.2.0 receives the patient status and one trend point per patient minute (last 5). `POST /api/simulation/sessions/:id/alarm-help` and `POST /api/simulation/real/{alarm-help,assist}` stream `rules` (deterministic, sourced, `domain/assist/alarm-stabilization-rules.ts`), `delta` and `done` `{aiCallId, source, aiHelpEventId?}`; rate with targetType `AI_CALL` (targetId = aiCallId) and surface `SIM_ALARM`. Real-mode routes take the telemetry from the client and never reach ventilator commands. Content to validate: `docs/cierre/validacion-contenido.md`, Bloque A.

## Staff panel, administration and profile (Block 4)

Design, default decisions and deviations: `../DISENO_BLOQUE4.md` (§2, §4, §7b and §9). Migration `20261103120000_panel_block4` (additive: `users.avatar_media_id` nullable FK `SetNull` with index, enum value `AiRatingSurface.SIMULATOR_ASSIST`).

- **Teacher scope of a student:** `GroupsFacade.assertCanViewStudent` — ADMIN sees everyone; a TEACHER sees the students of the groups they created or supervise (inactive groups included), else 403 `groups.student_out_of_scope`. Applied to `GET /api/users/students/:id` (which also accepts a legacy `TeacherStudent` link, through the `STUDENT_SCOPE_CHECKER_TOKEN` port to avoid a Users ↔ Groups cycle), the four `student-progress` routes, `admin/students/:id/progress`, the new progress reads and the recordings. Scope is checked before existence: a teacher gets 403 even for an unknown id, an admin 404. The student detail returns `studentCode` and the active `groups`.
- **Directory:** `GET /api/admin/students` (`myGroups=true` = groups the caller created or supervises, an empty page when none), rows with `studentCode`, active `groups[]`, `canView`, published-content progress (`LearningProgressFacade`), `lastActivity`; search by name, email or code; sort by progress or lastActivity computed in memory before paging. `GET /api/admin/statistics`: published modules and lessons, READY evaluations, completions "today" in America/Bogota, active students (30 days).
- **Staff reads of a student:** `GET /api/progress/users/:userId/{gamification,activity/recent,achievements}` (read-only, staff, scoped). `GET /api/ventilator/telemetry/recordings?userId&from&to` lists the recorded reservations of the user or of their groups (90 days by default, at most 366, up to 100 rows). Personal notes and AI conversations are never exposed to staff.
- **Reservations:** a teacher reserves for the STUDENT groups they created or supervise (`canManageGroup`); "for another user" stays ADMIN only.
- **Teachers:** `GET /api/admin/teachers` (ADMIN) lists, per teacher or admin, the active student groups they created or supervise and the distinct student count.
- **AI ratings analytics:** `ai-ratings:read` is ADMIN only (a teacher JWT loses it on refresh). Stats, CSV and the research export derive the surface on read (`coalesce(surface, by targetType)`, no backfill), filter and group by `surface` and `scope`; the CSV adds `surface` and `scope` and keeps `promptVersion` and `callStatus`; the research export groups by `<surface>/<useCase>`. The simulator assistant and the module notes analysis send `SIMULATOR_ASSIST` and `scope=MODULE`.
- **Password change:** `POST /api/auth/change-password` `{currentPassword,newPassword}` (`@Throttle` 5/min) sets `refreshTokensRevokedAt = now` and reissues the current pair with `iat = floor(revokedAt) + 1` (`generateRefreshToken(..., issuedAtSeconds)`), answering like the login: the current session stays alive and every earlier refresh token answers 401. 400 on a wrong or equal password or a Google account (`UserDTO.hasPassword = false`). The access token of other devices lives until it expires (15 min).
- **Profile photo:** `PUT /api/users/me/avatar` (multipart `file`, png/jpeg/webp up to 2 MB, magic bytes checked; 413/415/503) and `DELETE /api/users/me/avatar`, both returning `UserDTO`; rules in `common/domain/value-objects/avatar-upload-rules.ts`. `UserDTO.image` is a signed URL of the uploaded photo (re-read it, it expires) or else the stored image (Google picture); login, Google, `auth/me`, password change and the student responses resolve it. Storage port `AVATAR_STORAGE_TOKEN`: Supabase Storage, or outside production without Supabase a local disk adapter (`os.tmpdir()/ventylab-local-storage`, served as `data:` URLs; `/api/media` uploads work locally too). `PATCH /api/users/me` only accepts an http(s) `image` (max 2048); stored base64 images are not deleted.
- **Contracts:** the unused realtime events `ventilator:reserved`/`released` and the legacy profile contract were removed; the AsyncAPI spec test also fails on an event without an emitter.

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

Validated at startup by `src/common/infrastructure/config/env.validation.ts` (111 variables); `.env.example` lists all of them. `process.env` is read only under `src/common/infrastructure/config/`.

- Required (no default): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `SUPERADMIN_EMAIL`, `CORS_ORIGIN`, `FRONTEND_URL`, `PRODUCTION_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`.
- Optional and unused by live flows: `ADMIN_API_KEY` (`AdminApiKeyGuard` exists but no route applies it).
- Everything else is optional or has a default (MQTT, `VENTILATOR_*`, AI, Supabase, media, reservations, simulation, analytics). Telemetry frequency is set by `VENTILATOR_FLUSH_INTERVAL_MS`; there is no `WS_MAX_HZ`.
- Admin-editable runtime settings (platform settings) override some defaults without a restart (ADR 0009).

## Database and migrations

- `prisma/migrations/` **is tracked by git** (35 migrations, latest `20261104120000_ai_call_log_details`). `.gitignore` keeps `*.sql` backups ignored but re-includes `prisma/migrations/**/migration.sql`.
- The container entrypoint runs `prisma migrate deploy` (through `DIRECT_URL`) on every start and refuses to start if it fails.
- Clinical cases: `ClinicalCasesBootstrapService` inserts the July cases and the `engine-*` base cases on startup when they are missing (insert-only, never updates, so cases with sessions keep their replay). `prisma/seed-clinical-cases.ts` is insert-only as well.
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

## Known limitations

- **Single replica only.** The exclusive ventilator operator (`OperatorControlService`) and the ventilator room membership (`VentilatorRoomAccessService`) live in process memory. A restart drops the current operator (users reconnect and take control again), and a second replica would see a different operator and room. Scaling out needs a distributed operator lock and a Socket.io Redis adapter (see Deployment).
- **Reservation expiry is detected by polling.** There is no domain event when a reservation ends naturally: the room refresh (every `VENTILATOR_ROOM_REFRESH_MS`, 1000 ms by default) notices it and then emits `ventilator:availability` and `ventilator:control-changed` with reason `reservation_ended`. Clients may see the end up to about one second late. Preemption does emit `reservation:preempted` immediately.
- **Anonymous `GET /api/pages/:id` is not order-gated.** The order rule needs the user; content reads use `OptionalJwtAuthGuard`, so a request without a token reads any published page (the web always sends the token).
- **Concurrent last-page views.** Two simultaneous first views of the two remaining pages of a lesson (for example two tabs) each see the other page still unviewed before it commits, so neither completes the lesson: no `lessonJustCompleted` and no lesson completion until the next view of any page of that lesson. Completion is never doubled (conditional write of `LessonCompletion`) and the ledger stays idempotent.
- **Historic streak is under-counted.** The backfill only knows the first and last timestamps per page, lesson and module, not every active day before Block 2.
- **An answer aborted before its first token cannot be rated** (no assistant message is saved); answers that fail mid-stream are saved as incomplete.
- **Immediate reservations** (`POST /api/reservations` with `durationMinutes` and no `startsAt`) start at the current minute and are not aligned to `slotMinutes`, so the calendar can show gaps shorter than one slot.
- **`AiRatingSurface.EVALUATION_FEEDBACK` and `SIMULATOR_ASSIST` cannot be removed** without recreating the enum type (PostgreSQL has no `DROP VALUE`); it is additive and deletes no data.
- **XP is insert-only:** regrading a passed evaluation down does not take back its XP (documented in `docs/bloque2/reglas-gamificacion.md`).
- **Revealed answers with several attempts:** a QUIZ or WORKSHOP with `maxAttempts > 1` reveals the correct option of every answered question, which the student can reuse in a later attempt (accepted risk, as in July).
- **Teacher scope changed in Block 4:** teachers that used to read students outside their groups now get 403 (intentional). A teacher who still holds a JWT issued before Block 4 keeps `ai-ratings:read` until the token is refreshed.
- **Password change and other devices:** the refresh tokens of other devices are revoked, but their access tokens and open sockets live until the access token expires (15 min).
- **Directory sort in memory:** `GET /api/admin/students` computes progress and last activity for the whole filtered set before paging; fine at thesis scale (measured with 500 students), not for much larger cohorts.
- **Local avatar storage is temporary:** the disk adapter writes to the OS temp folder and is development only; production needs Supabase Storage.
- **External model not connected yet:** the `external` provider is tested against fake HTTP servers only; the real endpoint of the third party is pending.
- **Staff-triggered grade feedback and quota:** the call is attributed to the student but checked against the teacher's quota, so it never consumes the teacher's daily usage (which is counted from `ai_call_logs.user_id`) and does add to the student's; teacher abuse is bounded by `@Throttle` 5/min and the 10-minute pending guard.
- **Deterministic grade feedback is Spanish only;** the requester language applies to the AI feedback.
- **Fallback flag is not persisted on tutor messages:** a reloaded conversation does not say which assistant messages were non-AI; the `aiCallId` of each message links to its `FALLBACK` telemetry row.
- **External model name and price:** the price is keyed by the model the endpoint reports; if it reports a name other than `AI_EXTERNAL_MODEL`, add that name to the `ai.prices` setting or the cost stays empty.
