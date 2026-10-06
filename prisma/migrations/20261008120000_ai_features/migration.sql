-- ============================================================
-- Migration: ai_features
-- Structure was generated offline with
--   prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script
-- and the CHECK constraints in section 2 are hand-written (Prisma cannot express them).
-- Sections:
--   1. Structure (generated): 5 enums, 4 new tables (ai_call_logs, ai_conversations,
--      ai_messages, ai_ratings), indexes, foreign keys.
--   2. CHECK constraints (hand-written).
--
-- Additive only: no existing table, column, index or constraint is altered or dropped.
-- No data migration: there are no previous conversations, messages, call logs or
-- ratings to copy. AI output already stored in "grade_feedbacks" and in the legacy
-- "evaluation_attempts"."aiFeedback" column stays exactly as it is.
--
-- Foreign keys:
--   * ai_call_logs.user_id -> users ON DELETE SET NULL (telemetry outlives the user).
--   * ai_conversations.user_id, ai_ratings.user_id -> users ON DELETE RESTRICT
--     (student data is never lost by deleting a user).
--   * ai_messages.conversation_id -> ai_conversations ON DELETE CASCADE.
--   * ai_messages.ai_call_id, ai_ratings.ai_call_id -> ai_call_logs ON DELETE SET NULL
--     (messages and ratings outlive purged logs).
--
-- Transaction: Prisma 6 does not wrap a migration file in a transaction by
-- itself, so the whole file is wrapped in an explicit BEGIN/COMMIT.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. STRUCTURE (generated)
-- ============================================================
-- CreateEnum
CREATE TYPE "AiUseCase" AS ENUM ('GRADE_FEEDBACK', 'NOTES_ANALYSIS', 'PAGE_DEEPEN', 'LESSON_QA', 'FREE_CHAT', 'TOPIC_CHECK', 'SIM_ASSIST');

-- CreateEnum
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCESS', 'ERROR', 'FALLBACK', 'BLOCKED_OFFTOPIC', 'QUOTA_EXCEEDED', 'ABORTED');

-- CreateEnum
CREATE TYPE "AiConversationScope" AS ENUM ('FREE', 'LESSON', 'MODULE', 'PAGE');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AiRatingTargetType" AS ENUM ('GRADE_FEEDBACK', 'MESSAGE', 'NOTES_ANALYSIS', 'SIM_ASSIST');

-- CreateTable
CREATE TABLE "ai_call_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "use_case" "AiUseCase" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "prompt_version" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER NOT NULL,
    "ttft_ms" INTEGER,
    "status" "AiCallStatus" NOT NULL,
    "error_code" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "cost_estimate_usd" DECIMAL(12,6),
    "ref_type" TEXT,
    "ref_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope" "AiConversationScope" NOT NULL,
    "ref_id" TEXT,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "ai_call_id" TEXT,
    "is_incomplete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ai_call_id" TEXT,
    "target_type" "AiRatingTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "quality" INTEGER,
    "understanding" INTEGER,
    "expression" INTEGER,
    "safety" INTEGER,
    "trust" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_call_logs_user_id_use_case_created_at_idx" ON "ai_call_logs"("user_id", "use_case", "created_at");

-- CreateIndex
CREATE INDEX "ai_call_logs_use_case_created_at_idx" ON "ai_call_logs"("use_case", "created_at");

-- CreateIndex
CREATE INDEX "ai_call_logs_created_at_idx" ON "ai_call_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_updated_at_idx" ON "ai_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_scope_idx" ON "ai_conversations"("user_id", "scope");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_ratings_ai_call_id_idx" ON "ai_ratings"("ai_call_id");

-- CreateIndex
CREATE INDEX "ai_ratings_target_type_target_id_idx" ON "ai_ratings"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_ratings_user_id_target_type_target_id_key" ON "ai_ratings"("user_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "ai_call_logs" ADD CONSTRAINT "ai_call_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_ai_call_id_fkey" FOREIGN KEY ("ai_call_id") REFERENCES "ai_call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_ai_call_id_fkey" FOREIGN KEY ("ai_call_id") REFERENCES "ai_call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- 2. CHECK CONSTRAINTS (hand-written)
-- ============================================================
ALTER TABLE "ai_call_logs" ADD CONSTRAINT "ai_call_logs_latency_ms_check" CHECK ("latency_ms" >= 0);
ALTER TABLE "ai_call_logs" ADD CONSTRAINT "ai_call_logs_attempts_check" CHECK ("attempts" >= 0);

ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_quality_check" CHECK ("quality" IS NULL OR "quality" BETWEEN 1 AND 5);
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_understanding_check" CHECK ("understanding" IS NULL OR "understanding" BETWEEN 1 AND 5);
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_expression_check" CHECK ("expression" IS NULL OR "expression" BETWEEN 1 AND 5);
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_safety_check" CHECK ("safety" IS NULL OR "safety" BETWEEN 1 AND 5);
ALTER TABLE "ai_ratings" ADD CONSTRAINT "ai_ratings_trust_check" CHECK ("trust" IS NULL OR "trust" BETWEEN 1 AND 5);

COMMIT;
