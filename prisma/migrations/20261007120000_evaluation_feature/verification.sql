-- ============================================================
-- verification.sql for migration 20261007120000_evaluation_feature
-- Read-only on persistent data. Never applied by Prisma (only migration.sql is).
-- It creates one pg_temp helper (session-private, gone when the session ends)
-- to parse activities.instructions safely.
--
-- PART A uses only legacy tables: run it BEFORE and AFTER applying; every number
--        must be identical (legacy tables are frozen by the migration).
-- PART B uses the new tables: run it AFTER applying only.
--        B1 rows carry "ok" = true when the legacy and new numbers match.
--        B2-B9 are review lists for the author.
-- ============================================================

CREATE OR REPLACE FUNCTION pg_temp.verify_try_jsonb(p_text text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_text::jsonb;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- ============================================================
-- PART A: BEFORE and AFTER (legacy tables, must not change)
-- ============================================================

-- A1. Legacy row counts (plus scores and lesson_completions, which must stay untouched).
SELECT 'quizzes' AS "table", COUNT(*) AS "rows" FROM "quizzes"
UNION ALL SELECT 'quiz_attempts', COUNT(*) FROM "quiz_attempts"
UNION ALL SELECT 'activities', COUNT(*) FROM "activities"
UNION ALL SELECT 'activity_assignments', COUNT(*) FROM "activity_assignments"
UNION ALL SELECT 'activity_submissions', COUNT(*) FROM "activity_submissions"
UNION ALL SELECT 'scores', COUNT(*) FROM "scores"
UNION ALL SELECT 'lesson_completions', COUNT(*) FROM "lesson_completions";

-- A2. Activities per type and submissions per status.
SELECT 'activity_type' AS "kind", "type"::text AS "value", COUNT(*) AS "rows" FROM "activities" GROUP BY 2
UNION ALL
SELECT 'submission_status', "status"::text, COUNT(*) FROM "activity_submissions" GROUP BY 2
ORDER BY 1, 2;

-- A3. JSON questions and options (quizzes."questions" and activities."instructions").
SELECT
  'quizzes' AS "source",
  COALESCE(SUM(jsonb_array_length(q."questions")), 0) AS "json_questions",
  COALESCE(SUM((SELECT COUNT(*) FROM jsonb_array_elements(q."questions") AS e(value)
                CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.value -> 'options') = 'array' THEN e.value -> 'options' ELSE '[]'::jsonb END) AS o(value))), 0) AS "json_options"
FROM "quizzes" AS q
WHERE jsonb_typeof(q."questions") = 'array'
UNION ALL
SELECT
  'activities',
  COALESCE(SUM(jsonb_array_length(i.doc -> 'questions')), 0),
  COALESCE(SUM((SELECT COUNT(*) FROM jsonb_array_elements(i.doc -> 'questions') AS e(value)
                CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.value -> 'options') = 'array' THEN e.value -> 'options' ELSE '[]'::jsonb END) AS o(value))), 0)
FROM "activities" AS a
CROSS JOIN LATERAL (SELECT pg_temp.verify_try_jsonb(a."instructions") AS doc) AS i
WHERE jsonb_typeof(i.doc) = 'object' AND jsonb_typeof(i.doc -> 'questions') = 'array';

-- A4. Score totals (checksums): must be identical before and after.
SELECT
  (SELECT COALESCE(SUM("score"), 0) FROM "quiz_attempts") AS "quiz_attempts_score_sum",
  (SELECT COALESCE(SUM("score"), 0) FROM "activity_submissions") AS "submissions_score_sum",
  (SELECT COUNT(*) FROM "scores") AS "scores_rows",
  (SELECT COALESCE(SUM("points"), 0) FROM "scores") AS "scores_points_sum";

-- A5. Quizzes whose "questions" is not a JSON array (they get no questions; expected 0 rows).
SELECT "id", jsonb_typeof("questions") AS "questions_type" FROM "quizzes" WHERE jsonb_typeof("questions") <> 'array';

-- ============================================================
-- PART B: AFTER only
-- ============================================================

