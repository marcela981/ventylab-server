-- CreateEnum
CREATE TYPE "AiRatingSurface" AS ENUM ('POPUP', 'ACCORDION', 'ASSISTANT', 'NOTES_ANALYSIS');

-- CreateEnum
CREATE TYPE "AiRatingScope" AS ENUM ('LESSON', 'MODULE', 'PAGE', 'FREE');

-- AlterEnum
ALTER TYPE "AiUseCase" ADD VALUE 'MODULE_QA';

-- AlterTable
ALTER TABLE "ai_ratings" ADD COLUMN     "scope" "AiRatingScope",
ADD COLUMN     "surface" "AiRatingSurface";

