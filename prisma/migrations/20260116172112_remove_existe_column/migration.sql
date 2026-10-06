/*
  Warnings:

  - A unique constraint covering the columns `[userId,moduleId]` on the table `progress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,lessonId]` on the table `progress` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastAccess" TIMESTAMP(3),
ADD COLUMN     "lastViewedSection" TEXT,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "scrollPosition" INTEGER,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "progress_userId_moduleId_idx" ON "progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "progress_userId_lastAccess_idx" ON "progress"("userId", "lastAccess");

-- CreateIndex
CREATE INDEX "progress_userId_completed_idx" ON "progress"("userId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_moduleId_key" ON "progress"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_lessonId_key" ON "progress"("userId", "lessonId");