-- B1. Parity checks: every row must have ok = true.
WITH checks AS (
  SELECT 'quizzes vs evaluations(quiz)' AS "check",
         (SELECT COUNT(*) FROM "quizzes") AS "legacy",
         (SELECT COUNT(*) FROM "evaluations" WHERE "legacy_source" = 'quiz') AS "new"
  UNION ALL
  SELECT 'activities vs evaluations(activity)',
         (SELECT COUNT(*) FROM "activities"),
         (SELECT COUNT(*) FROM "evaluations" WHERE "legacy_source" = 'activity')
  UNION ALL
  SELECT 'activities ' || t."type" || ' vs evaluations legacy_type ' || t."type",
         (SELECT COUNT(*) FROM "activities" AS a WHERE a."type"::text = t."type"),
         (SELECT COUNT(*) FROM "evaluations" AS e WHERE e."legacy_source" = 'activity' AND e."legacy_type" = t."type")
  FROM (VALUES ('EXAM'), ('QUIZ'), ('WORKSHOP'), ('TALLER')) AS t("type")
  UNION ALL
  SELECT 'quiz JSON questions vs evaluation_questions(quiz)',
         (SELECT COALESCE(SUM(jsonb_array_length("questions")), 0) FROM "quizzes" WHERE jsonb_typeof("questions") = 'array'),
         (SELECT COUNT(*) FROM "evaluation_questions" AS q JOIN "evaluations" AS e ON e."id" = q."evaluation_id" WHERE e."legacy_source" = 'quiz')
  UNION ALL
  SELECT 'activity JSON questions vs evaluation_questions(activity)',
         (SELECT COALESCE(SUM(jsonb_array_length(i.doc -> 'questions')), 0)
          FROM "activities" AS a CROSS JOIN LATERAL (SELECT pg_temp.verify_try_jsonb(a."instructions") AS doc) AS i
          WHERE jsonb_typeof(i.doc) = 'object' AND jsonb_typeof(i.doc -> 'questions') = 'array'),
         (SELECT COUNT(*) FROM "evaluation_questions" AS q JOIN "evaluations" AS e ON e."id" = q."evaluation_id" WHERE e."legacy_source" = 'activity')
  UNION ALL
  SELECT 'quiz JSON options vs evaluation_question_options(quiz)',
         (SELECT COUNT(*) FROM "quizzes" AS z
          CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(z."questions") = 'array' THEN z."questions" ELSE '[]'::jsonb END) AS e(value)
          CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.value -> 'options') = 'array' THEN e.value -> 'options' ELSE '[]'::jsonb END) AS o(value)),
         (SELECT COUNT(*) FROM "evaluation_question_options" AS o
          JOIN "evaluation_questions" AS q ON q."id" = o."question_id"
          JOIN "evaluations" AS e ON e."id" = q."evaluation_id" WHERE e."legacy_source" = 'quiz')
  UNION ALL
  SELECT 'workshops with caseStudy vs evaluation_scenarios',
         (SELECT COUNT(*) FROM "activities" AS a CROSS JOIN LATERAL (SELECT pg_temp.verify_try_jsonb(a."instructions") AS doc) AS i
          WHERE jsonb_typeof(i.doc) = 'object' AND jsonb_typeof(i.doc -> 'caseStudy') = 'object'),
         (SELECT COUNT(*) FROM "evaluation_scenarios")
  UNION ALL
  SELECT 'quiz_attempts vs attempts(quiz_attempt)',
         (SELECT COUNT(*) FROM "quiz_attempts"),
         (SELECT COUNT(*) FROM "student_evaluation_attempts" WHERE "legacy_source" = 'quiz_attempt')
  UNION ALL
  SELECT 'submissions ' || s."status" || ' vs attempts ' || s."target",
         (SELECT COUNT(*) FROM "activity_submissions" AS a WHERE a."status"::text = s."status"),
         (SELECT COUNT(*) FROM "student_evaluation_attempts" AS t
          WHERE t."legacy_source" = 'activity_submission' AND t."legacy_payload" ->> 'status' = s."status"
            AND t."status"::text = s."target" AND t."is_late" = (s."status" = 'LATE'))
  FROM (VALUES ('DRAFT', 'IN_PROGRESS'), ('SUBMITTED', 'PENDING_REVIEW'), ('LATE', 'PENDING_REVIEW'), ('GRADED', 'GRADED')) AS s("status", "target")
  UNION ALL
  SELECT 'activity_assignments vs evaluation_assignments',
         (SELECT COUNT(*) FROM "activity_assignments"),
         (SELECT COUNT(*) FROM "evaluation_assignments")
  UNION ALL
  SELECT 'quiz_attempts score sum vs attempts(quiz_attempt) score sum',
         (SELECT ROUND(COALESCE(SUM("score"), 0)::numeric, 6) FROM "quiz_attempts"),
         (SELECT ROUND(COALESCE(SUM("score"), 0)::numeric, 6) FROM "student_evaluation_attempts" WHERE "legacy_source" = 'quiz_attempt')
  UNION ALL
  SELECT 'submissions score sum vs attempts(activity_submission) score sum',
         (SELECT ROUND(COALESCE(SUM("score"), 0)::numeric, 6) FROM "activity_submissions"),
         (SELECT ROUND(COALESCE(SUM("score"), 0)::numeric, 6) FROM "student_evaluation_attempts" WHERE "legacy_source" = 'activity_submission')
  UNION ALL
  SELECT 'same ids: quizzes missing in evaluations (expect 0)',
         0,
         (SELECT COUNT(*) FROM "quizzes" AS q WHERE NOT EXISTS (SELECT 1 FROM "evaluations" AS e WHERE e."id" = q."id"))
  UNION ALL
  SELECT 'same ids: activities missing in evaluations (expect 0)',
         0,
         (SELECT COUNT(*) FROM "activities" AS a WHERE NOT EXISTS (SELECT 1 FROM "evaluations" AS e WHERE e."id" = a."id"))
  UNION ALL
  SELECT 'same ids: quiz_attempts missing in attempts (expect 0)',
         0,
         (SELECT COUNT(*) FROM "quiz_attempts" AS q WHERE NOT EXISTS (SELECT 1 FROM "student_evaluation_attempts" AS t WHERE t."id" = q."id"))
  UNION ALL
  SELECT 'same ids: activity_submissions missing in attempts (expect 0)',
         0,
         (SELECT COUNT(*) FROM "activity_submissions" AS s WHERE NOT EXISTS (SELECT 1 FROM "student_evaluation_attempts" AS t WHERE t."id" = s."id"))
)
SELECT "check", "legacy", "new", "legacy" = "new" AS "ok" FROM checks;

