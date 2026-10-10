-- ============================================================
-- Migration: simulation_features
-- Structure was generated offline with
--   prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script
-- and the data backfill in section 2 is hand-written.
-- Sections:
--   1. Structure (generated): 4 new enums, 3 new "Pathology" values,
--      14 new nullable/defaulted "clinical_cases" columns, 2 new tables
--      (simulation_sessions, simulation_events), indexes, foreign keys.
--   2. Data backfill (hand-written): "clinical_cases"."status" from "isActive".
--
-- Additive only: no existing table, column, index, constraint or enum value is
-- altered or dropped. The legacy tables simulator_sessions, ventilator_reservations,
-- expert_configurations and the "clinical_cases"."isActive" column stay as they are.
--
-- Foreign keys:
--   * clinical_cases.validated_by_id, clinical_cases.created_by_id -> users
--     ON DELETE SET NULL (a case outlives its author/validator).
--   * simulation_sessions.user_id -> users ON DELETE CASCADE.
--   * simulation_sessions.case_id -> clinical_cases ON DELETE RESTRICT
--     (a case cannot be deleted while sessions reference it).
--   * simulation_sessions.attempt_id -> student_evaluation_attempts ON DELETE SET NULL.
--   * simulation_sessions.question_id -> evaluation_questions ON DELETE SET NULL.
--   * simulation_events.session_id -> simulation_sessions ON DELETE CASCADE.
--
-- Enum values: PostgreSQL 12+ allows ALTER TYPE ... ADD VALUE inside a
-- transaction, but a newly added value cannot be used in that same transaction.
-- Nothing in this file uses the new "Pathology" values (NORMAL, OBESIDAD,
-- POSTOPERATORIO). The new "ClinicalCaseStatus" type is created (not altered)
-- here, so its values can be used by the backfill.
--
-- Transaction: Prisma 6 does not wrap a migration file in a transaction by
-- itself, so the whole file is wrapped in an explicit BEGIN/COMMIT.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. STRUCTURE (generated)
-- ============================================================
-- CreateEnum
CREATE TYPE "ClinicalCaseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SimulationMode" AS ENUM ('FREE', 'EXAM');

-- CreateEnum
CREATE TYPE "SimulationSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SimulationEventType" AS ENUM ('PARAM_CHANGE', 'AI_HELP', 'CASE_EVENT', 'ALARM_ACK', 'START', 'END');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Pathology" ADD VALUE 'NORMAL';
ALTER TYPE "Pathology" ADD VALUE 'OBESIDAD';
ALTER TYPE "Pathology" ADD VALUE 'POSTOPERATORIO';

-- AlterTable
ALTER TABLE "clinical_cases" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "default_rubric" JSONB,
ADD COLUMN     "events" JSONB,
ADD COLUMN     "history" JSONB,
ADD COLUMN     "initial_state" JSONB,
ADD COLUMN     "initial_ventilator_settings" JSONB,
ADD COLUMN     "mechanics" JSONB,
ADD COLUMN     "patient_height_cm" DOUBLE PRECISION,
ADD COLUMN     "patient_sex" TEXT,
ADD COLUMN     "status" "ClinicalCaseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "targets" JSONB,
ADD COLUMN     "validated_by_expert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validated_by_id" TEXT;

-- CreateTable
CREATE TABLE "simulation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "mode" "SimulationMode" NOT NULL,
    "attempt_id" TEXT,
    "question_id" TEXT,
    "seed" INTEGER NOT NULL,
    "engine_version" TEXT NOT NULL,
    "time_multiplier" INTEGER NOT NULL DEFAULT 1,
    "status" "SimulationSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "last_event_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sim_time_ms" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,

    CONSTRAINT "simulation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sim_time_ms" INTEGER NOT NULL,
    "type" "SimulationEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_sessions_user_id_started_at_idx" ON "simulation_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "simulation_sessions_case_id_idx" ON "simulation_sessions"("case_id");

-- CreateIndex
CREATE INDEX "simulation_sessions_attempt_id_idx" ON "simulation_sessions"("attempt_id");

-- CreateIndex
CREATE INDEX "simulation_sessions_status_last_event_at_idx" ON "simulation_sessions"("status", "last_event_at");

-- CreateIndex
CREATE INDEX "simulation_events_session_id_sim_time_ms_idx" ON "simulation_events"("session_id", "sim_time_ms");

-- CreateIndex
CREATE INDEX "clinical_cases_status_idx" ON "clinical_cases"("status");

-- AddForeignKey
ALTER TABLE "clinical_cases" ADD CONSTRAINT "clinical_cases_validated_by_id_fkey" FOREIGN KEY ("validated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_cases" ADD CONSTRAINT "clinical_cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "clinical_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_evaluation_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_sessions" ADD CONSTRAINT "simulation_sessions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "evaluation_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_events" ADD CONSTRAINT "simulation_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "simulation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- 2. DATA BACKFILL (hand-written)
-- ============================================================
-- Existing cases get a lifecycle status derived from the legacy "isActive"
-- flag: active cases become PUBLISHED, inactive ones ARCHIVED. Cases created
-- after this migration default to DRAFT. "isActive" itself is left untouched.
UPDATE "clinical_cases"
SET "status" = CASE
    WHEN "isActive" THEN 'PUBLISHED'::"ClinicalCaseStatus"
    ELSE 'ARCHIVED'::"ClinicalCaseStatus"
END;

COMMIT;
