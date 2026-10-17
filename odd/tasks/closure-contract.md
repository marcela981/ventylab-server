# Closure — backend contract (A1–A4)

Locator: `odd/tasks/closure-contract.md` · Engram mirror: `odd/closure-contract/tasks` (pending: ambiguous engram project)

## Objective
Close the ventylab-server contract so the frontend can drop every workaround: additive DTO fields, filters and endpoints listed in the closure prompt (A2–A4), regenerated `openapi/openapi.json` and `openapi/asyncapi.yaml`, deploy-ready env config.

## Constraints
- Additive contract changes only; existing endpoints keep their shape.
- No migrations applied anywhere; `studentCode` migration is created, not applied.
- Follow the hexagonal feature layout (domain/application/infrastructure/presentation).
- Header block on every new/modified file. Commits: Conventional Commits, no AI attribution, no push, no new branches.

## Phase-1 decisions (confirmed by the author 2026-10-17)
1. No refresh cookie: refresh token stays in the body (cross-origin already works); documented in `.env.example`.
2. Validation errors stay HTTP 400 and gain `errors: [{ field, message }]`; settings keep 422 and gain the same per-field detail.
3. Risk thresholds become platform settings (min progress %, min average grade, inactivity days) with defaults taken from the current frontend values.

## Tasks
- [ ] A1 — Report migration state (done in audit: operation migrations applied; `20261012100000_fix_setnull_required_relations` pending; apply with `npx prisma migrate deploy` in dev only).
- [x] A2 — Tests: preemption does not notify the actor; TEACHER/ADMIN can replay a managed/supervised student's session.
- [ ] A3.1 — Notifications: per-type `data` schemas, discriminated union in OpenAPI and AsyncAPI.
- [ ] A3.2 — Student: grades with attemptId/moduleId/moduleTitle; notes with moduleId/lessonTitle/pageTitle; sections with title; sessions with caseTitle; notes search + section/module filters.
- [ ] A3.3 — Teacher panel: passingGrade + risk thresholds (settings) in rows; stats by group; group module aggregate; reservations groupId; grading queue studentId; student grades endpoint; managed/supervised relation; pending count endpoint.
- [ ] A3.4 — Admin users: `studentCode` (additive migration, optional unique, admin-editable, searchable) and `isSuperadmin`.
- [ ] A3.5 — Settings: type/label/unit/Spanish description metadata, string values, map-key metadata, per-field validation errors.
- [ ] A3.6 — AI providers catalog; audit detail, catalog and export limit; research export data dictionary.
- [ ] A3.7 — Telemetry metrics readable by TEACHER (read-only).
- [ ] A4 — Regenerate openapi/asyncapi; env-driven CORS/Socket.io/SSE verified; `.env.example` updated.

## Route per task
Delegated direct (writer per block): each block touches 2+ non-trivial files across layers.

## Checks
`npx tsc --noEmit` · `npx madge --circular --extensions ts src` · `npx prisma validate` · unit tests `--maxWorkers=1` · `openapi:check`.

## Progress / evidence
(updated per task with commit hashes)

- A2 (delegated writer): regression specs only, code already correct. `notifications-events.handlers.spec.ts` (preempting actor excluded from group holders; sole holder = actor notifies nobody) and new `simulation-session-access.service.spec.ts` (owner, admin, managing teacher, supervising teacher allowed; unrelated teacher and other student denied; owner without student group denied) over the real GroupsFacade + GroupAccessService. Checks: focused jest 19/19 pass, eslint clean, `tsc --noEmit` 0 errors. Commit: see `git log --grep "A2"` (test(simulation,notifications)).