-- B2. OE2-equivalent counts. Expected: active QUIZ evaluations from quizzes = 26,
--     legacy_type EXAM = 6, legacy_type TALLER = 9.
SELECT
  (SELECT COUNT(*) FROM "evaluations" WHERE "type" = 'QUIZ' AND "legacy_source" = 'quiz' AND "status" = 'READY') AS "active_quiz_evaluations",
  (SELECT COUNT(*) FROM "evaluations" WHERE "legacy_type" = 'EXAM') AS "legacy_exam",
  (SELECT COUNT(*) FROM "evaluations" WHERE "legacy_type" = 'TALLER') AS "legacy_taller",
  (SELECT COUNT(*) FROM "evaluations" WHERE "type" = 'WORKSHOP') AS "workshop_evaluations";

-- B3. Question id generation. Expected: every question uses '<evaluationId>:<legacy_ref>';
--     rows here used the '#<order>' fallback (missing or duplicated JSON id) and need review.
SELECT q."evaluation_id", q."id", q."order", q."legacy_ref", q."legacy_type"
FROM "evaluation_questions" AS q
WHERE q."id" <> q."evaluation_id" || ':' || COALESCE(q."legacy_ref", '')
ORDER BY q."evaluation_id", q."order";

-- B3b. Same for options.
SELECT o."question_id", o."id", o."order", o."legacy_ref"
FROM "evaluation_question_options" AS o
WHERE o."id" <> o."question_id" || ':' || COALESCE(o."legacy_ref", '')
ORDER BY o."question_id", o."order";

-- B4. Question type mapping summary (legacy JSON type -> new type).
SELECT q."legacy_type", q."type"::text AS "type", COUNT(*) AS "questions"
FROM "evaluation_questions" AS q
GROUP BY 1, 2
ORDER BY 1, 2;

-- B4b. Choice questions without exactly the expected correct options (review: 0 correct, or
--      SINGLE_CHOICE/TRUE_FALSE with more than one correct).
SELECT q."evaluation_id", q."id", q."type"::text AS "type",
       COUNT(o."id") FILTER (WHERE o."is_correct") AS "correct_options",
       COUNT(o."id") AS "options"
FROM "evaluation_questions" AS q
LEFT JOIN "evaluation_question_options" AS o ON o."question_id" = q."id"
GROUP BY q."evaluation_id", q."id", q."type"
HAVING COUNT(o."id") FILTER (WHERE o."is_correct") = 0
    OR (q."type" IN ('SINGLE_CHOICE', 'TRUE_FALSE') AND COUNT(o."id") FILTER (WHERE o."is_correct") > 1)
ORDER BY 1, 2;

-- B5. Quiz attempt answers: legacy answer entries vs mapped evaluation_answers.
--     "unmapped" entries stay only in legacy_payload.answers.
WITH legacy AS (
  SELECT qa."id" AS attempt_id,
         CASE jsonb_typeof(qa."answers")
           WHEN 'array' THEN jsonb_array_length(qa."answers")
           WHEN 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(qa."answers"))
           ELSE 0
         END AS legacy_entries
  FROM "quiz_attempts" AS qa
),
mapped AS (
  SELECT "attempt_id", COUNT(*) AS mapped_entries, COUNT(*) FILTER (WHERE cardinality("selected_option_ids") = 0) AS unknown_option
  FROM "evaluation_answers" GROUP BY "attempt_id"
)
SELECT
  SUM(l.legacy_entries) AS "legacy_answer_entries",
  COALESCE(SUM(m.mapped_entries), 0) AS "mapped_answers",
  SUM(l.legacy_entries) - COALESCE(SUM(m.mapped_entries), 0) AS "unmapped_entries",
  COALESCE(SUM(m.unknown_option), 0) AS "mapped_with_unknown_option",
  COUNT(*) FILTER (WHERE l.legacy_entries > COALESCE(m.mapped_entries, 0)) AS "attempts_with_unmapped_entries"
