-- CreateTable
CREATE TABLE "page_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_progress_userId_idx" ON "page_progress"("userId");

-- CreateIndex
CREATE INDEX "page_progress_pageId_idx" ON "page_progress"("pageId");

-- CreateIndex
CREATE INDEX "page_progress_completed_idx" ON "page_progress"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "page_progress_userId_pageId_key" ON "page_progress"("userId", "pageId");

-- AddForeignKey
ALTER TABLE "page_progress" ADD CONSTRAINT "page_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_progress" ADD CONSTRAINT "page_progress_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
