<!--
  Funcionalidad: Evidencia del bloque C de calidad (C1, C2 y C3)
  Descripción: Cobertura unitaria de reglas de negocio por área con umbral de 80 % de líneas, pruebas de integración contra PostgreSQL real (repositorios, transacciones, candados consultivos, disparadores, bloqueos de borrado y unicidad bajo concurrencia) y pruebas e2e de autorización (matriz de rutas por actor, IDOR y visibilidad por rol), cómo ejecutarlas, conteos y defectos encontrados
  Versión: 1.1
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block C verification — C1 unit coverage, C2 integration and C3 authorization

Observed on 2026-10-12, Windows 11, Node 22, Docker Desktop, branch `main` (uncommitted working tree on top of block B). C2/C3 were written in T3a; C1 and the BUG-9 fix in T3b.

## How to run

```text
npx jest --config test/jest/jest.integration.config.js --runInBand <spec path>   # one C2 file
npx jest --config test/jest/jest.e2e.config.js --runInBand <spec path>           # one C3 file
npm run test:integration / npm run test:e2e                                       # whole suites (also run by npm run verify)
```

Both suites start their own Testcontainers (PostgreSQL; plus Mosquitto for e2e) through the block B `globalSetup`; no `.env`, Supabase, real AI, real MQTT topic or ventilator is touched.

## C1 — unit coverage of business rules

`npm run test:unit` runs `jest --config test/jest/jest.unit.config.js --coverage --maxWorkers=2` (the `package.json` unit config with the C1 scope) and then `scripts/verify/print-c1-coverage.mjs` (the per-area table). The scope is set in `test/jest/c1-coverage-areas.js`: excluding `*.spec.ts`, `*-spec.ts`, `*.module.ts`, `index.ts`, `*.interface.ts` and `*.types.ts`, it covers these folders:

| Area | Folders under `src/` |
|---|---|
| progress | `features/progress/application`, `features/progress/domain/services` |
| evaluation grading | `features/evaluation/application/use-cases`, `features/evaluation/domain/services` |
| simulation scoring and engine | `features/simulation/domain/scoring`, `features/simulation/domain/engine` |
| reservations and preemption | `features/reservations/application`, `features/reservations/domain/services` |
| AI orchestrator and gateway | `features/ai/application/services`, `features/ai/domain/services` |
| platform settings hard limits | `features/platform-settings/application`, `features/platform-settings/domain` |

Each folder is a separate `coverageThreshold` key with `lines: 80`. Jest totals a directory key across its files, so each folder must pass on its own, which is stricter than one total per area. The keys are absolute paths because Jest resolves them against the working directory. Reports go to `coverage/unit/` (gitignored). The engine-determinism timing test is skipped under coverage and runs in `test:perf`.

| Area / folder | Baseline (lines) | Final (lines) |
|---|---|---|
| progress | 21.5 % (117/544) | 98.3 % (535/544) |
| · progress/application | 23.3 % | 97.7 % |
| · progress/domain/services | 18.5 % | 99.5 % |
| evaluation grading | 90.7 % (1035/1141) | 90.7 % |
| · evaluation/application/use-cases | 87.5 % | 87.5 % |
| · evaluation/domain/services | 98.8 % | 98.8 % |
| simulation scoring and engine | 92.4 % (800/866) | 92.4 % |
| · simulation/domain/scoring | 96.5 % | 96.5 % |
| · simulation/domain/engine | 90.9 % | 90.9 % |
| reservations and preemption | 81.5 % (374/459) | 93.2 % (428/459) |
| · reservations/application | 78.8 % | 92.3 % |
| · reservations/domain/services | 100 % | 100 % |
| AI orchestrator and gateway | 93.5 % (315/337) | 93.5 % |
| platform settings hard limits | 94.8 % (329/347) | 94.8 % |
| whole C1 scope | 80.4 % (2970/3694) | 93.2 % (3442/3694) |

New unit specs (AAA, behavior-first, no snapshots):

- `reservations/application/use-cases/preempt-reservation.usecase.spec.ts` (the use case had no spec): missing or non-scheduled target; the default window (same window, current slot if already started, end rounded up, capped at the maximum duration, at least one slot); an explicit window or holder; the preempted reservation's state and event; students cannot preempt and teachers cannot preempt teachers.
- `reservations/application/use-cases/reservation-reads.usecase.spec.ts`: who controls the current reservation; my reservations (held, created or held through a group, upcoming only); calendar range validation and overlap.
- `progress/domain/services/{achievement-catalog,module-progress-calculator,composite-modules,progress-overview-builder}.spec.ts`: XP, streaks, unlock conditions, module counters, step percentages, best score, composite aggregation, overview stats, availability and levels.
- `progress/application/use-cases/{record-lesson-progress,unlock-achievements,get-module-progress-summary,progress-read-use-cases}.spec.ts` plus the shared doubles `progress/application/testing/progress-test-doubles-spec.ts`.

Result: 240 suites; 1808 passed, 1 skipped (the perf timing test); every threshold met.

## C2 — integration against PostgreSQL

