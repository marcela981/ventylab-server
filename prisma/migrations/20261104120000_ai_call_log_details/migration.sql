-- AI hardening (wave 1). Additive only: six nullable columns on ai_call_logs for per-call traceability
-- (requested language, normalized finish reason, temperature, max output tokens, per-attempt trail, provider request id).
-- Existing rows keep NULL; nothing is updated or deleted.

-- AlterTable
ALTER TABLE "ai_call_logs" ADD COLUMN     "attempt_trail" JSONB,
ADD COLUMN     "finish_reason" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "max_output_tokens" INTEGER,
ADD COLUMN     "provider_request_id" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION;
