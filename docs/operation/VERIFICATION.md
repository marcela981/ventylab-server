# Operation features — verification

Manual checks to run against a database where the pending migrations were applied. None of them is run by the test suite: the repository has no integration setup that applies migrations.

## Audit log (`20261011130000_audit_log_extension`)

Run each block in a SQL console connected to the target database. Every block ends with `ROLLBACK`, so nothing persists even when a check unexpectedly succeeds.

### 1. Columns and indexes exist

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
  AND column_name IN ('actor_role', 'before', 'after', 'reason', 'request_id', 'ip');
-- expected: 6 rows

SELECT indexname
FROM pg_indexes
WHERE tablename = 'audit_logs'
  AND indexname IN (
    'audit_logs_entity_type_entity_id_idx',
    'audit_logs_performed_by_user_id_performed_at_idx',
    'audit_logs_action_performed_at_idx'
  );
-- expected: 3 rows
```

### 2. UPDATE, DELETE and TRUNCATE are rejected

```sql
BEGIN;
INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "performed_at")
VALUES ('verification-audit-row', 'verification', 'verification', 'v-1', 'content_created', now());

UPDATE "audit_logs" SET "action" = 'tampered' WHERE "id" = 'verification-audit-row';
-- expected: ERROR  audit_logs is append-only: UPDATE is not allowed
ROLLBACK;

BEGIN;
INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "performed_at")
VALUES ('verification-audit-row', 'verification', 'verification', 'v-1', 'content_created', now());

DELETE FROM "audit_logs" WHERE "id" = 'verification-audit-row';
-- expected: ERROR  audit_logs is append-only: DELETE is not allowed
ROLLBACK;

BEGIN;
TRUNCATE "audit_logs";
-- expected: ERROR  audit_logs is append-only: TRUNCATE is not allowed
ROLLBACK;
```

### 3. A change forced to fail after its audit row persists neither

Pick any non-superadmin user id for `:user_id`. The role update and its audit row share one transaction, the same way `ChangeUserRoleUseCase` writes them through `transactionManager.run`.

```sql
BEGIN;
UPDATE "users" SET "role" = 'TEACHER' WHERE "id" = :user_id;

INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "performed_at", "before", "after")
VALUES ('verification-role-change', 'users', 'users', :user_id, 'user_role_changed', now(), '{"role":"STUDENT"}', '{"role":"TEACHER"}');

SELECT 1 / 0;
-- forced failure after the audit row: the transaction is aborted
ROLLBACK;

SELECT count(*) FROM "audit_logs" WHERE "id" = 'verification-role-change';
-- expected: 0
SELECT "role" FROM "users" WHERE "id" = :user_id;
-- expected: the original role
```

The application-level equivalent is covered by `src/common/infrastructure/persistence/audit-log/audit-log-recorder.spec.ts` ("discards the change and its audit row when the transaction rolls back after recording").

### 4. No secrets in audit payloads

```sql
SELECT count(*)
FROM "audit_logs"
WHERE (coalesce("before"::text, '') || coalesce("after"::text, '') || coalesce("metadata"::text, ''))
      ~* '"(password|passwordhash|password_hash|accesstoken|refreshtoken|resettoken|secret|apikey)"\s*:\s*"(?!\[REDACTED\])';
