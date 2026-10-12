-- ============================================================
-- Audit log extension
--   1. Additive columns: actor_role, before, after, reason, request_id, ip.
--   2. Indexes for target history, actor timeline and action timeline.
--   3. Append-only guard: audit_logs rejects UPDATE, DELETE and TRUNCATE.
--
-- Wrapped in BEGIN/COMMIT so structure and triggers apply together.
-- ============================================================

BEGIN;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_role" TEXT,
ADD COLUMN     "after" JSONB,
ADD COLUMN     "before" JSONB,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "request_id" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_user_id_performed_at_idx" ON "audit_logs"("performed_by_user_id", "performed_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_performed_at_idx" ON "audit_logs"("action", "performed_at");

-- ============================================================
-- Append-only guard
-- ============================================================
-- A maintenance correction must be an explicit, reviewed operation:
--   ALTER TABLE "audit_logs" DISABLE TRIGGER "audit_logs_append_only";
--   ... ;
--   ALTER TABLE "audit_logs" ENABLE TRIGGER "audit_logs_append_only";
CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "audit_logs_append_only"
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION audit_logs_block_mutation();

CREATE TRIGGER "audit_logs_append_only_truncate"
BEFORE TRUNCATE ON "audit_logs"
FOR EACH STATEMENT
EXECUTE FUNCTION audit_logs_block_mutation();

COMMIT;
