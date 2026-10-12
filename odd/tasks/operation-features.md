# Feature: operation-features (platform-settings, audit-log, notifications, system-status, analytics)

## Objective
Last backend refactor block: typed domain event bus with isolated subscribers, DB-backed
platform settings (hot reload, hard limits), append-only audit log with redaction and admin
queries, persisted notifications fed by the bus, system readiness/status, and analytics composed
from feature facades (batch functions, no N+1). No port may stay bound to a provisional adapter
inside these features' scope.

## Baseline
- Branch `main`, baseline commit `439d429`, working tree clean.
- `npx tsc --noEmit` green at baseline (0 errors).
- Migrations `20261009120000_simulation_features` and `20261010120000_ventilator_features` are NOT applied.

## Authorization (author, 2026-10-11)
- Phase-1 audit report and plan confirmed ("Sí, hazlo, lo confirmo").
- Execute everything without asking; review each block, commit and push (to `main`, as previous
  feature work). No AI attribution / Co-Authored-By in commits.
- Migrations are created as SQL files only and NOT applied (applying to Supabase is left to the author).

## Conventions (continuity rule overrides the prompt's Express layout)
NestJS 11 hexagonal: `src/features/<f>/{application,domain,infrastructure,presentation}` + `<f>.module.ts`,
facades as public API, `unique symbol` tokens, Nest DI (`app.module.ts` + module providers) is the
composition root. Rules from `ventylab-server/CLAUDE.md` + `.claude/skills/*` apply.

Decisions from the audit:
- `AuditLog` is extended additively (actorRole, before, after, reason, requestId, ip + indexes);
  prompt `targetType/targetId/actorId` map to `entityType/entityId/performedByUserId`.
- `PlatformSetting` is a new model; `AppSetting` is untouched (superadmin trigger depends on it).
- Socket rooms keep the real names (`role:ADMIN`, `role:TEACHER`).
- Legacy notice socket events keep being emitted (frontend does not consume them today; cost ~0),
  now from bus subscribers. `user:role-changed` is always kept.
- `NoopFileStorageAdapter` (legit fallback) and `EmptyKnowledgeSource` (ai-tutor RAG) are out of
  scope; documented, not replaced. `AI_PRICE_TABLE_TOKEN` gets the real table from settings.
- `SIMULATION_SESSION_OWNERSHIP_TOKEN` is a dead port (no binding, no consumer).

## Tasks
- [x] T1 Event bus: typed event map + catalog, isolated subscriber dispatch, publish after commit.
- [x] T2 platform-settings: registry, model, cache + subscribe, admin endpoints, settings ports wired.
- [x] T3 audit-log: schema extension, redaction/hash, append-only trigger, admin queries + CSV, missing audit points.
- [ ] T4 notifications: model, bus subscribers, templates, owner endpoints, `notification:new`, ReservationNotifier removed.
- [ ] T5 system-status: `/health/ready`, `/system/status`, change event, AI probe.
- [ ] T6 analytics: batch facade functions, group/student/evaluation panels, `/me/summary`, CSV + anonymized export.
- [ ] T7 Verification evidence (`docs/operation/VERIFICATION.md`) + dependency graph.

## Progress / evidence
(updated per task: route, checks, review, commit)

### T1 — done
- Route: delegated writer (≥2 non-trivial files) + independent reviewer.
- Bus dispatches by class name (legacy handlers unchanged) and, for `CatalogDomainEvent`, also by
  catalog name with a plain-data payload (`src/common/domain/events/domain-event-catalog.ts`).
  New events: `GradeFeedbackReadyEvent`, `VentilatorDeviceOfflineEvent` / `VentilatorDeviceOnlineEvent`.
- All catalog publishers already publish after `transactionManager.run` resolves.
- Checks: `npx tsc --noEmit` 0 errors; jest events + evaluation + ventilator-telemetry 49 suites / 381 tests pass; eslint clean.
- Review: no blockers. Minor notes: `onAny`/wildcard listeners are bypassed (documented in the
  event-driven skill); `evaluation.activated` fires on assignment creation even with a future `startsAt`.
