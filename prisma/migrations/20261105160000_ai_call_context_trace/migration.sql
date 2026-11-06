-- Simulator AI context traceability (fix/sim-assist-current-state). Additive only: four nullable columns, no row is
-- updated. context_hash is the sha256 of the simulator state actually sent to the provider (no personal data),
-- sim_time_ms the simulated time that state was rebuilt at, context_check the comparison of the client snapshot with
-- the server replay (MATCH, DIVERGED, NO_CLIENT_SNAPSHOT) and rejection_reason why a provider answer was discarded
-- after it arrived (inconsistency: it contradicted the current state).

-- AlterTable
ALTER TABLE "ai_call_logs" ADD COLUMN     "context_hash" TEXT,
ADD COLUMN     "sim_time_ms" INTEGER,
ADD COLUMN     "context_check" TEXT,
ADD COLUMN     "rejection_reason" TEXT;