FROM legacy AS l
LEFT JOIN mapped AS m ON m."attempt_id" = l.attempt_id;

-- B5b. Recomputed quiz score from mapped answers vs stored score (review rows that differ;
--      differences mean the legacy grader and the copied answers disagree).
SELECT t."id", t."evaluation_id", t."score" AS "stored_score",
       ROUND((100 * SUM(a."auto_score") / NULLIF((SELECT COUNT(*) FROM "evaluation_questions" AS q WHERE q."evaluation_id" = t."evaluation_id"), 0))::numeric, 2) AS "recomputed_score"
FROM "student_evaluation_attempts" AS t
JOIN "evaluation_answers" AS a ON a."attempt_id" = t."id"
WHERE t."legacy_source" = 'quiz_attempt'
GROUP BY t."id", t."evaluation_id", t."score"
HAVING ABS(t."score" - 100 * SUM(a."auto_score") / NULLIF((SELECT COUNT(*) FROM "evaluation_questions" AS q WHERE q."evaluation_id" = t."evaluation_id"), 0)) > 0.01
ORDER BY t."id"
LIMIT 50;

-- B6. Grade spot-check (20 rows per source): grade must equal round(5 * score / max_score, 1).
(SELECT t."legacy_source", t."id", t."score", t."max_score", t."grade",
        ROUND((5 * t."score" / t."max_score")::numeric, 1) AS "expected_grade", t."status"::text AS "status", t."grade_published_at"
 FROM "student_evaluation_attempts" AS t WHERE t."legacy_source" = 'quiz_attempt' ORDER BY t."id" LIMIT 20)
UNION ALL
(SELECT t."legacy_source", t."id", t."score", t."max_score", t."grade",
        CASE WHEN t."score" IS NOT NULL AND t."max_score" > 0 THEN ROUND((5 * t."score" / t."max_score")::numeric, 1) END,
        t."status"::text, t."grade_published_at"
 FROM "student_evaluation_attempts" AS t WHERE t."legacy_source" = 'activity_submission' ORDER BY t."id" LIMIT 20);

-- B6b. Grade mismatches across all attempts (expected 0 rows).
SELECT t."id", t."score", t."max_score", t."grade"
FROM "student_evaluation_attempts" AS t
WHERE t."score" IS NOT NULL AND t."max_score" > 0
  AND t."grade" IS DISTINCT FROM ROUND((5 * t."score" / t."max_score")::numeric, 1)::double precision;

-- B7. Review: quiz attempts without completedAt (GRADED but no submitted_at / grade_published_at).
SELECT t."id", t."evaluation_id", t."user_id", t."started_at"
FROM "student_evaluation_attempts" AS t
WHERE t."legacy_source" = 'quiz_attempt' AND t."submitted_at" IS NULL;

-- B7b. Review: submissions without a matching assignment (assignment_id NULL), GRADED
--      submissions without score, and users with more quiz attempts than max_attempts.
SELECT 'submission_without_assignment' AS "issue", COUNT(*) AS "rows"
FROM "student_evaluation_attempts" WHERE "legacy_source" = 'activity_submission' AND "assignment_id" IS NULL
UNION ALL
SELECT 'graded_submission_without_score', COUNT(*)
FROM "student_evaluation_attempts" WHERE "legacy_source" = 'activity_submission' AND "status" = 'GRADED' AND "score" IS NULL
UNION ALL
SELECT 'quiz_attempt_number_above_max_attempts', COUNT(*)
FROM "student_evaluation_attempts" AS t JOIN "evaluations" AS e ON e."id" = t."evaluation_id"
WHERE t."legacy_source" = 'quiz_attempt' AND t."attempt_number" > e."max_attempts";

-- B8. Review: module references that were nulled (legacy_module_ref not in modules).
SELECT e."id", e."legacy_source", e."legacy_module_ref"
FROM "evaluations" AS e
WHERE e."legacy_module_ref" IS NOT NULL AND e."module_id" IS NULL
ORDER BY e."legacy_source", e."id";

-- B9. Review: READY evaluations without questions (cannot be started by students).
SELECT e."id", e."type"::text AS "type", e."legacy_source", e."legacy_type"
FROM "evaluations" AS e
WHERE e."status" = 'READY' AND NOT EXISTS (SELECT 1 FROM "evaluation_questions" AS q WHERE q."evaluation_id" = e."id")
ORDER BY e."id";
