-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('THEORY', 'EXERCISE', 'CASE_STUDY', 'SIMULATION', 'VIDEO');

-- CreateEnum
CREATE TYPE "ContentDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('INTRODUCTION', 'THEORY', 'CASE_STUDY', 'SUMMARY', 'EXERCISE', 'QUIZ', 'REFERENCES', 'TEXT', 'IMAGE', 'VIDEO', 'EQUATION', 'CALLOUT', 'CODE', 'DIVIDER');

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PageType" NOT NULL DEFAULT 'THEORY',
    "description" TEXT,
    "difficulty" "ContentDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "bloomLevel" TEXT,
    "estimatedMinutes" INTEGER,
    "learningObjectives" TEXT[],
    "prerequisites" TEXT[],
    "keyTakeaways" TEXT[],
    "tags" TEXT[],
    "hasRequiredQuiz" BOOLEAN NOT NULL DEFAULT false,
    "minQuizScore" DOUBLE PRECISION,
    "aiConfig" JSONB,
    "resources" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "legacyLessonId" TEXT,
    "legacyJsonId" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "sectionId" TEXT,
    "estimatedTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_revisions" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PageType" NOT NULL,
    "sectionsSnapshot" JSONB NOT NULL,
    "changeLog" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_legacyLessonId_key" ON "pages"("legacyLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_legacyJsonId_key" ON "pages"("legacyJsonId");

-- CreateIndex
CREATE INDEX "pages_moduleId_idx" ON "pages"("moduleId");

-- CreateIndex
CREATE INDEX "pages_type_idx" ON "pages"("type");

-- CreateIndex
CREATE INDEX "pages_isActive_isPublished_idx" ON "pages"("isActive", "isPublished");

-- CreateIndex
CREATE INDEX "pages_legacyLessonId_idx" ON "pages"("legacyLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_moduleId_slug_key" ON "pages"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_moduleId_order_key" ON "pages"("moduleId", "order");

-- CreateIndex
CREATE INDEX "page_sections_pageId_idx" ON "page_sections"("pageId");

-- CreateIndex
CREATE INDEX "page_sections_type_idx" ON "page_sections"("type");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_pageId_order_key" ON "page_sections"("pageId", "order");

-- CreateIndex
CREATE INDEX "page_revisions_pageId_idx" ON "page_revisions"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "page_revisions_pageId_version_key" ON "page_revisions"("pageId", "version");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