`test/support/integration-app.ts` (new) compiles the real `AppModule` with fake AI providers and calls `init()` without listening, so use cases, Prisma repositories, `PrismaTransactionManager` and `IAuditRecorder` are the production ones.

| File | Tests | What it proves |
|---|---|---|
| `test/integration/database/protection-triggers.integration-spec.ts` | 11 | Raw SQL, no app: superadmin row cannot be demoted (STUDENT/TEACHER), deactivated, renamed or deleted; unprotected columns and other ADMINs stay editable; `audit_logs` accepts INSERT and rejects UPDATE, DELETE and TRUNCATE (row unchanged). |
| `test/integration/users/users.integration-spec.ts` | 5 | Users repository via `ChangeUserRoleUseCase`: TEACHER→STUDENT leaves teacher groups, sets `refreshTokensRevokedAt`, writes one `user_role_changed` audit row; superadmin role/status immutable in the use case (no audit row); a DB trigger rejection inside the use case rolls the whole change back; the app transaction manager leaves no partial rows (note + user update + audit row) when the work throws, and commits them together otherwise. |
| `test/integration/groups/groups.integration-spec.ts` | 5 | 8 concurrent `AddGroupMember` of one student into 8 active student groups → exactly 1 succeeds, 7 `StudentAlreadyInGroupError`, 1 membership row; 8 concurrent `SetSimulatorLead` → exactly one `LEADER` row equal to `simulatorLeaderId`; delete with subgroups → `GroupHasSubgroupsError` (409), nothing deleted; delete without activity → physical delete; delete with members → only deactivated, history kept. |
| `test/integration/evaluation/evaluation-attempts.integration-spec.ts` | 3 | 10 concurrent `StartEvaluationAttempt` (same student and assignment) → 10 fulfilled, exactly 1 `created`, one attempt id, 1 `IN_PROGRESS` row; deleting an assignment with attempts → `EvaluationAssignmentHasAttemptsError` (409), rows kept; without attempts → deleted. |
| `test/integration/content/curriculum-delete.integration-spec.ts` | 3 | `DeleteSectionUseCase` cascades section → level → module → lesson → page → page section + step and writes one `content_deleted` audit row; a student note or module progress below it → `CurriculumNodeHasStudentDataError` (409) and every row stays. |
| `test/integration/notes/notes.integration-spec.ts` | 4 | Notes repository: create/read back for the owner; another user gets `NoteNotFoundError` on read and delete (row stays); owner delete; missing lesson rejected without a row. |
| `test/integration/notifications/notifications.integration-spec.ts` | 3 | One row per recipient, list/count only own rows, owner marks read, another user gets `NotificationNotFoundError` and the row stays unread. |
| `test/integration/progress/progress.integration-spec.ts` | 1 | 10 concurrent first `UpdateStepProgress` calls → all fulfilled, one `user_progress` and one `lesson_completions` row, time accumulated exactly (10 × 7 s): upserts and increments are race-safe. |
| `test/integration/platform-settings/platform-settings.integration-spec.ts` | 2 | 8 concurrent updates from version 0 → exactly 1 applied (version 1, one audit row), 7 `PlatformSettingVersionConflictError` (409); a later update from the current version applies. |
| `src/features/reservations/.../reservations-concurrency.integration-spec.ts` (block B, unchanged) | 1 | 20 concurrent reservations of one slot → 1 created, 19 conflicts. |

Advisory locks found with `pg_advisory_xact_lock`: reservations, groups (membership, leadership, update), evaluation (attempt start/submit/close, assignments, grading/feedback, delete), activities, quizzes, platform settings. Covered under real concurrency: reservations, groups membership and leadership, evaluation attempt start, platform settings. Not covered here (left for C4): activities, quizzes, evaluation submit/grading.

## C3 — authorization

### Matrix (`test/e2e/authorization/authorization-matrix.ts` + `authorization-matrix.e2e-spec.ts`)

- **Registry:** 349 routes registered on the Express 5 router (`app.router.stack`; the walker also accepts Express 4 `app._router`). The matrix has **349 entries**, grouped by feature; the first test fails listing any registered route without an entry and any stale entry. Result: 0 missing, 0 stale.
- **Derivation:** entries were extracted mechanically from the controllers' runtime decorator metadata (`@UseGuards`, `@RequirePermissions`, `@AllowSelfOr`) and `ROLE_PERMISSIONS`, then written as static tiers (`PUBLIC`, `AUTHENTICATED`, `STUDENT_UP`, `TEACHER_UP`, `ADMIN_ONLY`, `BRIDGE_SECRET_ONLY`) with the guard or permission in a comment, so a change of `ROLE_PERMISSIONS` or a decorator shows up as a failure. Five entries were corrected after reading the use cases: `PUT /api/activity-submissions/:id` and `POST .../:id/submit` (non-students get `StudentRoleRequiredError`, 403), `GET /api/analytics/students/:userId/timeline` (teacher outside the group scope, 403), `POST /api/ventilator/control` and `/takeover` (403 without an active reservation held by the caller).
- **Requests:** 349 × 5 actors = **1745 requests asserted** (random UUID path params, `{}` body for POST/PUT/PATCH; the response is aborted after the headers, which covers SSE and CSV streams). Superadmin = ADMIN with the test `SUPERADMIN_EMAIL`. Result: 350/350 tests pass.
- **Limits:** "allow" means "not 401/403"; empty bodies mean validation (400) runs before use-case role checks on most write routes, so those role checks are only covered where noted; auth routes with `@Throttle` may answer 429, which counts as allow.
- **No 5xx:** a 5xx does not fail the route's own test (the guards let the request through), but the last test, `should not answer 5xx to any request outside the known-defect allowlist`, fails listing every `METHOD /path as actor: status` that answered 5xx unless the route is in `KNOWN_SERVER_ERROR_ROUTES` (each entry carries its `// BUG-n` comment). After the BUG-9 fix the allowlist is empty and the run has 0 5xx.

