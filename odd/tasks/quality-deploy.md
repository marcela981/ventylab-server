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
- [ ] BUG-6 `contracts/websocket-events.contracts.ts` drifts from emitted events (handled in block D).
- [ ] BUG-7 `prisma/seed.ts` runs `TRUNCATE ... CASCADE` on progress tables (handled in block G).
- [x] BUG-8 `engine-determinism.spec.ts` timing assertion flakes under coverage (fixed early in block A: skipped only under coverage instrumentation).

## Tasks

- [x] T1 Block A — `verify` script, drift check vs empty DB, triggers check, composition-root stub check, boot from scratch (+ BUG-1..BUG-5)
- [ ] T2 Block B — test infrastructure (testcontainers Postgres/Mosquitto, fake LLM scenarios, factories, truncate, suite split)
- [ ] T3 Block C1/C2/C3 — unit coverage, DB integration, authorization matrix + IDOR + visibility
- [ ] T4 Block D — OpenAPI 3.1 contract, AsyncAPI, CI drift check, response validation, TS client, legacy deprecation
- [ ] T5 Block C4/C5/C6 — concurrency, E2E flows, resilience
- [ ] T6 Block E — security
- [ ] T7 Block F — deploy and operations files
- [ ] T8 Block G — demo seed, demo:reset, ADRs, ERD, README, runbook, hardware protocol, knip report
- [ ] T9 Block C7/C8 — load scripts and Uppaal traceability

## Route log

| Task | Route | Trigger evidence | Result |
|---|---|---|---|
| T1 | delegated (one writer) | writer trigger: 2+ non-trivial files (scripts/verify, groups handler, storage adapter, CORS, schema + migration) | done; verify OK, verify:boot OK, see docs/verification/BLOCK-A.md |

## Progress / evidence

- 2026-10-12: feature document created. Engram mirror PENDING (ambiguous_project error; author must pick the project).
- 2026-10-12 T1: `npm run verify` OK (tsc 0, eslint src 0, madge 0 cycles with skipTypeImports, prisma validate 0 warnings, drift clean + 4 triggers, jest 229 suites / 1710 tests). `npm run verify:boot` OK (/health/ready 200). No leftover `ventylab-verify-*` containers.
- BUG-1 RED→GREEN `group-rooms-events.handlers.spec.ts`; BUG-2 RED→GREEN `noop-file-storage.adapter.spec.ts`; BUG-3 migration `20261012100000_fix_setnull_required_relations` + `changelog.mapper.spec.ts`; BUG-4 RED→GREEN `steps.controller.spec.ts`; BUG-5 RED→GREEN `cors-origins.spec.ts`; BUG-8 skip under coverage. Composition guard: `src/composition/production-bindings.spec.ts`.
- Correction: BUG-3 had 4 relations, not 3 (`change_logs.changedBy`, `content_overrides.createdBy`, `activities.createdBy`, `activity_assignments.assignedBy`).
- Known limitation BUG-1: memberships removed by a user role change (users feature, no groups event) leave sockets in the old group room until reconnection.

## Next step

Author reviews and commits block A (`git add -f prisma/migrations/20261012100000_fix_setnull_required_relations/migration.sql`, `.sql` is gitignored); add `CORS_ALLOW_VERCEL_PREVIEWS=false` to `.env.example`. Then T2 Block B.
