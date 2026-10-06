-- ============================================================
-- Migration: learning_features
-- Part 1 (structure) was generated offline with
--   prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script
-- Part 2 (data) was written by hand and is idempotent.
--
-- Transaction: Prisma 6 does not wrap a migration file in a transaction
-- by itself, so the whole file is wrapped in an explicit BEGIN/COMMIT.
-- Any failure rolls back both structure and data. ALTER TYPE ... ADD VALUE
-- is allowed inside a transaction on PostgreSQL 12+, as long as the new
-- value ('FILE') is not used in the same transaction; this file never uses it.
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: STRUCTURE (generated)
-- ============================================================
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- AlterEnum
ALTER TYPE "SectionType" ADD VALUE 'FILE';

-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "lessonId" TEXT,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "page_sections" ADD COLUMN     "mediaId" TEXT;

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "page_id" TEXT,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sections_slug_key" ON "sections"("slug");

-- CreateIndex
CREATE INDEX "sections_order_idx" ON "sections"("order");

-- CreateIndex
CREATE INDEX "sections_status_idx" ON "sections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");

-- CreateIndex
CREATE INDEX "media_owner_id_idx" ON "media"("owner_id");

-- CreateIndex
CREATE INDEX "notes_user_id_lesson_id_idx" ON "notes"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "notes_user_id_created_at_idx" ON "notes"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notes_page_id_idx" ON "notes"("page_id");

-- CreateIndex
CREATE INDEX "levels_status_idx" ON "levels"("status");

-- CreateIndex
CREATE INDEX "levels_sectionId_idx" ON "levels"("sectionId");

-- CreateIndex
CREATE INDEX "modules_status_idx" ON "modules"("status");

-- CreateIndex
CREATE INDEX "module_prerequisites_prerequisiteId_idx" ON "module_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "user_progress_lastAccessedLessonId_idx" ON "user_progress"("lastAccessedLessonId");

-- CreateIndex
CREATE INDEX "pages_lessonId_idx" ON "pages"("lessonId");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE INDEX "pages_createdBy_idx" ON "pages"("createdBy");

-- CreateIndex
CREATE INDEX "pages_updatedBy_idx" ON "pages"("updatedBy");

-- CreateIndex
CREATE INDEX "page_sections_mediaId_idx" ON "page_sections"("mediaId");

-- CreateIndex
CREATE INDEX "page_revisions_changedBy_idx" ON "page_revisions"("changedBy");

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- ============================================================
-- PART 2: DATA MIGRATION (hand-written, idempotent)
-- ============================================================

-- 2.1 Status backfill: Level, Module, Lesson (isActive = false -> ARCHIVED)
UPDATE "levels"
SET "status" = CASE WHEN "isActive" = false THEN 'ARCHIVED'::"ContentStatus" ELSE 'PUBLISHED'::"ContentStatus" END;

UPDATE "modules"
SET "status" = CASE WHEN "isActive" = false THEN 'ARCHIVED'::"ContentStatus" ELSE 'PUBLISHED'::"ContentStatus" END;

UPDATE "lessons"
SET "status" = CASE WHEN "isActive" = false THEN 'ARCHIVED'::"ContentStatus" ELSE 'PUBLISHED'::"ContentStatus" END;

-- 2.2 Status backfill: Page (inactive -> ARCHIVED, unpublished -> DRAFT, else PUBLISHED)
UPDATE "pages"
SET "status" = CASE
  WHEN "isActive" = false THEN 'ARCHIVED'::"ContentStatus"
  WHEN "isPublished" = false THEN 'DRAFT'::"ContentStatus"
  ELSE 'PUBLISHED'::"ContentStatus"
END;

-- 2.3 Sections from Level.track (deterministic ids, safe to re-run)
INSERT INTO "sections" ("id", "slug", "title", "description", "order", "status", "created_at", "updated_at")
VALUES
  ('section-mecanica', 'mecanica', 'Mecánica ventilatoria', NULL, 0, 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('section-ventylab', 'ventylab', 'VentyLab', NULL, 1, 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- 2.4 Level.sectionId from Level.track (exact match only; unknown tracks stay NULL
--     and are listed by verification.sql)
UPDATE "levels" AS lv
SET "sectionId" = s."id"
FROM "sections" AS s
WHERE lv."sectionId" IS NULL
  AND s."slug" = lv."track";

-- 2.5 Page.lessonId, step 1: legacyLessonId -> lessons.id
UPDATE "pages" AS p
SET "lessonId" = l."id"
FROM "lessons" AS l
WHERE p."lessonId" IS NULL
  AND p."legacyLessonId" = l."id";

-- 2.6 Page.lessonId, step 2: pages.slug -> lessons.slug, only within the page's
--     own module and only when exactly one lesson matches. Remaining rows stay NULL.
UPDATE "pages" AS p
SET "lessonId" = m."lesson_id"
FROM (
  SELECT p2."id" AS "page_id", MIN(l."id") AS "lesson_id"
  FROM "pages" AS p2
  JOIN "lessons" AS l
    ON l."moduleId" = p2."moduleId"
   AND l."slug" = p2."slug"
  WHERE p2."lessonId" IS NULL
  GROUP BY p2."id"
  HAVING COUNT(*) = 1
) AS m
WHERE p."id" = m."page_id"
  AND p."lessonId" IS NULL;

COMMIT;
