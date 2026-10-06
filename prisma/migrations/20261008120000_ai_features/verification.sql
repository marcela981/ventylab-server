-- ============================================================
-- verification.sql for migration 20261008120000_ai_features
-- Read-only. Never applied by Prisma (only migration.sql is).
--
-- PART A uses only pre-existing tables: run it BEFORE and AFTER applying; every
--        number must be identical (the migration is additive only).
-- PART B uses the new tables: run it AFTER applying only. Every row must carry
--        "ok" = true.
-- ============================================================

-- ============================================================
-- PART A: BEFORE and AFTER (pre-existing AI-related data, must not change)
-- ============================================================

-- A1. Row counts of the tables that already store AI output.
SELECT 'grade_feedbacks' AS "table", COUNT(*) AS "rows" FROM "grade_feedbacks"
UNION ALL SELECT 'evaluation_attempts', COUNT(*) FROM "evaluation_attempts"
UNION ALL SELECT 'evaluation_attempts with aiFeedback', COUNT(*) FROM "evaluation_attempts" WHERE "aiFeedback" IS NOT NULL
UNION ALL SELECT 'users', COUNT(*) FROM "users";

-- A2. grade_feedbacks per source and status.
SELECT "source"::text AS "source", "status"::text AS "status", COUNT(*) AS "rows"
FROM "grade_feedbacks"
GROUP BY 1, 2
ORDER BY 1, 2;

-- A3. Content checksums (total characters): must be identical before and after.
SELECT
  (SELECT COALESCE(SUM(LENGTH("content")), 0) FROM "grade_feedbacks") AS "grade_feedbacks_content_chars",
  (SELECT COALESCE(SUM(LENGTH("aiFeedback")), 0) FROM "evaluation_attempts") AS "evaluation_attempts_ai_feedback_chars";

-- ============================================================
-- PART B: AFTER only
-- ============================================================

-- B1. New tables exist and are empty.
SELECT 'ai_call_logs' AS "table", COUNT(*) AS "rows", COUNT(*) = 0 AS "ok" FROM "ai_call_logs"
UNION ALL SELECT 'ai_conversations', COUNT(*), COUNT(*) = 0 FROM "ai_conversations"
UNION ALL SELECT 'ai_messages', COUNT(*), COUNT(*) = 0 FROM "ai_messages"
UNION ALL SELECT 'ai_ratings', COUNT(*), COUNT(*) = 0 FROM "ai_ratings";

-- B2. New enums exist with the expected number of labels.
SELECT e."name", e."expected", COUNT(pe."enumlabel") AS "labels", COUNT(pe."enumlabel") = e."expected" AS "ok"
FROM (VALUES ('AiUseCase', 7), ('AiCallStatus', 6), ('AiConversationScope', 4), ('AiMessageRole', 2), ('AiRatingTargetType', 4)) AS e("name", "expected")
LEFT JOIN pg_type AS pt ON pt."typname" = e."name"
LEFT JOIN pg_enum AS pe ON pe."enumtypid" = pt."oid"
GROUP BY e."name", e."expected"
ORDER BY 1;

-- B3. Constraints present with the expected type (c = check, f = foreign key, p = primary key).
SELECT c."name", c."expected_type", pc."contype"::text AS "actual_type", pc."contype"::text IS NOT DISTINCT FROM c."expected_type" AS "ok"
FROM (VALUES
  ('ai_call_logs_latency_ms_check', 'c'),
  ('ai_call_logs_attempts_check', 'c'),
  ('ai_ratings_quality_check', 'c'),
  ('ai_ratings_understanding_check', 'c'),
  ('ai_ratings_expression_check', 'c'),
  ('ai_ratings_safety_check', 'c'),
  ('ai_ratings_trust_check', 'c'),
  ('ai_call_logs_user_id_fkey', 'f'),
  ('ai_conversations_user_id_fkey', 'f'),
  ('ai_messages_conversation_id_fkey', 'f'),
  ('ai_messages_ai_call_id_fkey', 'f'),
  ('ai_ratings_user_id_fkey', 'f'),
  ('ai_ratings_ai_call_id_fkey', 'f'),
  ('ai_call_logs_pkey', 'p'),
  ('ai_conversations_pkey', 'p'),
  ('ai_messages_pkey', 'p'),
  ('ai_ratings_pkey', 'p')
) AS c("name", "expected_type")
LEFT JOIN pg_constraint AS pc ON pc."conname" = c."name"
ORDER BY 1;

-- B4. Foreign key delete actions (r = restrict, c = cascade, n = set null).
SELECT c."name", c."expected", pc."confdeltype"::text AS "actual", pc."confdeltype"::text IS NOT DISTINCT FROM c."expected" AS "ok"
FROM (VALUES
  ('ai_call_logs_user_id_fkey', 'n'),
  ('ai_conversations_user_id_fkey', 'r'),
  ('ai_messages_conversation_id_fkey', 'c'),
  ('ai_messages_ai_call_id_fkey', 'n'),
  ('ai_ratings_user_id_fkey', 'r'),
  ('ai_ratings_ai_call_id_fkey', 'n')
) AS c("name", "expected")
LEFT JOIN pg_constraint AS pc ON pc."conname" = c."name"
ORDER BY 1;

-- B5. Unique index on ai_ratings (user_id, target_type, target_id).
SELECT 'ai_ratings_user_id_target_type_target_id_key' AS "index",
       EXISTS (
         SELECT 1 FROM pg_indexes
         WHERE "indexname" = 'ai_ratings_user_id_target_type_target_id_key'
           AND "indexdef" LIKE 'CREATE UNIQUE INDEX%'
       ) AS "ok";