### IDOR (`test/e2e/authorization/idor.e2e-spec.ts`, 37 tests)

Owner controls (8, all 200) prove the ids are valid. Intrusions (25) by a same-role user: notes read/update/delete 404; tutor conversation read/rename/delete 404; evaluation attempt read, answer save, submit, feedback 404; simulation session state/summary/replay/end 403 and history of another user 403; notification mark-read/delete 404 (documented); group read/members by a non-member student 404, read by a non-managing teacher 404, update 403; analytics dashboard/export/timeline/evaluation stats for a non-managing teacher 403. A final test checks every owner resource is unchanged. Since the BUG-9 fix, the "lists do not include the owner's rows" check (`GET /api/notes` and `/api/tutor/conversations` as the intruder, 200 without the owner's ids) and two no-pagination list checks are plain tests.

### Role visibility (`test/e2e/authorization/role-visibility.e2e-spec.ts`, 3 tests)

- Reservations calendar as STUDENT: 3 reservations returned; no other user's name, email or id nor the reservation purpose anywhere in the JSON (deep scan). The holder group's name does appear, by design ("Reserved by a student of group {group}"). TEACHER control sees holder data.
- Evaluation questions as STUDENT (start 201, resume 200, attempt detail 200, `my-evaluations` 200), with an explanation seeded on every question: no `isCorrect`, `explanation` or `rubric` key at any depth and no seeded explanation text.

## Observed results

```text
npx tsc --noEmit -p tsconfig.json          → 0 errors
npx eslint "test/**/*.ts"                  → 0 problems
integration (each file alone, --runInBand) → triggers 11/11, users 5/5, groups 5/5, evaluation-attempts 3/3,
                                             curriculum-delete 3/3, notes 4/4, notifications 3/3, progress 1/1,
                                             platform-settings 2/2
e2e (each file alone, --runInBand)         → authorization-matrix 350/350, idor 37/37 (3 it.failing as expected),
                                             role-visibility 3/3
docker ps -a                               → no testcontainers/ryuk containers left
```

Files booting `AppModule` take about 30–190 s each (first run transpiles the whole app).

## Bugs found

- **BUG-9 — list routes answer 500.** The global `I18nValidationPipe` has no `transform: true`, so query DTOs reach handlers as raw strings: `ListQueryDTO` defaults (`page = 1`, `limit = 10`) are never applied and `@Type(() => Number)` never converts. Without `page`/`limit`, repositories compute `skip = NaN` and Prisma throws `PrismaClientValidationError` (500); with `?page=1&limit=20`, `GET /api/notes` and `GET /api/tutor/conversations` still answer 500 (`take: "20"`, string). The matrix run printed 74 5xx answers over 21 list routes: `/api/admin/students`, `/api/tutor/conversations`, `/api/audit`, `/api/audit/targets/:type/:id`, `/api/changelog`, `/api/changelog/recent`, `/api/cases`, `/api/clinical-cases`, `/api/evaluation-assignments`, `/api/evaluation-grading/queue`, `/api/evaluations`, `/api/levels`, `/api/media`, `/api/modules`, `/api/notes`, `/api/notifications`, `/api/simulation/sessions/history`, `/api/cards`, `/api/steps`, `/api/users`, `/api/users/students`. Repro: `GET /api/notes` with a student token (or the `it.failing` tests in `idor.e2e-spec.ts`). **Fixed in T3b:** `new I18nValidationPipe({ transform: true })` in `main.ts`, mirrored in `test/support/e2e-app.ts` (`test/support/integration-app.ts` registers no global pipes). No `transformOptions` and no implicit conversion: every numeric/date/boolean query field already declares `@Type`/`@Transform`, and validation already ran on the transformed instance, so only the value handed to the handler changes. Handlers that parse query strings by hand (`query.myGroups === "true"`, `query.mine === "true"`, `query.isActive === "true"`) read DTO fields typed `string` with `@IsIn(["true", "false"])`, which stay strings. Two side effects follow the DTO contract: `?includeInactive=false` (levels, lessons) and `?unreadOnly=false` (notifications) now mean `false` (the raw string `"false"` was truthy before). Proof: the matrix run answers 0 5xx and its new no-5xx test passes with an empty allowlist; the three BUG-9 tests in `idor.e2e-spec.ts` are plain `it` and pass.

No other defect was found by C2/C3.
