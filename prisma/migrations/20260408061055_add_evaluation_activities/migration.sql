-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EXAM', 'QUIZ', 'WORKSHOP', 'TALLER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED', 'LATE');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "blocks" JSONB,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "color" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "color" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "ventilator_reservations" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "leaderId" TEXT;

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "type" "ActivityType" NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "timeLimit" INTEGER,
    "dueDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_assignments" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "visibleFrom" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_submissions" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentGroupId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "simulatorLeaderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxStudents" INTEGER,
    "enrollmentCode" TEXT,
    "semester" TEXT,
    "academicYear" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "graderId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "entityId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_createdBy_idx" ON "activities"("createdBy");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_isPublished_isActive_idx" ON "activities"("isPublished", "isActive");

-- CreateIndex
CREATE INDEX "activities_dueDate_idx" ON "activities"("dueDate");

-- CreateIndex
CREATE INDEX "activity_assignments_activityId_idx" ON "activity_assignments"("activityId");

-- CreateIndex
CREATE INDEX "activity_assignments_groupId_idx" ON "activity_assignments"("groupId");

-- CreateIndex
CREATE INDEX "activity_assignments_assignedBy_idx" ON "activity_assignments"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "activity_assignments_activityId_groupId_key" ON "activity_assignments"("activityId", "groupId");

-- CreateIndex
CREATE INDEX "activity_submissions_activityId_idx" ON "activity_submissions"("activityId");

-- CreateIndex
CREATE INDEX "activity_submissions_userId_idx" ON "activity_submissions"("userId");

-- CreateIndex
CREATE INDEX "activity_submissions_groupId_idx" ON "activity_submissions"("groupId");

-- CreateIndex
CREATE INDEX "activity_submissions_status_idx" ON "activity_submissions"("status");

-- CreateIndex
CREATE INDEX "activity_submissions_gradedBy_idx" ON "activity_submissions"("gradedBy");

-- CreateIndex
CREATE UNIQUE INDEX "activity_submissions_activityId_userId_key" ON "activity_submissions"("activityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_enrollmentCode_key" ON "groups"("enrollmentCode");

-- CreateIndex
CREATE INDEX "groups_parentGroupId_idx" ON "groups"("parentGroupId");

-- CreateIndex
CREATE INDEX "groups_depth_idx" ON "groups"("depth");

-- CreateIndex
CREATE INDEX "groups_isActive_idx" ON "groups"("isActive");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "scores_userId_idx" ON "scores"("userId");

-- CreateIndex
CREATE INDEX "scores_graderId_idx" ON "scores"("graderId");

-- CreateIndex
CREATE INDEX "scores_entityType_entityId_idx" ON "scores"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "scores_graderId_userId_entityType_entityId_key" ON "scores"("graderId", "userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "levels_parentId_idx" ON "levels"("parentId");

-- CreateIndex
CREATE INDEX "ventilator_reservations_groupId_idx" ON "ventilator_reservations"("groupId");

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventilator_reservations" ADD CONSTRAINT "ventilator_reservations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventilator_reservations" ADD CONSTRAINT "ventilator_reservations_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_assignments" ADD CONSTRAINT "activity_assignments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_assignments" ADD CONSTRAINT "activity_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_assignments" ADD CONSTRAINT "activity_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_simulatorLeaderId_fkey" FOREIGN KEY ("simulatorLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_graderId_fkey" FOREIGN KEY ("graderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
