-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "track" TEXT NOT NULL DEFAULT 'mecanica';

-- CreateIndex
CREATE INDEX "levels_track_idx" ON "levels"("track");
