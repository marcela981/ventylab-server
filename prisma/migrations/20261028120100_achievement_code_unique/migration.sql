-- AlterTable: the stable catalog key and the XP reward, nullable until existing rows are backfilled
ALTER TABLE "achievements" ADD COLUMN "code" TEXT,
ADD COLUMN "xpReward" INTEGER NOT NULL DEFAULT 0;

-- Backfill the code and the reward from the title (src/features/progress/domain/services/achievement-catalog.ts);
-- a title outside the catalog keeps a per-row legacy code so it is never merged with another row.
UPDATE "achievements" SET
  "code" = CASE "title"
    WHEN 'Primer Paso' THEN 'first_lesson'
    WHEN 'Aprendiz Dedicado' THEN 'ten_lessons'
    WHEN 'Estudiante Avanzado' THEN 'fifty_lessons'
    WHEN 'Módulo Completado' THEN 'first_module'
    WHEN 'Puntuación Perfecta' THEN 'perfect_quiz'
    WHEN 'Maestro de Quizzes' THEN 'quiz_master'
    WHEN 'Maestro de Evaluaciones' THEN 'quiz_master'
    WHEN 'Racha Semanal' THEN 'week_streak'
    WHEN 'Racha Mensual' THEN 'month_streak'
    WHEN 'Nivel 10' THEN 'level_10'
    WHEN 'Nivel 25' THEN 'level_25'
    ELSE 'legacy:' || "id"
  END,
  "xpReward" = CASE "title"
    WHEN 'Primer Paso' THEN 50
    WHEN 'Aprendiz Dedicado' THEN 200
    WHEN 'Estudiante Avanzado' THEN 500
    WHEN 'Módulo Completado' THEN 300
    WHEN 'Puntuación Perfecta' THEN 150
    WHEN 'Maestro de Quizzes' THEN 400
    WHEN 'Maestro de Evaluaciones' THEN 400
    WHEN 'Racha Semanal' THEN 250
    WHEN 'Racha Mensual' THEN 1000
    WHEN 'Nivel 10' THEN 500
    WHEN 'Nivel 25' THEN 1000
    ELSE 0
  END;

-- Remove duplicates created by concurrent unlocks before the unique index: keep the earliest unlock per (userId, code).
DO $$
DECLARE
  removed INTEGER;
BEGIN
  WITH ranked AS (
    SELECT "id", row_number() OVER (PARTITION BY "userId", "code" ORDER BY "unlockedAt" ASC, "id" ASC) AS position
    FROM "achievements"
  )
  DELETE FROM "achievements" a USING ranked r WHERE a."id" = r."id" AND r.position > 1;

  GET DIAGNOSTICS removed = ROW_COUNT;
  RAISE NOTICE 'achievement_code_unique: removed % duplicate achievement rows', removed;
END $$;

-- AlterTable
ALTER TABLE "achievements" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "achievements_userId_code_key" ON "achievements"("userId", "code");
