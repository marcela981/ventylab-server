/*
  Warnings:

  - You are about to drop the `progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "lesson_completions" ADD COLUMN     "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccessed" TIMESTAMP(3),
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSteps" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_progress" ADD COLUMN     "isModuleCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "progress";

-- CreateIndex
CREATE INDEX "lesson_completions_isCompleted_idx" ON "lesson_completions"("isCompleted");

-- CreateIndex
CREATE INDEX "lesson_completions_lastAccessed_idx" ON "lesson_completions"("lastAccessed");

-- CreateIndex
CREATE INDEX "user_progress_isModuleCompleted_idx" ON "user_progress"("isModuleCompleted");
