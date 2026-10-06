/*
  Warnings:

  - The values [INSTRUCTOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `score` on the `progress` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OverrideEntityType" AS ENUM ('LEVEL', 'LESSON', 'CARD');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPERUSER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_userId_fkey";

-- DropIndex
DROP INDEX "progress_userId_completed_idx";

-- DropIndex
DROP INDEX "progress_userId_lastAccess_idx";

-- DropIndex
DROP INDEX "progress_userId_moduleId_idx";

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedBy" TEXT;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedBy" TEXT,
ADD COLUMN     "levelId" TEXT;

-- AlterTable
ALTER TABLE "progress" DROP COLUMN "score",
ALTER COLUMN "scrollPosition" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "change_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diff" JSONB,
    "metadata" JSONB,

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_students" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_overrides" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "entityType" "OverrideEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "overrideData" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "content_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_prerequisites" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "prerequisiteLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steps" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "change_logs_entityType_entityId_idx" ON "change_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "change_logs_changedBy_idx" ON "change_logs"("changedBy");

-- CreateIndex
CREATE INDEX "change_logs_changedAt_idx" ON "change_logs"("changedAt");

-- CreateIndex
CREATE INDEX "change_logs_action_idx" ON "change_logs"("action");

-- CreateIndex
CREATE INDEX "teacher_students_teacherId_idx" ON "teacher_students"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_students_studentId_idx" ON "teacher_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_students_teacherId_studentId_key" ON "teacher_students"("teacherId", "studentId");

-- CreateIndex
CREATE INDEX "content_overrides_studentId_idx" ON "content_overrides"("studentId");

-- CreateIndex
CREATE INDEX "content_overrides_entityType_entityId_idx" ON "content_overrides"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "content_overrides_createdBy_idx" ON "content_overrides"("createdBy");

-- CreateIndex
CREATE INDEX "content_overrides_isActive_idx" ON "content_overrides"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "content_overrides_studentId_entityType_entityId_key" ON "content_overrides"("studentId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "levels_title_key" ON "levels"("title");

-- CreateIndex
CREATE INDEX "levels_order_idx" ON "levels"("order");

-- CreateIndex
CREATE INDEX "levels_isActive_idx" ON "levels"("isActive");

-- CreateIndex
CREATE INDEX "levels_lastModifiedBy_idx" ON "levels"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "level_prerequisites_levelId_idx" ON "level_prerequisites"("levelId");

-- CreateIndex
CREATE INDEX "level_prerequisites_prerequisiteLevelId_idx" ON "level_prerequisites"("prerequisiteLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "level_prerequisites_levelId_prerequisiteLevelId_key" ON "level_prerequisites"("levelId", "prerequisiteLevelId");

-- CreateIndex
CREATE INDEX "steps_lessonId_idx" ON "steps"("lessonId");

-- CreateIndex
CREATE INDEX "steps_order_idx" ON "steps"("order");

-- CreateIndex
CREATE INDEX "steps_isActive_idx" ON "steps"("isActive");

-- CreateIndex
CREATE INDEX "steps_lastModifiedBy_idx" ON "steps"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "learning_progress_userId_idx" ON "learning_progress"("userId");

-- CreateIndex
CREATE INDEX "learning_progress_moduleId_idx" ON "learning_progress"("moduleId");

-- CreateIndex
CREATE INDEX "lesson_progress_progressId_idx" ON "lesson_progress"("progressId");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE INDEX "lessons_moduleId_idx" ON "lessons"("moduleId");

-- CreateIndex
CREATE INDEX "lessons_order_idx" ON "lessons"("order");

-- CreateIndex
CREATE INDEX "lessons_isActive_idx" ON "lessons"("isActive");

-- CreateIndex
CREATE INDEX "lessons_lastModifiedBy_idx" ON "lessons"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "modules_levelId_idx" ON "modules"("levelId");

-- CreateIndex
CREATE INDEX "modules_order_idx" ON "modules"("order");

-- CreateIndex
CREATE INDEX "modules_isActive_idx" ON "modules"("isActive");

-- CreateIndex
CREATE INDEX "modules_lastModifiedBy_idx" ON "modules"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "progress_userId_idx" ON "progress"("userId");

-- CreateIndex
CREATE INDEX "progress_lessonId_idx" ON "progress"("lessonId");

-- CreateIndex
CREATE INDEX "progress_moduleId_idx" ON "progress"("moduleId");

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_overrides" ADD CONSTRAINT "content_overrides_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_overrides" ADD CONSTRAINT "content_overrides_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_prerequisites" ADD CONSTRAINT "level_prerequisites_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_prerequisites" ADD CONSTRAINT "level_prerequisites_prerequisiteLevelId_fkey" FOREIGN KEY ("prerequisiteLevelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
