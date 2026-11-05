-- Block C adjustments (evaluation results release). Additive only: one new nullable column.
-- answers_released_at marks when the teacher released the correct answers, explanations and AI feedback of an attempt;
-- grade_published_at keeps marking the release of the grade alone.

-- AlterTable
ALTER TABLE "student_evaluation_attempts" ADD COLUMN     "answers_released_at" TIMESTAMPTZ(6);

-- Attempts published before this migration already showed their corrections to the student (the previous policy
-- released everything with the grade), so they keep that state. No other row changes and nothing is deleted.
UPDATE "student_evaluation_attempts"
SET "answers_released_at" = "grade_published_at"
WHERE "grade_published_at" IS NOT NULL AND "answers_released_at" IS NULL;