- Note: `prisma/migrations/20261006120000_identity_features/migration.sql` shows an uncommitted
  change not made by this task (superadmin email placeholder replaced); it is left out of every commit.

### T2 — done
- Route: delegated writer; native review on the work-unit commit.
- `src/features/platform-settings/` (registry with hard limits, `platform_settings` overrides with
  optimistic `version`, cache + `subscribe`, ADMIN routes `/api/platform-settings` with `settings:manage`,
  `SETTINGS_CHANGED` audited in the transaction) and `src/composition/` (global `CompositionModule`
  binding consumer settings ports to facade-backed adapters). TOPIC_CHECK toggle added; AI price table
  fed from `ai.prices`; telemetry flush interval and command rate apply without restart.
- Boots with defaults when `platform_settings` does not exist yet (migration not applied).
- Migration `20261011120000_platform_settings` (CREATE TABLE only), not applied.
- Checks: prisma validate OK; tsc 0 errors; jest 119 suites / 1014 tests pass; eslint clean; coupling grep empty.
- Out-of-surface edits accepted: `src/common/presentation/errors-map.ts`, `src/common/infrastructure/docs/setup-docs.ts`.

### T2 — review (independent, native review refused: lens_context_budget_exceeded on 3.4k lines)
- No blockers. Major: reset deletes the row so `version` restarts at 0 (ABA, stale PATCH accepted).
  Minor: invalid stored override hides its DB version; config defaults not validated against the
  registry; cache applies out-of-order versions; rate limiter refills the bucket on rate change;
  recording Hz read live mixes rates in a chunk; simulation scoring may use current rubric thresholds
  for past sessions. -> fixed in T2-fix.

### T3 — done
- Route: delegated writer. AuditLog extended (actor_role, before, after, reason, request_id, ip + 3 indexes),
  append-only triggers (row UPDATE/DELETE + TRUNCATE) in migration `20261011130000_audit_log_extension` (not applied).
- `AUDIT_ACTIONS` catalog (existing persisted strings kept stable), shared `redactSecrets`, diff-only
  before/after, rich/long text stored as `{sha256,length}`, actorRole/requestId/ip from request context.
- Most mutations were already audited through aggregate `auditLogs`; real gaps closed: grade publishing,
  curriculum subtree delete, page-block CRUD.
- `src/features/audit-log/` ADMIN (`audit:read`): `GET /api/audit`, `/api/audit/targets/:type/:id`, `/api/audit/export` (CSV, injection-safe, 50k cap).
- Checks: prisma validate OK; tsc 0; jest 77 suites / 528 tests + 280 extra pass; eslint clean; coupling grep empty.
- Manual DB checks in `docs/operation/VERIFICATION.md` (no DB integration-test setup applies migrations).

### T2-fix — done
- Reset keeps a JSON-null tombstone with version+1 (monotonic versions, no ABA); invalid stored override
  keeps its real version; config defaults validated/clamped at boot; cache ignores versions <= cached;
  rate change keeps bucket tokens capped; recorder snapshots Hz/interval at start; simulation START event
  carries the rubric thresholds so re-scoring is stable (sessions started before this change still read
  the current setting).
- Checks: tsc 0; jest 45 suites / 465 tests pass; eslint clean. No schema change.

### T3 — review (independent)
- No blockers/majors. Minor fixes queued (T3-fix): broader redaction keys, validate client request id,
  strip referer query string, free-text action filter, skip empty-diff rows. Documented only: audit IP
  depends on `trust proxy 1`; actorRole is the JWT role at token issue time.

### T2-fix — native review: approved (4 lenses), acknowledged; advisory only.

### T3-fix — done
- Broader key + value redaction (JWT/Bearer values, credential keys, explicit token plurals; usage
  counters stay visible), client request id validated, referer query stripped, free-text action filter,
  empty-diff audit rows skipped, known limitations documented.
- Checks: tsc 0; jest 17 suites / 188 tests pass; eslint clean.
