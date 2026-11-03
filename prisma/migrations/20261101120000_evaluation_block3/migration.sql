-- Block 3 (evaluation). Additive only: new nullable columns, one new table and one new enum value.
-- No existing row is updated or deleted.

-- AlterEnum
ALTER TYPE "AiRatingSurface" ADD VALUE 'EVALUATION_FEEDBACK';

-- AlterTable
ALTER TABLE "evaluation_questions" ADD COLUMN     "hint" TEXT;

-- AlterTable
ALTER TABLE "evaluation_answers" ADD COLUMN     "revealed_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "grade_feedbacks" ADD COLUMN     "superseded_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "evaluation_attempt_grants" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "extra_attempts" INTEGER NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_attempt_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluation_attempt_grants_user_id_idx" ON "evaluation_attempt_grants"("user_id");

-- CreateIndex
CREATE INDEX "evaluation_attempt_grants_updated_by_id_idx" ON "evaluation_attempt_grants"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_attempt_grants_evaluation_id_user_id_key" ON "evaluation_attempt_grants"("evaluation_id", "user_id");

-- AddForeignKey
ALTER TABLE "evaluation_attempt_grants" ADD CONSTRAINT "evaluation_attempt_grants_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_attempt_grants" ADD CONSTRAINT "evaluation_attempt_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_attempt_grants" ADD CONSTRAINT "evaluation_attempt_grants_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
