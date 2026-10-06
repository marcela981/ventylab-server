-- DropForeignKey
ALTER TABLE "activity_submissions" DROP CONSTRAINT "activity_submissions_groupId_fkey";

-- AlterTable
ALTER TABLE "activity_submissions" ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
