-- ============================================
-- Migration: Consolidate Progress System
-- ============================================
-- This migration adds step-level tracking to enable proper resume functionality.
--
-- CHANGES:
-- 1. LearningProgress: Add lastAccessedLessonId, lastAccessedAt for resume
-- 2. LessonProgress: Add currentStepIndex, totalSteps for step-level resume
--
-- NON-DESTRUCTIVE: All new columns have safe defaults
-- BACKWARD COMPATIBLE: Existing data will not break

-- ============================================
-- Step 1: Add columns to learning_progress
-- ============================================

-- Add lastAccessedLessonId (nullable, will be populated on next access)
ALTER TABLE "learning_progress"
ADD COLUMN IF NOT EXISTS "lastAccessedLessonId" TEXT;

-- Add lastAccessedAt (nullable, will be populated on next access)
ALTER TABLE "learning_progress"
ADD COLUMN IF NOT EXISTS "lastAccessedAt" TIMESTAMP(3);

-- Create indexes for efficient resume queries
CREATE INDEX IF NOT EXISTS "learning_progress_lastAccessedLessonId_idx"
ON "learning_progress"("lastAccessedLessonId");

CREATE INDEX IF NOT EXISTS "learning_progress_lastAccessedAt_idx"
ON "learning_progress"("lastAccessedAt");

-- ============================================
-- Step 2: Add columns to lesson_progress
-- ============================================

-- Add currentStepIndex (default 0 = start of lesson)
ALTER TABLE "lesson_progress"
ADD COLUMN IF NOT EXISTS "currentStepIndex" INTEGER NOT NULL DEFAULT 0;

-- Add totalSteps (default 1 = single-step lesson fallback)
ALTER TABLE "lesson_progress"
ADD COLUMN IF NOT EXISTS "totalSteps" INTEGER NOT NULL DEFAULT 1;

-- Create index for completed status queries
CREATE INDEX IF NOT EXISTS "lesson_progress_completed_idx"
ON "lesson_progress"("completed");

-- ============================================
-- Step 3: Backfill existing data (safe defaults)
-- ============================================

-- For existing LearningProgress records without lastAccessedLessonId,
-- try to set it to the most recently accessed lesson
UPDATE "learning_progress" lp
SET "lastAccessedLessonId" = (
  SELECT "lessonId"
  FROM "lesson_progress"
  WHERE "progressId" = lp."id"
  ORDER BY "lastAccessed" DESC NULLS LAST, "updatedAt" DESC
  LIMIT 1
),
"lastAccessedAt" = (
  SELECT COALESCE("lastAccessed", "updatedAt")
  FROM "lesson_progress"
  WHERE "progressId" = lp."id"
  ORDER BY "lastAccessed" DESC NULLS LAST, "updatedAt" DESC
  LIMIT 1
)
WHERE "lastAccessedLessonId" IS NULL;

-- For existing LessonProgress records, try to infer totalSteps from Step table
UPDATE "lesson_progress" lp
SET "totalSteps" = COALESCE(
  (SELECT COUNT(*) FROM "steps" s WHERE s."lessonId" = lp."lessonId" AND s."isActive" = true),
  1
)
WHERE "totalSteps" = 1;

-- For completed lessons, set currentStepIndex to last step
UPDATE "lesson_progress"
SET "currentStepIndex" = "totalSteps" - 1
WHERE "completed" = true AND "currentStepIndex" = 0 AND "totalSteps" > 1;

-- ============================================
-- Step 4: Add comment for future reference
-- ============================================

COMMENT ON COLUMN "learning_progress"."lastAccessedLessonId" IS
'Lesson ID to resume when user clicks Continue. Updated on every lesson access.';

COMMENT ON COLUMN "learning_progress"."lastAccessedAt" IS
'Timestamp of last user interaction with this module. Used for activity tracking.';

COMMENT ON COLUMN "lesson_progress"."currentStepIndex" IS
'0-based index of current step. Updated on every step navigation. Resume target.';

COMMENT ON COLUMN "lesson_progress"."totalSteps" IS
'Total number of steps in lesson. Cached for fast resume calculation.';
