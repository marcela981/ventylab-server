-- AlterTable
-- Add missing columns to progress table to align with Prisma schema
-- Schema expects: currentStep, totalSteps, completedAt (these were never in migrations)
ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "currentStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "totalSteps" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
