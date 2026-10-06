-- FASE 3: Remove legacy progress models
-- Data was migrated to UserProgress + LessonCompletion before running this migration
-- See: prisma/migrations/migrate-progress-data.ts

-- Drop lesson_progress first (FK dependency on learning_progress)
DROP TABLE IF EXISTS "lesson_progress";

-- Drop learning_progress
DROP TABLE IF EXISTS "learning_progress";