-- expected: 0 for rows written after the migration
```

## Known limitations

- **Audit IP and proxies**: the `ip` column comes from Express `req.ip`, which relies on `trust proxy 1` (exactly one reverse-proxy hop). Behind a different number of proxies the stored IP is either the proxy address or a client-supplied `X-Forwarded-For` value; adjust `trust proxy` to the real deployment topology before treating the IP as evidence.
- **Audit actor role**: `actor_role` is the role carried in the access token (JWT) at issue time, not a fresh database read. A role change takes effect in audit rows only after the actor's token is refreshed, so an entry recorded in that window shows the previous role.

## Final verification (2026-10-11)

Run from the repository root on branch `main` (HEAD `9418d23`). No command connected to a database. `PENDING-DB` means the check needs the pending migrations applied to a real database.

### Static checks

| # | Command | Result |
| --- | --- | --- |
| 1 | `npx tsc --noEmit` | PASS: exit 0, no output |
| 2 | `npx madge --circular --extensions ts --ts-config tsconfig.json src` | PASS: `Processed 1762 files (28.2s)` / `✔ No circular dependency found!` |
| 3 | `npx prisma validate` | PASS: `The schema at prisma\schema.prisma is valid 🚀`, plus 4 warnings "The `onDelete` referential action of a relation should not be set to `SetNull` when a referenced field is required"; the schema at `439d429` produces the same 4 warnings, so they predate this work |
| 4 | `grep -rn "prisma\." src/features/{platform-settings,audit-log,notifications,system-status,analytics} --include=*.ts \| grep -v repository` | PASS: no output (0 matches) |
| 5 | `grep -rL "Autor: Marcela Mazo Castro" src --include=*.ts` | PASS: no output, every `.ts` file under `src` has the header |
| 6 | `grep -rniE "noop\|logger.*adapter\|provisional\|TODO.*port" src --include=*.ts` | PASS: 9 hits, all classified below |
| 7 | `grep -rnE "from ['\"].*features/(audit-log\|notifications\|platform-settings)" src/features --include=*.ts \| grep -vE "src/features/(audit-log\|notifications\|platform-settings)/"` | PASS: no output. A single-quote-only pattern matches nothing by construction because the repository uses double-quoted imports; the both-quotes form above is the meaningful one |
| 8 | `npx madge --extensions ts --image docs/backend-dependencies.svg src/features` | PARTIAL: Graphviz is not installed (`Error: Graphviz could not be found. Ensure that "gvpr" is in your $PATH`) and `madge --dot` needs it too. Fallback: `npx madge --extensions ts --ts-config tsconfig.json --json src/features`, aggregated to feature level into `docs/backend-dependencies.dot` (37 features, 139 feature edges, edge label = number of file-level imports) and `docs/backend-dependencies.json`. The SVG must be rendered with Graphviz |

Check 6 classification:

- `src/common/infrastructure/storage/noop-file-storage.adapter.ts` (5 hits) and `src/common/infrastructure/storage/storage.module.ts` (3 hits): `NoopFileStorageAdapter`, the fallback used when Supabase Storage is not configured. Out of scope by decision.
- `src/features/analytics/application/use-cases/export-research-dataset.usecase.ts:3`: false positive. The header text "(todos o uno) … exporta" matches `TODO.*port` case-insensitively. It is not a TODO.
- `EmptyKnowledgeSource` (ai-tutor) does not match the pattern; it remains the other out-of-scope item by decision.

Feature-level bidirectional dependencies in the graph (file-level cycles: none, see check 2): `auth <-> authorization`, `auth <-> users`, `curriculum <-> levels`, `lessons <-> modules`, `progress <-> quizzes`, `progress <-> users`. None involves the operation features. No feature imports `audit-log`, `notifications` or `platform-settings`; only modules outside `src/features` do, consistent with check 7.

### Behavioural checks

Every spec below was run once with `npx jest <paths>`: 27 suites and 243 tests, all passed (26 suites with 235 tests for the operation features, plus `change-user-role.usecase.spec.ts` with 8 tests).

| # | Check | Evidence (spec › test) | Result |
| --- | --- | --- | --- |
| 9 | Role change forced to fail after its audit row: neither persists | `common/infrastructure/persistence/audit-log/audit-log-recorder.spec.ts` › "discards the change and its audit row when the transaction rolls back after recording"; `features/users/application/use-cases/change-user-role.usecase.spec.ts` › "promotes a student, leaves student groups, revokes refresh tokens and audits in one transaction"; real database: manual check 3 above | PASS (unit), PENDING-DB |
| 10 | Trigger blocks UPDATE/DELETE on `audit_logs` | Database only: manual check 2 above | PENDING-DB |
| 11 | Password and token values never in audit rows | `audit-log-recorder.spec.ts` › "never persists password, hash or token values"; `common/domain/audit/audit-payload.spec.ts` › "redacts passwords, hashes, tokens, secrets and API keys at any depth"; `common/domain/utils/redact-secrets.spec.ts` › "redacts JWT-shaped values regardless of key, including inside text and arrays", "redacts bearer token values regardless of key"; real database: manual check 4 above | PASS (unit), PENDING-DB |
| 12 | Preemption: notification persisted, `notification:new` and legacy `reservation:preempted` | `features/notifications/infrastructure/events/notifications-bus.spec.ts` › "persists the preemption notification, then emits notification:new and keeps the legacy reservation:preempted emit"; `notifications-events.handlers.spec.ts` › "notifies a preempted user holder, persisting before emitting notification:new" | PASS |
| 13 | Throwing notification subscriber: original operation OK and error logged | `notifications-bus.spec.ts` › "isolates a throwing notifications subscriber: publish does not throw, the legacy emit still happens and the error is logged"; `common/infrastructure/events/nest-event-bus.spec.ts` › "keeps running the other subscribers and does not throw when a subscriber throws synchronously", "logs a rejected async subscriber without an unhandled rejection or affecting the others" | PASS |
| 14 | Setting beyond hard limit: 422; same version twice: 409; telemetry flush interval applied without restart | `features/platform-settings/application/use-cases/platform-settings.usecases.spec.ts` › "rejects a value outside the hard limits (422) before touching the database", "rejects a stale version with PlatformSettingVersionConflictError (409) and changes nothing"; `platform-settings.store.spec.ts` › "invalidates the cached value and notifies the key subscribers on apply and reset"; `features/ventilator-telemetry/application/services/telemetry-pipeline.service.spec.ts` › "reschedules the flush timer when the live flush interval setting changes, without a restart" | PASS (unit), PENDING-DB for the real `version` column |
| 15 | AI chain with a provider without credentials: 422 | `platform-settings.usecases.spec.ts` › "rejects an AI provider without credentials entering a chain and rolls back" | PASS |
| 16 | MQTT down: DEGRADED and `system:status-changed`; DB down: `/health/ready` 503 | `features/system-status/application/services/system-status.service.spec.ts` › "is DEGRADED when the ventilator goes offline during an active reservation", "emits system:status-changed once per transition to admins and teachers, and again on recovery"; `system-status-monitor.service.spec.ts` › "re-evaluates when the MQTT connection changes and pushes the transition"; `common/presentation/controllers/health.controller.spec.ts` › "reports not ready with 503 when the ping fails", "reports not ready with 503 when the ping exceeds the timeout" | PASS |
| 17 | Teacher on a group they do not manage: 403 | `features/analytics/application/use-cases/get-group-dashboard.usecase.spec.ts` › "rejects a teacher outside the group scope without loading any data" (`AnalyticsScopeForbiddenError`); `analytics.controller.spec.ts` asserts that error maps to `HttpStatus.FORBIDDEN`; also `get-student-timeline.usecase.spec.ts` › "rejects a teacher who manages no group of the student" and `get-evaluation-analytics.usecase.spec.ts` › "lets the creator of an evaluation without assignments read it and rejects other teachers" | PASS |
| 18 | 30-student dashboard query bound | `get-group-dashboard.usecase.spec.ts` › "calls each facade batch method exactly once for a 30-student group"; `export-research-dataset.usecase.spec.ts` › "reads the data with one batch call per facade"; documented count in `docs/operation/ANALYTICS.md`: 14 Prisma operations for a teacher, 13 for an admin, independent of group size. Real SQL statements (≤ 15) and latency (< 1 s) need a populated database | PASS (unit), PENDING-DB |
| 19 | Anonymized export contains no names, emails, codes or raw ids | `export-research-dataset.usecase.spec.ts` › "allows only pseudonyms and content identifiers in every column, whatever identifiers the sources carry", "refuses to export without a configured salt and reads nothing"; `features/analytics/infrastructure/security/hmac-pseudonymizer.spec.ts` › "is stable per salt and never returns the original value" | PASS |

### Pending author actions

1. Apply the pending migrations with `DIRECT_URL`, in order: `20261009120000_simulation_features`, `20261010120000_ventilator_features`, `20261011120000_platform_settings`, `20261011130000_audit_log_extension`, `20261011140000_notifications`.
2. Run manual checks 1 to 4 of this document against that database (real-data evidence for checks 9, 10 and 11).
3. Set `ANALYTICS_EXPORT_SALT` (at least 16 characters); without it the research export answers 503.
4. Optional: set `APP_COMMIT_SHA`, `SYSTEM_STATUS_CACHE_SECONDS` and `HEALTH_CHECK_TIMEOUT_MS`.
5. Install Graphviz and render the dependency graph: `dot -Tsvg docs/backend-dependencies.dot -o docs/backend-dependencies.svg`.
6. With a populated database, measure the 30-student dashboard (check 18): SQL statements (≤ 15) and latency (< 1 s).
