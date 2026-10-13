# Feature: quality-deploy

Make the backend verifiable, deployable and documented without adding business functionality.

## Context

- Phase 1 audit (read-only, 2026-10-12) found: NestJS 11 (not Express), 37 features, class-validator + @nestjs/swagger (not zod), business rules in use cases/domain services (not `*.service.ts`), superadmin = ADMIN identified by `SUPERADMIN_EMAIL`.
- Baseline: tsc 0 errors, eslint 0, prisma validate OK (3 SetNull warnings), jest 1684/1685 (engine-determinism timing flake under coverage), 47.9 % line coverage, madge 19 entity<->events cycles.
- Author confirmed the plan on 2026-10-12 and authorized fixing the real bugs found.

## Constraints

- No commits, branches or pushes: the author commits each block manually.
- `main` only; no other branches are inspected.
- Never use Supabase/production DB, real AI APIs, real MQTT topics or the physical ventilator from tests.
- Do not delete legacy endpoints or touch the frontend.
- Every new or modified file carries the authorship header.
- Prefer existing conventions (Jest, class-validator, @nestjs/swagger, Nest feature skeleton).

## Real bugs (authorized fixes)

- [x] BUG-1 `group:{id}` socket rooms are never joined: `evaluation:activated` and the group branch of `reservation:preempted` reach nobody.
- [x] BUG-2 `NoopFileStorageAdapter` silently drops uploads when `SUPABASE_*` is missing (also in production).
- [x] BUG-3 `prisma validate`: 3 `onDelete: SetNull` on required relations (NOT NULL violation on user delete).
- [x] BUG-4 4 GET routes in `steps` (`/api/steps`, `/api/cards`) have no guard, unlike every other content read (OptionalJwtAuthGuard).
- [x] BUG-5 CORS accepts any `*.vercel.app` origin unconditionally.
- [x] BUG-6 `contracts/websocket-events.contracts.ts` drifts from emitted events (handled in block D). Fixed in T4: rewritten to the 20 emitted events, 3 client messages and their payloads; `test/openapi/asyncapi-events.spec.ts` fails when an event emitted in `src/` is missing from it or from `openapi/asyncapi.yaml`.
- [ ] BUG-7 `prisma/seed.ts` runs `TRUNCATE ... CASCADE` on progress tables (handled in block G).
- [x] BUG-8 `engine-determinism.spec.ts` timing assertion flakes under coverage (fixed early in block A: skipped only under coverage instrumentation).
- [x] BUG-9 21 list routes answer 500: the global `I18nValidationPipe` does not transform, so `ListQueryDTO` defaults never apply (`skip = NaN`) and `?page=&limit=` arrive as strings (`take: "20"`). Repro: `GET /api/notes` as a student. Proposed fix: `new I18nValidationPipe({ transform: true })` in `main.ts` (+ `test/support/e2e-app.ts`) and full suite run. Found in T3a; fixed in T3b (`transform: true` in `main.ts` + `test/support/e2e-app.ts`): authorization e2e 391/391 with 0 5xx (matrix now fails on any 5xx outside an empty allowlist), the 3 former `it.failing` IDOR list tests pass; see docs/verification/BLOCK-C.md.

## Tasks

- [x] T1 Block A — `verify` script, drift check vs empty DB, triggers check, composition-root stub check, boot from scratch (+ BUG-1..BUG-5)
- [ ] T2 Block B — test infrastructure (testcontainers Postgres/Mosquitto, fake LLM scenarios, factories, truncate, suite split)
- [ ] T3 Block C1/C2/C3 — unit coverage, DB integration, authorization matrix + IDOR + visibility
- [x] T4 Block D — OpenAPI 3.1 contract, AsyncAPI, CI drift check, response validation, TS client, legacy deprecation (targeted checks observed; full `npm run verify` left to the author)
- [ ] T5 Block C4/C5/C6 — concurrency, E2E flows, resilience
- [ ] T6 Block E — security
- [ ] T7 Block F — deploy and operations files
- [ ] T8 Block G — demo seed, demo:reset, ADRs, ERD, README, runbook, hardware protocol, knip report
- [ ] T9 Block C7/C8 — load scripts and Uppaal traceability

## Route log

