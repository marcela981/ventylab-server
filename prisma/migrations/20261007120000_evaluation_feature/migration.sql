-- ============================================================
-- Migration: evaluation_feature
-- Structure was generated offline with
--   prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script
-- and the data copy below is hand-written. Sections:
--   1. Structure (generated): enums, 8 new tables, indexes, foreign keys.
--   2. Helpers (pg_temp functions, dropped with the session).
--   3. Collision guards: abort with RAISE EXCEPTION before any insert.
--   4. quizzes            -> evaluations (QUIZ).
--   5. activities         -> evaluations (EXAM / WORKSHOP / QUIZ) + caseStudy scenario.
--   6. JSON questions/options of quizzes and of the JSON stored in activities.instructions.
--   7. activity_assignments -> evaluation_assignments.
--   8. quiz_attempts      -> student_evaluation_attempts (GRADED) + evaluation_answers.
--   9. activity_submissions -> student_evaluation_attempts.
--
-- Lossless rules:
--   * Every legacy table (quizzes, quiz_attempts, activities, activity_assignments,
--     activity_submissions) is read only; nothing is updated or deleted.
--   * Evaluations, assignments and attempts keep the SAME ids as their source rows.
--   * Legacy JSON question/option ids ("q1", "a", ...) repeat across quizzes, so
--     question ids are '<evaluationId>:<jsonQuestionId>' and option ids are
--     '<questionId>:<jsonOptionId>'; the original JSON ids are kept in "legacy_ref".
--     A missing or duplicated JSON id falls back to '#<ordinality>'.
--   * Values that have no target column are kept in legacy_* columns or legacy_payload.
--   * scores, lesson_completions and clinical-case tables are not touched.
--
-- Legacy timestamps are TIMESTAMP(3) written in UTC by Prisma; new columns are
-- TIMESTAMPTZ(6), so every copy converts with AT TIME ZONE 'UTC'.
--
-- Idempotent: every insert uses ON CONFLICT DO NOTHING, so re-running the data
-- sections after a partial manual run inserts only what is missing.
--
-- Transaction: Prisma 6 does not wrap a migration file in a transaction by
-- itself, so the whole file is wrapped in an explicit BEGIN/COMMIT. Any failure
-- rolls back structure and data together.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. STRUCTURE (generated)
-- ============================================================
-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('EXAM', 'QUIZ', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_TEXT', 'SIMULATION');

-- CreateEnum
CREATE TYPE "EvaluationAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'PENDING_REVIEW', 'GRADED');

-- CreateEnum
CREATE TYPE "GradeFeedbackSource" AS ENUM ('LLM', 'DETERMINISTIC');

-- CreateEnum
CREATE TYPE "GradeFeedbackStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "module_id" TEXT,
    "level_id" TEXT,
    "lesson_id" TEXT,
    "duration_minutes" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "show_results_immediately" BOOLEAN NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "legacy_source" TEXT,
    "legacy_type" TEXT,
    "legacy_passing_score" DOUBLE PRECISION,
    "legacy_max_score" DOUBLE PRECISION,
    "legacy_due_date" TIMESTAMPTZ(6),
    "legacy_module_ref" TEXT,
    "legacy_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_scenarios" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "media_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_questions" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "order" INTEGER NOT NULL,
    "type" "EvaluationQuestionType" NOT NULL,
    "prompt" JSONB NOT NULL,
    "media_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "clinical_case_id" TEXT,
    "rubric" JSONB,
    "legacy_type" TEXT,
    "legacy_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "media_id" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "legacy_feedback" TEXT,
    "legacy_ref" TEXT,

    CONSTRAINT "evaluation_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_assignments" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "assigned_by_id" TEXT,
    "legacy_is_active" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_evaluation_attempts" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "user_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "EvaluationAttemptStatus" NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "deadline_at" TIMESTAMPTZ(6),
    "score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "grade" DOUBLE PRECISION,
    "grade_published_at" TIMESTAMPTZ(6),
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "legacy_source" TEXT,
    "legacy_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_evaluation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "text_answer" TEXT,
    "simulation_session_id" TEXT,
    "auto_score" DOUBLE PRECISION,
    "manual_score" DOUBLE PRECISION,
    "teacher_comment" TEXT,
    "graded_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_feedbacks" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT,
    "content" TEXT NOT NULL,
    "source" "GradeFeedbackSource" NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" "GradeFeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluations_type_status_idx" ON "evaluations"("type", "status");

-- CreateIndex
CREATE INDEX "evaluations_module_id_idx" ON "evaluations"("module_id");

-- CreateIndex
CREATE INDEX "evaluations_lesson_id_idx" ON "evaluations"("lesson_id");

-- CreateIndex
CREATE INDEX "evaluations_level_id_idx" ON "evaluations"("level_id");

-- CreateIndex
CREATE INDEX "evaluations_created_by_id_idx" ON "evaluations"("created_by_id");

-- CreateIndex
CREATE INDEX "evaluation_scenarios_evaluation_id_order_idx" ON "evaluation_scenarios"("evaluation_id", "order");

-- CreateIndex
CREATE INDEX "evaluation_questions_evaluation_id_order_idx" ON "evaluation_questions"("evaluation_id", "order");

-- CreateIndex
CREATE INDEX "evaluation_questions_scenario_id_idx" ON "evaluation_questions"("scenario_id");

-- CreateIndex
CREATE INDEX "evaluation_questions_clinical_case_id_idx" ON "evaluation_questions"("clinical_case_id");

-- CreateIndex
CREATE INDEX "evaluation_question_options_question_id_order_idx" ON "evaluation_question_options"("question_id", "order");

-- CreateIndex
CREATE INDEX "evaluation_question_options_media_id_idx" ON "evaluation_question_options"("media_id");

-- CreateIndex
CREATE INDEX "evaluation_assignments_group_id_evaluation_id_idx" ON "evaluation_assignments"("group_id", "evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_assignments_evaluation_id_idx" ON "evaluation_assignments"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_assignments_assigned_by_id_idx" ON "evaluation_assignments"("assigned_by_id");

-- CreateIndex
CREATE INDEX "student_evaluation_attempts_evaluation_id_user_id_idx" ON "student_evaluation_attempts"("evaluation_id", "user_id");

-- CreateIndex
CREATE INDEX "student_evaluation_attempts_user_id_idx" ON "student_evaluation_attempts"("user_id");

-- CreateIndex
CREATE INDEX "student_evaluation_attempts_status_idx" ON "student_evaluation_attempts"("status");

-- CreateIndex
CREATE INDEX "student_evaluation_attempts_assignment_id_idx" ON "student_evaluation_attempts"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_evaluation_attempts_evaluation_id_user_id_attempt_n_key" ON "student_evaluation_attempts"("evaluation_id", "user_id", "attempt_number");

-- CreateIndex
CREATE INDEX "evaluation_answers_question_id_idx" ON "evaluation_answers"("question_id");

-- CreateIndex
CREATE INDEX "evaluation_answers_graded_by_id_idx" ON "evaluation_answers"("graded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_answers_attempt_id_question_id_key" ON "evaluation_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "grade_feedbacks_attempt_id_idx" ON "grade_feedbacks"("attempt_id");

-- CreateIndex
CREATE INDEX "grade_feedbacks_question_id_idx" ON "grade_feedbacks"("question_id");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scenarios" ADD CONSTRAINT "evaluation_scenarios_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "evaluation_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_clinical_case_id_fkey" FOREIGN KEY ("clinical_case_id") REFERENCES "clinical_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_question_options" ADD CONSTRAINT "evaluation_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "evaluation_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_question_options" ADD CONSTRAINT "evaluation_question_options_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_attempts" ADD CONSTRAINT "student_evaluation_attempts_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_attempts" ADD CONSTRAINT "student_evaluation_attempts_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "evaluation_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_attempts" ADD CONSTRAINT "student_evaluation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_evaluation_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "evaluation_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_answers" ADD CONSTRAINT "evaluation_answers_graded_by_id_fkey" FOREIGN KEY ("graded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_feedbacks" ADD CONSTRAINT "grade_feedbacks_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_evaluation_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_feedbacks" ADD CONSTRAINT "grade_feedbacks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "evaluation_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- 2. HELPERS (pg_temp: private to this session, never persisted)
-- ============================================================

-- Rich text uses the same TipTap document shape as notes.content:
-- {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}
-- One paragraph per non-empty input text; an empty document keeps one empty paragraph.
CREATE FUNCTION pg_temp.evaluation_rich_text(p_texts text[]) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'type', 'doc',
    'content', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', u.t)))
          ORDER BY u.ord
        )
        FROM unnest(p_texts) WITH ORDINALITY AS u(t, ord)
        WHERE u.t IS NOT NULL AND u.t <> ''
      ),
      jsonb_build_array(jsonb_build_object('type', 'paragraph'))
    )
  )
