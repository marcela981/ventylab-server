-- Block A (simulator): AI use cases for the case interpretation at session start and the alarm help
-- ("¿Cómo estabilizar?"), the SIM_ALARM rating surface and the AI_CALL rating target (targetId = ai_call_logs.id).
-- Additive only: enum values cannot be dropped later in PostgreSQL.

-- AlterEnum
ALTER TYPE "AiUseCase" ADD VALUE 'SIM_CASE_INTERPRETATION';
ALTER TYPE "AiUseCase" ADD VALUE 'SIM_ALARM_HELP';

-- AlterEnum
ALTER TYPE "AiRatingSurface" ADD VALUE 'SIM_ALARM';

-- AlterEnum
ALTER TYPE "AiRatingTargetType" ADD VALUE 'AI_CALL';