| Task | Route | Trigger evidence | Result |
|---|---|---|---|
| T4 | delegated (one writer) | writer trigger: 2+ non-trivial files (OpenAPI generator + post-processor, docs access rule, deprecation decorator/interceptor, AsyncAPI + contracts, e2e validator, 14 presentation files, tests, docs) | done; contract generated and checked, 405/405 e2e with response validation, BUG-6 fixed (see docs/verification/BLOCK-D.md) |
| T3b | delegated (one writer) | writer trigger: 2+ non-trivial files (main.ts pipe, e2e-app, matrix + idor specs, unit jest config + C1 scope + coverage printer, 11 new unit specs, progress test doubles, docs) | BUG-9 fixed; C1 thresholds met per folder (see Progress / evidence) |
| T3a | delegated (one writer) | writer trigger: 2+ non-trivial files (test/support integration-app/actors/http, 9 integration specs, matrix + 3 e2e specs, docs) | C2 + C3 done; T3 stays open for C1; BUG-9 found (see docs/verification/BLOCK-C.md) |
| T2 | delegated (one writer) | writer trigger: 2+ non-trivial files (test/support, test/factories, jest configs, AI scenario doubles, gateway spec, package.json) | partial; suites green standalone, `npm run verify` stops at the engine-determinism timing flake in test:unit (see docs/verification/BLOCK-B.md) |
| T1 | delegated (one writer) | writer trigger: 2+ non-trivial files (scripts/verify, groups handler, storage adapter, CORS, schema + migration) | done; verify OK, verify:boot OK, see docs/verification/BLOCK-A.md |

## Progress / evidence

- 2026-10-12: feature document created. Engram mirror PENDING (ambiguous_project error; author must pick the project).
- 2026-10-12 T1: `npm run verify` OK (tsc 0, eslint src 0, madge 0 cycles with skipTypeImports, prisma validate 0 warnings, drift clean + 4 triggers, jest 229 suites / 1710 tests). `npm run verify:boot` OK (/health/ready 200). No leftover `ventylab-verify-*` containers.
- BUG-1 RED→GREEN `group-rooms-events.handlers.spec.ts`; BUG-2 RED→GREEN `noop-file-storage.adapter.spec.ts`; BUG-3 migration `20261012100000_fix_setnull_required_relations` + `changelog.mapper.spec.ts`; BUG-4 RED→GREEN `steps.controller.spec.ts`; BUG-5 RED→GREEN `cors-origins.spec.ts`; BUG-8 skip under coverage. Composition guard: `src/composition/production-bindings.spec.ts`.
- Correction: BUG-3 had 4 relations, not 3 (`change_logs.changedBy`, `content_overrides.createdBy`, `activities.createdBy`, `activity_assignments.assignedBy`).
- Known limitation BUG-1: memberships removed by a user role change (users feature, no groups event) leave sockets in the old group room until reconnection.

- 2026-10-12 T2 (partial, not checked): `tsc` 0 errors (tsconfig include adds `test/**/*`); ESLint `src` + `test` 0; `npm run test:unit` 230 suites / 1718 tests passed; `npm run test:integration` 2 suites / 9 tests passed (infra smoke + ungated reservations concurrency); `npm run test:e2e` 1 suite / 4 tests passed (health/ready 200, fake AI only, socket authenticate); no leftover containers. `npm run verify` failed 3/3 at test:unit: `engine-determinism.spec.ts` 500 ms budget measured 514-662 ms under the full parallel run (109 ms alone) — BUG-8 flake also outside coverage; outside T2 edit surface. Devdeps: testcontainers, @testcontainers/postgresql 12.2.0.
- T2 findings: MQTT_TEST_TOPIC_PREFIX only prefixes command/ack topics (telemetry/alarm isolated by explicit test topics); `readDbIntegrationSettings` now unused; migration seeds author's email as superadmin (tests override in container baseline); partial stream after delivered content ends in AiStreamInterruptedError without fallback (existing contract).

- 2026-10-12 T3a (C2 + C3, T3 not checked: C1 pending): `tsc` 0; ESLint `test/**/*.ts` 0. Integration, each file alone: protection-triggers 11/11, users 5/5, groups 5/5, evaluation-attempts 3/3, curriculum-delete 3/3, notes 4/4, notifications 3/3, progress 1/1, platform-settings 2/2. E2E, each file alone: authorization-matrix 350/350 (349 registered routes = 349 matrix entries, 0 missing, 0 stale, 1745 requests asserted), idor 37/37 (3 `it.failing` blocked by BUG-9), role-visibility 3/3. No leftover containers. Concurrency proven exactly-one for student group membership, group leader, evaluation attempt start, platform-setting version; progress upserts race-safe. Advisory-lock paths not yet raced: activities, quizzes, evaluation submit/grading (C4).