$$;

-- activities.instructions is TEXT; teacher-written instructions are not JSON.
CREATE FUNCTION pg_temp.evaluation_try_jsonb(p_text text) RETURNS jsonb
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

-- Returns the value when it is a JSON array (also a JSON-encoded string holding one), else [].
CREATE FUNCTION pg_temp.evaluation_json_array(p_value jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_value) = 'array' THEN p_value
    WHEN jsonb_typeof(p_value) = 'string'
      AND jsonb_typeof(pg_temp.evaluation_try_jsonb(p_value #>> '{}')) = 'array'
      THEN pg_temp.evaluation_try_jsonb(p_value #>> '{}')
    ELSE '[]'::jsonb
  END
$$;

CREATE FUNCTION pg_temp.evaluation_json_true(p_value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(p_value = 'true'::jsonb OR (jsonb_typeof(p_value) = 'string' AND lower(p_value #>> '{}') = 'true'), false)
$$;

-- ============================================================
-- 3. STAGING + COLLISION GUARDS (nothing is inserted before these pass)
-- ============================================================

-- One row per legacy evaluation source with its JSON question array.
-- Activities seeded from JSON store {moduleId, level, passingScore, caseStudy?, questions} in "instructions".
CREATE TEMP TABLE _evaluation_sources ON COMMIT DROP AS
SELECT
  q."id"                                       AS evaluation_id,
  'quiz'::text                                 AS legacy_source,
  pg_temp.evaluation_json_array(q."questions") AS questions,
  NULL::jsonb                                  AS case_study,
  q."createdAt" AT TIME ZONE 'UTC'             AS created_at,
  q."updatedAt" AT TIME ZONE 'UTC'             AS updated_at
FROM "quizzes" AS q
UNION ALL
SELECT
  a."id",
  'activity',
  pg_temp.evaluation_json_array(CASE WHEN jsonb_typeof(i.doc) = 'object' THEN i.doc -> 'questions' END),
  CASE WHEN jsonb_typeof(i.doc) = 'object' AND jsonb_typeof(i.doc -> 'caseStudy') = 'object' THEN i.doc -> 'caseStudy' END,
  a."createdAt" AT TIME ZONE 'UTC',
  a."updatedAt" AT TIME ZONE 'UTC'
FROM "activities" AS a
CROSS JOIN LATERAL (SELECT pg_temp.evaluation_try_jsonb(a."instructions") AS doc) AS i;

CREATE TEMP TABLE _evaluation_question_map ON COMMIT DROP AS
WITH raw AS (
  SELECT
    s.evaluation_id,
    s.case_study IS NOT NULL                     AS has_scenario,
    s.created_at,
    s.updated_at,
    e.value                                      AS q,
    e.ord::int                                   AS ord,
    NULLIF(e.value ->> 'id', '')                 AS legacy_ref
  FROM _evaluation_sources AS s
  CROSS JOIN LATERAL jsonb_array_elements(s.questions) WITH ORDINALITY AS e(value, ord)
),
counted AS (
  SELECT raw.*, COUNT(*) OVER (PARTITION BY raw.evaluation_id, raw.legacy_ref) AS ref_count
  FROM raw
)
SELECT
  c.evaluation_id || ':' || CASE WHEN c.legacy_ref IS NOT NULL AND c.ref_count = 1 THEN c.legacy_ref ELSE '#' || c.ord END AS question_id,
  c.evaluation_id,
  c.has_scenario,
  c.created_at,
  c.updated_at,
  c.q,
  c.ord,
  c.legacy_ref,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(pg_temp.evaluation_json_array(c.q -> 'options')) AS o(value)
    WHERE pg_temp.evaluation_json_true(o.value -> 'isCorrect')
  ) AS correct_count
FROM counted AS c;

CREATE TEMP TABLE _evaluation_option_map ON COMMIT DROP AS
WITH raw AS (
  SELECT
    m.question_id,
    m.created_at,
    e.value                       AS o,
    e.ord::int                    AS ord,
    NULLIF(e.value ->> 'id', '')  AS legacy_ref
  FROM _evaluation_question_map AS m
  CROSS JOIN LATERAL jsonb_array_elements(pg_temp.evaluation_json_array(m.q -> 'options')) WITH ORDINALITY AS e(value, ord)
),
counted AS (
  SELECT raw.*, COUNT(*) OVER (PARTITION BY raw.question_id, raw.legacy_ref) AS ref_count
  FROM raw
)
SELECT
  c.question_id || ':' || CASE WHEN c.legacy_ref IS NOT NULL AND c.ref_count = 1 THEN c.legacy_ref ELSE '#' || c.ord END AS option_id,
  c.question_id,
  c.o,
  c.ord,
  c.legacy_ref
FROM counted AS c;

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "quizzes" AS q JOIN "activities" AS a ON a."id" = q."id";
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % quiz id(s) collide with activity ids in evaluations', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM "quiz_attempts" AS qa JOIN "activity_submissions" AS s ON s."id" = qa."id";
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % quiz attempt id(s) collide with activity submission ids in student_evaluation_attempts', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM "evaluations" AS e
  WHERE (e."id" IN (SELECT "id" FROM "quizzes") AND e."legacy_source" IS DISTINCT FROM 'quiz')
     OR (e."id" IN (SELECT "id" FROM "activities") AND e."legacy_source" IS DISTINCT FROM 'activity');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % existing evaluation(s) reuse a legacy id with another source', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM "student_evaluation_attempts" AS t
  WHERE (t."id" IN (SELECT "id" FROM "quiz_attempts") AND t."legacy_source" IS DISTINCT FROM 'quiz_attempt')
     OR (t."id" IN (SELECT "id" FROM "activity_submissions") AND t."legacy_source" IS DISTINCT FROM 'activity_submission');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % existing attempt(s) reuse a legacy id with another source', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM (SELECT question_id FROM _evaluation_question_map GROUP BY question_id HAVING COUNT(*) > 1) AS d;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % generated question id(s) are not unique', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM (SELECT option_id FROM _evaluation_option_map GROUP BY option_id HAVING COUNT(*) > 1) AS d;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'evaluation_feature: % generated option id(s) are not unique', v_count;
  END IF;
END;
$$;

-- ============================================================
-- 4. quizzes -> evaluations (QUIZ)
-- ============================================================
-- quizzes."moduleId" has no FK and may hold ids that are not in modules:
-- module_id keeps only existing ids, legacy_module_ref always keeps the original.
INSERT INTO "evaluations" (
  "id", "type", "title", "description", "module_id", "level_id", "lesson_id", "duration_minutes",
  "max_attempts", "shuffle_questions", "show_results_immediately", "status", "order", "created_by_id",
  "legacy_source", "legacy_type", "legacy_passing_score", "legacy_max_score", "legacy_due_date",
  "legacy_module_ref", "legacy_instructions", "created_at", "updated_at"
)
SELECT
  q."id",
  'QUIZ'::"EvaluationType",
  q."title",
  q."description",
  CASE WHEN EXISTS (SELECT 1 FROM "modules" AS m WHERE m."id" = q."moduleId") THEN q."moduleId" END,
  NULL,
  q."lessonId",
  q."timeLimit",
  1,
  false,
  true,
  (CASE WHEN q."isActive" THEN 'READY' ELSE 'ARCHIVED' END)::"EvaluationStatus",
  q."order",
  NULL,
  'quiz',
  NULL,
  q."passingScore",
  NULL,
  NULL,
  q."moduleId",
  NULL,
  q."createdAt" AT TIME ZONE 'UTC',
  q."updatedAt" AT TIME ZONE 'UTC'
FROM "quizzes" AS q
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 5. activities -> evaluations (EXAM / WORKSHOP / QUIZ)
-- ============================================================
-- TALLER folds into WORKSHOP; legacy_type keeps the original ActivityType for every row.
-- instructions is kept verbatim in legacy_instructions; when it holds the seeded JSON,
-- its moduleId / level / passingScore also fill module_id, level_id and legacy_passing_score.
INSERT INTO "evaluations" (
  "id", "type", "title", "description", "module_id", "level_id", "lesson_id", "duration_minutes",
  "max_attempts", "shuffle_questions", "show_results_immediately", "status", "order", "created_by_id",
  "legacy_source", "legacy_type", "legacy_passing_score", "legacy_max_score", "legacy_due_date",
  "legacy_module_ref", "legacy_instructions", "created_at", "updated_at"
)
SELECT
  a."id",
  (CASE a."type"::text WHEN 'EXAM' THEN 'EXAM' WHEN 'QUIZ' THEN 'QUIZ' ELSE 'WORKSHOP' END)::"EvaluationType",
  a."title",
  a."description",
  CASE WHEN EXISTS (SELECT 1 FROM "modules" AS m WHERE m."id" = i.doc ->> 'moduleId') THEN i.doc ->> 'moduleId' END,
  CASE WHEN EXISTS (SELECT 1 FROM "levels" AS l WHERE l."id" = i.doc ->> 'level') THEN i.doc ->> 'level' END,
  NULL,
  a."timeLimit",
  1,
  false,
  false,
  (CASE WHEN NOT a."isActive" THEN 'ARCHIVED' WHEN a."isPublished" THEN 'READY' ELSE 'DRAFT' END)::"EvaluationStatus",
  0,
  CASE WHEN EXISTS (SELECT 1 FROM "users" AS u WHERE u."id" = a."createdBy") THEN a."createdBy" END,
  'activity',
  a."type"::text,
  CASE WHEN jsonb_typeof(i.doc -> 'passingScore') = 'number' THEN (i.doc ->> 'passingScore')::double precision END,
  a."maxScore",
  a."dueDate" AT TIME ZONE 'UTC',
  i.doc ->> 'moduleId',
  a."instructions",
  a."createdAt" AT TIME ZONE 'UTC',
  a."updatedAt" AT TIME ZONE 'UTC'
FROM "activities" AS a
CROSS JOIN LATERAL (
  SELECT CASE WHEN jsonb_typeof(pg_temp.evaluation_try_jsonb(a."instructions")) = 'object'
    THEN pg_temp.evaluation_try_jsonb(a."instructions") END AS doc
) AS i
ON CONFLICT ("id") DO NOTHING;

-- 5.1 Workshop caseStudy -> one scenario shared by every question of the evaluation.
INSERT INTO "evaluation_scenarios" ("id", "evaluation_id", "order", "content", "media_ids", "created_at", "updated_at")
SELECT
  s.evaluation_id || ':scenario',
  s.evaluation_id,
  1,
  pg_temp.evaluation_rich_text(ARRAY[s.case_study ->> 'patient', s.case_study ->> 'scenario', s.case_study ->> 'objective']),
  '{}',
  s.created_at,
  s.updated_at
FROM _evaluation_sources AS s
WHERE s.case_study IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 6. JSON questions and options (quizzes and seeded activities)
-- ============================================================
-- Type mapping: true_false -> TRUE_FALSE; more than one correct option -> MULTIPLE_CHOICE;
-- anything else (multiple_choice, scenario_choice, unknown) -> SINGLE_CHOICE.
-- legacy_type keeps the JSON type, legacy_ref the JSON question id.
INSERT INTO "evaluation_questions" (
  "id", "evaluation_id", "scenario_id", "order", "type", "prompt", "media_ids", "points",
  "explanation", "clinical_case_id", "rubric", "legacy_type", "legacy_ref", "created_at", "updated_at"
)
SELECT
  m.question_id,
  m.evaluation_id,
  CASE WHEN m.has_scenario THEN m.evaluation_id || ':scenario' END,
  m.ord,
  (CASE
    WHEN m.q ->> 'type' = 'true_false' THEN 'TRUE_FALSE'
    WHEN m.correct_count > 1 THEN 'MULTIPLE_CHOICE'
    ELSE 'SINGLE_CHOICE'
  END)::"EvaluationQuestionType",
  pg_temp.evaluation_rich_text(ARRAY[COALESCE(m.q ->> 'text', m.q ->> 'question')]),
  '{}',
  1,
  m.q ->> 'explanation',
  NULL,
  NULL,
  m.q ->> 'type',
  m.legacy_ref,
  m.created_at,
  m.updated_at
FROM _evaluation_question_map AS m
WHERE EXISTS (SELECT 1 FROM "evaluations" AS e WHERE e."id" = m.evaluation_id)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "evaluation_question_options" ("id", "question_id", "order", "content", "media_id", "is_correct", "legacy_feedback", "legacy_ref")
SELECT
  o.option_id,
  o.question_id,
  o.ord,
  COALESCE(o.o ->> 'text', o.o ->> 'label', ''),
  NULL,
  pg_temp.evaluation_json_true(o.o -> 'isCorrect'),
  o.o ->> 'feedback',
  o.legacy_ref
FROM _evaluation_option_map AS o
WHERE EXISTS (SELECT 1 FROM "evaluation_questions" AS q WHERE q."id" = o.question_id)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 7. activity_assignments -> evaluation_assignments
-- ============================================================
-- starts_at = COALESCE(visibleFrom, createdAt); ends_at = assignment dueDate, falling back
-- to the activity dueDate (the legacy effective deadline). Inactive assignments are kept
-- with legacy_is_active = false so nothing is dropped; E3 decides how they read.
INSERT INTO "evaluation_assignments" (
  "id", "evaluation_id", "group_id", "starts_at", "ends_at", "assigned_by_id", "legacy_is_active", "created_at", "updated_at"
)
SELECT
  aa."id",
  aa."activityId",
  aa."groupId",
  COALESCE(aa."visibleFrom", aa."createdAt") AT TIME ZONE 'UTC',
  COALESCE(aa."dueDate", a."dueDate") AT TIME ZONE 'UTC',
  CASE WHEN EXISTS (SELECT 1 FROM "users" AS u WHERE u."id" = aa."assignedBy") THEN aa."assignedBy" END,
  aa."isActive",
  aa."createdAt" AT TIME ZONE 'UTC',
  aa."createdAt" AT TIME ZONE 'UTC'
FROM "activity_assignments" AS aa
JOIN "activities" AS a ON a."id" = aa."activityId"
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 8. quiz_attempts -> student_evaluation_attempts (GRADED) + evaluation_answers
-- ============================================================
-- score stays on the 0-100 scale with max_score 100; grade = round(5 * score / 100, 1).
-- attempt_number is deterministic (startedAt, id) so a re-run maps to the same numbers.
INSERT INTO "student_evaluation_attempts" (
  "id", "evaluation_id", "assignment_id", "user_id", "attempt_number", "status", "started_at", "submitted_at",
  "deadline_at", "score", "max_score", "grade", "grade_published_at", "is_late", "legacy_source", "legacy_payload",
  "created_at", "updated_at"
)
SELECT
  qa."id",
  qa."quizId",
  NULL,
  qa."userId",
  (ROW_NUMBER() OVER (PARTITION BY qa."userId", qa."quizId" ORDER BY qa."startedAt", qa."id"))::int,
  'GRADED'::"EvaluationAttemptStatus",
  qa."startedAt" AT TIME ZONE 'UTC',
  qa."completedAt" AT TIME ZONE 'UTC',
  NULL,
  qa."score",
  100,
  ROUND((5 * qa."score" / 100)::numeric, 1)::double precision,
  qa."completedAt" AT TIME ZONE 'UTC',
  false,
  'quiz_attempt',
  jsonb_build_object('answers', qa."answers", 'passed', qa."passed", 'score', qa."score"),
  qa."startedAt" AT TIME ZONE 'UTC',
  COALESCE(qa."completedAt", qa."startedAt") AT TIME ZONE 'UTC'
FROM "quiz_attempts" AS qa
ON CONFLICT ("id") DO NOTHING;

-- Answers are stored as [{questionId, selectedOptionId}] (an {questionId: optionId} object is
-- also accepted). Only answers whose question exists are copied; the rest stay only in
-- legacy_payload.answers (counted in verification.sql). An unknown option id becomes an
-- empty selection with auto_score 0.
INSERT INTO "evaluation_answers" (
  "id", "attempt_id", "question_id", "selected_option_ids", "text_answer", "simulation_session_id",
  "auto_score", "manual_score", "teacher_comment", "graded_by_id", "created_at", "updated_at"
)
SELECT DISTINCT ON (qa."id", q."id")
  qa."id" || ':' || q."id",
  qa."id",
  q."id",
  CASE WHEN o."id" IS NULL THEN '{}'::text[] ELSE ARRAY[o."id"] END,
  NULL,
  NULL,
  CASE WHEN o."is_correct" THEN q."points" ELSE 0 END,
  NULL,
  NULL,
  NULL,
  COALESCE(qa."completedAt", qa."startedAt") AT TIME ZONE 'UTC',
  COALESCE(qa."completedAt", qa."startedAt") AT TIME ZONE 'UTC'
FROM "quiz_attempts" AS qa
CROSS JOIN LATERAL (
  SELECT
    e.value ->> 'questionId' AS question_ref,
    COALESCE(e.value ->> 'selectedOptionId', e.value ->> 'optionId') AS option_ref,
    e.ord
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(qa."answers") = 'array' THEN qa."answers" ELSE '[]'::jsonb END)
    WITH ORDINALITY AS e(value, ord)
  UNION ALL
  SELECT
    kv.key,
    CASE WHEN jsonb_typeof(kv.value) = 'object' THEN kv.value ->> 'selectedOptionId' ELSE kv.value #>> '{}' END,
    kv.ord
  FROM jsonb_each(CASE WHEN jsonb_typeof(qa."answers") = 'object' THEN qa."answers" ELSE '{}'::jsonb END)
    WITH ORDINALITY AS kv(key, value, ord)
) AS ans
JOIN "student_evaluation_attempts" AS t ON t."id" = qa."id"
JOIN "evaluation_questions" AS q ON q."evaluation_id" = qa."quizId" AND q."legacy_ref" = ans.question_ref
LEFT JOIN "evaluation_question_options" AS o ON o."question_id" = q."id" AND o."legacy_ref" = ans.option_ref
ORDER BY qa."id", q."id", ans.ord
ON CONFLICT ("attempt_id", "question_id") DO NOTHING;

-- ============================================================
-- 9. activity_submissions -> student_evaluation_attempts
-- ============================================================
-- DRAFT -> IN_PROGRESS, SUBMITTED -> PENDING_REVIEW, LATE -> PENDING_REVIEW (is_late),
-- GRADED -> GRADED. grade = round(5 * score / maxScore, 1) only when both are present.
-- content, teacher feedback, grader, gradedAt, original status and groupId stay in legacy_payload.
INSERT INTO "student_evaluation_attempts" (
  "id", "evaluation_id", "assignment_id", "user_id", "attempt_number", "status", "started_at", "submitted_at",
  "deadline_at", "score", "max_score", "grade", "grade_published_at", "is_late", "legacy_source", "legacy_payload",
  "created_at", "updated_at"
)
SELECT
  s."id",
  s."activityId",
  ea."id",
  s."userId",
  1,
  (CASE s."status"::text
    WHEN 'DRAFT' THEN 'IN_PROGRESS'
    WHEN 'GRADED' THEN 'GRADED'
    ELSE 'PENDING_REVIEW'
  END)::"EvaluationAttemptStatus",
  s."createdAt" AT TIME ZONE 'UTC',
  s."submittedAt" AT TIME ZONE 'UTC',
  NULL,
  s."score",
  s."maxScore",
  CASE WHEN s."score" IS NOT NULL AND s."maxScore" > 0
    THEN ROUND((5 * s."score" / s."maxScore")::numeric, 1)::double precision END,
  s."gradedAt" AT TIME ZONE 'UTC',
  s."status"::text = 'LATE',
  'activity_submission',
  jsonb_build_object(
    'content', s."content",
    'feedback', s."feedback",
    'gradedBy', s."gradedBy",
    'gradedAt', s."gradedAt",
    'status', s."status"::text,
    'groupId', s."groupId"
  ),
  s."createdAt" AT TIME ZONE 'UTC',
  s."updatedAt" AT TIME ZONE 'UTC'
FROM "activity_submissions" AS s
LEFT JOIN "activity_assignments" AS aa ON aa."activityId" = s."activityId" AND aa."groupId" = s."groupId"
LEFT JOIN "evaluation_assignments" AS ea ON ea."id" = aa."id"
ON CONFLICT ("id") DO NOTHING;

COMMIT;
