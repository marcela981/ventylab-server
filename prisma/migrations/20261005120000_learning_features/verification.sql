-- ============================================================
-- verification.sql for migration 20261005120000_learning_features
-- Read-only. Never applied by Prisma (only migration.sql is).
--
-- PART A uses only pre-existing columns: run it BEFORE and AFTER applying.
-- PART B uses the new tables/columns: run it AFTER applying only
-- (before, it fails with "column/relation does not exist").
-- ============================================================

-- ============================================================
-- PART A: BEFORE and AFTER
-- ============================================================

-- A1. Row counts (must be identical before and after)
SELECT 'levels' AS "table", COUNT(*) AS "rows" FROM "levels"
UNION ALL SELECT 'modules', COUNT(*) FROM "modules"
UNION ALL SELECT 'lessons', COUNT(*) FROM "lessons"
UNION ALL SELECT 'pages', COUNT(*) FROM "pages"
UNION ALL SELECT 'page_sections', COUNT(*) FROM "page_sections"
UNION ALL SELECT 'steps', COUNT(*) FROM "steps"
UNION ALL SELECT 'lesson_completions', COUNT(*) FROM "lesson_completions"
UNION ALL SELECT 'lesson_completions (completed)', COUNT(*) FROM "lesson_completions" WHERE "isCompleted" = true
UNION ALL SELECT 'user_progress', COUNT(*) FROM "user_progress"
UNION ALL SELECT 'page_progress', COUNT(*) FROM "page_progress";

-- A2. Expected status distribution, derived from the legacy flags
SELECT 'levels' AS "table",
       CASE WHEN "isActive" = false THEN 'ARCHIVED' ELSE 'PUBLISHED' END AS "expected_status",
       COUNT(*) AS "rows"
FROM "levels" GROUP BY 2
UNION ALL
SELECT 'modules', CASE WHEN "isActive" = false THEN 'ARCHIVED' ELSE 'PUBLISHED' END, COUNT(*)
FROM "modules" GROUP BY 2
UNION ALL
SELECT 'lessons', CASE WHEN "isActive" = false THEN 'ARCHIVED' ELSE 'PUBLISHED' END, COUNT(*)
FROM "lessons" GROUP BY 2
UNION ALL
SELECT 'pages',
       CASE WHEN "isActive" = false THEN 'ARCHIVED' WHEN "isPublished" = false THEN 'DRAFT' ELSE 'PUBLISHED' END,
       COUNT(*)
FROM "pages" GROUP BY 2
ORDER BY 1, 2;

-- A3. Level.track values (anything other than mecanica/ventylab will keep sectionId NULL)
SELECT "track", COUNT(*) AS "levels" FROM "levels" GROUP BY "track" ORDER BY "track";

-- A4. Page -> lesson backfill forecast
SELECT
  CASE
    WHEN l_legacy."id" IS NOT NULL THEN '1_legacyLessonId'
    WHEN l_slug."id" IS NOT NULL THEN '2_slug_same_module'
    ELSE '3_unmatched'
  END AS "match_rule",
  COUNT(*) AS "pages"
FROM "pages" AS p
LEFT JOIN "lessons" AS l_legacy ON l_legacy."id" = p."legacyLessonId"
LEFT JOIN "lessons" AS l_slug ON l_slug."moduleId" = p."moduleId" AND l_slug."slug" = p."slug"
GROUP BY 1
ORDER BY 1;

-- A5. Pages whose legacyLessonId points to a lesson in a different module (review manually)
SELECT p."id", p."moduleId" AS "page_module", l."moduleId" AS "lesson_module", p."slug", p."legacyLessonId"
FROM "pages" AS p
JOIN "lessons" AS l ON l."id" = p."legacyLessonId"
WHERE l."moduleId" <> p."moduleId";

-- ============================================================
-- PART B: AFTER only
-- ============================================================

-- B1. New tables
SELECT 'sections' AS "table", COUNT(*) AS "rows" FROM "sections"
UNION ALL SELECT 'media', COUNT(*) FROM "media"
UNION ALL SELECT 'notes', COUNT(*) FROM "notes";

SELECT "id", "slug", "title", "order", "status" FROM "sections" ORDER BY "order";

-- B2. Actual status distribution (compare with A2)
SELECT 'levels' AS "table", "status"::text, COUNT(*) AS "rows" FROM "levels" GROUP BY 2
UNION ALL SELECT 'modules', "status"::text, COUNT(*) FROM "modules" GROUP BY 2
UNION ALL SELECT 'lessons', "status"::text, COUNT(*) FROM "lessons" GROUP BY 2
UNION ALL SELECT 'pages', "status"::text, COUNT(*) FROM "pages" GROUP BY 2
ORDER BY 1, 2;

-- B3. Pages still without lessonId after the backfill
SELECT "id", "moduleId", "slug", "legacyLessonId"
FROM "pages"
WHERE "lessonId" IS NULL
ORDER BY "moduleId", "order";

-- B4. Lessons with zero pages (need authoring)
SELECT l."id", l."moduleId", l."slug", l."title", l."status"
FROM "lessons" AS l
WHERE NOT EXISTS (SELECT 1 FROM "pages" AS p WHERE p."lessonId" = l."id")
ORDER BY l."moduleId", l."order";

-- B5. Levels without section
SELECT "id", "title", "track"
FROM "levels"
WHERE "sectionId" IS NULL
ORDER BY "order";

-- B6. Levels per section
SELECT s."slug", COUNT(lv."id") AS "levels"
FROM "sections" AS s
LEFT JOIN "levels" AS lv ON lv."sectionId" = s."id"
GROUP BY s."slug"
ORDER BY s."slug";
