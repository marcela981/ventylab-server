-- CreateEnum
CREATE TYPE "ReservationHolderType" AS ENUM ('USER', 'GROUP');

-- CreateEnum
CREATE TYPE "ReservationLifecycleStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'PREEMPTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VentilatorCommandStatus" AS ENUM ('PENDING', 'SENT', 'ACKED', 'APPLIED', 'REJECTED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "holder_type" "ReservationHolderType" NOT NULL,
    "user_id" TEXT,
    "group_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "ReservationLifecycleStatus" NOT NULL,
    "purpose" TEXT,
    "preempted_by_id" TEXT,
    "preempted_reason" TEXT,
    "replaced_by_reservation_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventilator_commands" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "encoding" TEXT NOT NULL,
    "encoded_payload" TEXT NOT NULL,
    "status" "VentilatorCommandStatus" NOT NULL,
    "reject_reason" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "latency_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ventilator_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_chunks" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "start_ts" TIMESTAMPTZ(6) NOT NULL,
    "end_ts" TIMESTAMPTZ(6) NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "sample_rate_hz" INTEGER NOT NULL,
    "encoding" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "telemetry_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_starts_at_ends_at_idx" ON "reservations"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "reservations_status_starts_at_idx" ON "reservations"("status", "starts_at");

-- CreateIndex
CREATE INDEX "reservations_group_id_idx" ON "reservations"("group_id");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "ventilator_commands_reservation_id_sent_at_idx" ON "ventilator_commands"("reservation_id", "sent_at");

-- CreateIndex
CREATE INDEX "telemetry_chunks_reservation_id_start_ts_idx" ON "telemetry_chunks"("reservation_id", "start_ts");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_preempted_by_id_fkey" FOREIGN KEY ("preempted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventilator_commands" ADD CONSTRAINT "ventilator_commands_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventilator_commands" ADD CONSTRAINT "ventilator_commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_chunks" ADD CONSTRAINT "telemetry_chunks_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data migration: copy legacy ventilator_reservations rows into reservations (idempotent, legacy cuid ids preserved).
-- ACTIVE -> SCHEDULED keeping its end time; EXPIRED/COMPLETED -> COMPLETED and CANCELLED -> CANCELLED ending at COALESCE("releasedAt", "endTime").
-- Legacy columns are timestamp without time zone holding UTC, so they are converted explicitly.
-- A legacy row with a group becomes a GROUP holder without user_id; created_by_id keeps the legacy "userId"; "leaderId" is not mapped.
INSERT INTO "reservations" (
    "id",
    "holder_type",
    "user_id",
    "group_id",
    "created_by_id",
    "starts_at",
    "ends_at",
    "status",
    "purpose",
    "created_at",
    "updated_at"
)
SELECT
    vr."id",
    CASE WHEN vr."groupId" IS NOT NULL THEN 'GROUP'::"ReservationHolderType" ELSE 'USER'::"ReservationHolderType" END,
    CASE WHEN vr."groupId" IS NOT NULL THEN NULL ELSE vr."userId" END,
    vr."groupId",
    vr."userId",
    vr."startTime" AT TIME ZONE 'UTC',
    (CASE WHEN vr."status" = 'ACTIVE' THEN vr."endTime" ELSE COALESCE(vr."releasedAt", vr."endTime") END) AT TIME ZONE 'UTC',
    CASE vr."status"
        WHEN 'ACTIVE' THEN 'SCHEDULED'::"ReservationLifecycleStatus"
        WHEN 'CANCELLED' THEN 'CANCELLED'::"ReservationLifecycleStatus"
        ELSE 'COMPLETED'::"ReservationLifecycleStatus"
    END,
    vr."purpose",
    vr."createdAt" AT TIME ZONE 'UTC',
    vr."updatedAt" AT TIME ZONE 'UTC'
FROM "ventilator_reservations" vr
ON CONFLICT ("id") DO NOTHING;
