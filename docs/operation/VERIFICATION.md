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
