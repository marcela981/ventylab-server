-- CreateEnum
CREATE TYPE "LearningActivityKind" AS ENUM ('PAGE_VIEWED', 'LESSON_COMPLETED', 'MODULE_COMPLETED', 'EVALUATION_PASSED', 'ACHIEVEMENT_UNLOCKED');

-- CreateTable
CREATE TABLE "learning_activity_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "LearningActivityKind" NOT NULL,
    "ref_id" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "local_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_days" (
    "user_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,
    "event_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_activity_days_pkey" PRIMARY KEY ("user_id","local_date")
);

-- CreateIndex
CREATE INDEX "learning_activity_events_user_id_occurred_at_idx" ON "learning_activity_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "learning_activity_events_user_id_local_date_idx" ON "learning_activity_events"("user_id", "local_date");

-- CreateIndex
CREATE UNIQUE INDEX "learning_activity_events_user_id_kind_ref_id_key" ON "learning_activity_events"("user_id", "kind", "ref_id");

-- AddForeignKey
ALTER TABLE "learning_activity_events" ADD CONSTRAINT "learning_activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_days" ADD CONSTRAINT "user_activity_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