- 2026-10-12 T3b (BUG-9 + C1; T3 NOT checked: full `npm run verify` not completed): BUG-9 fixed (`I18nValidationPipe({ transform: true })` in `main.ts` + `test/support/e2e-app.ts`). `npx jest --config test/jest/jest.e2e.config.js --runInBand test/e2e/authorization` → 3 suites, 391/391, 0 5xx logged; matrix fails on any 5xx outside `KNOWN_SERVER_ERROR_ROUTES` (empty). C1: `npm run test:unit` → 240 suites, 1808 passed, 1 skipped, per-folder line thresholds of 80 % all met (progress 21.5→98.3 %, reservations 81.5→93.2 % [application 78.8→92.3 %], the others were already 87.5–100 %); whole scope 80.4→93.2 %. `tsc` 0; ESLint (`src/**/*.spec.ts`, `src/**/*-spec.ts`, `test/**/*.ts`, `src/main.ts`) 0. First `npm run verify`: tsc, lint, madge, prisma validate and drift PASS; test:unit FAIL only because the relative threshold keys matched nothing (fixed: absolute keys); the rerun was killed by the OS for low memory during lint. Pending: test:perf, test:integration and the full test:e2e under the BUG-9 fix.
- 2026-10-12 T4 (Block D): `tsc` 0; ESLint on the 39 changed/new `.ts` files 0; madge 0 cycles; `npm run openapi:generate` twice → identical bytes (sha256 5a43766b…a54ecd9); `npm run openapi:check` exit 0, and exit 1 with the regenerate hint on a modified file; `npm run openapi:client` OK (types pass `tsc --strict`); `test:contract` 2 suites 11/11; whole unit suite (no coverage) 243 suites, 1835 passed, 1 skipped; e2e `test/e2e` 5 suites 405/405 (authorization matrix validates every 2xx JSON response against openapi.json; IDOR and role-visibility owner reads validated; runtime `/api/docs-json` document byte-identical to the committed file; Deprecation/Link headers on 7 legacy samples). OpenAPI 3.1 by post-processing (`setOpenAPIVersion` only changes the string): 349 operations, 28 deprecated; AsyncAPI 3.0: 10 channels, 27 messages. `/api/docs`: open outside production, ADMIN token only in production, `SWAGGER_ALLOWED_IPS` as extra IP restriction. Devdeps: openapi-typescript 7.13.0, ajv 8.20.0, ajv-formats 3.0.1.
- T4 contract defects (documentation only, fixed in presentation decorators): 5 DTO schema name collisions (`@ApiSchema`), 7 nullable-data routes (`@ApiNullableResponse`), mixed reservation calendar items (`anyOf`), `unknown` platform setting values, duplicate operationIds. Frontend calls to unregistered routes (`PUT /api/admin/users/:id/role`, `PATCH /api/admin/users/:id`, `PATCH /api/cards/:id`, `POST /api/progress/lesson/:id/complete-unified`) and the filter mapping throttler 429 to `unknown_error` reported, not changed.
- Follow-up outside T3b's edit surface: `.claude/skills/error-handling/SKILL.md` still says the global pipe runs with no options, so it should say `transform: true` (CLAUDE.md requires skills to match the code).

## Next step

Author reviews and commits block A (`git add -f prisma/migrations/20261012100000_fix_setnull_required_relations/migration.sql`, `.sql` is gitignored); add `CORS_ALLOW_VERCEL_PREVIEWS=false` to `.env.example`. Then decide the BUG-8 follow-up (engine-determinism budget flakes under the full parallel unit run, blocking verify before test:integration/test:e2e), close T2 with a green `npm run verify`, and commit block B (incl. package-lock.json). For block D: run `npm run verify` (now with `openapi:check` and `test:contract`), describe the new `SWAGGER_ALLOWED_IPS` meaning in `.env.example`, `git add -f .claude/skills/swagger/SKILL.md .claude/skills/configuration/SKILL.md` (`.claude/` is gitignored), and commit `openapi/`, `packages/api-client/`, `docs/api/` and the lockfile with the code.
