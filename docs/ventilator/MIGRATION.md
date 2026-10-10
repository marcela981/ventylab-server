# Migration `20261010120000_ventilator_features`

Folder: `prisma/migrations/20261010120000_ventilator_features/migration.sql`. **Not applied.** `*.sql` is gitignored in this repository, so the file must be committed with `git add -f`.

## How it was generated

- The schema part was produced **offline** with `prisma migrate diff` (schema to schema, no database connection); the data copy at the end was written by hand.
- `prisma migrate dev` was **not** used: it connects to the database of `DATABASE_URL`, which is the shared Supabase database, and would also act on the earlier migrations that are still pending there (it may even propose a reset). Those pending folders, listed in the `odd/tasks/*.md` feature documents, are, in order: `20261004120000_add_audit_and_error_logs`, `20261005120000_learning_features`, `20261006120000_identity_features`, `20261007120000_evaluation_feature`, `20261008120000_ai_features`, `20261009120000_simulation_features`.
- `npx prisma validate` passes, with 4 pre-existing `SetNull`-on-required-field warnings that do not come from this migration.

## Full SQL

```sql
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
```

## Line-by-line risk review

| Statement | Effect | Risk |
| --- | --- | --- |
| `CREATE TYPE "ReservationHolderType"`, `"ReservationLifecycleStatus"`, `"VentilatorCommandStatus"` | New enums. | None (additive). Fails only if a type with the same name already exists. |
| `CREATE TABLE "reservations"` | New table. Ids are `TEXT` (UUID v7 generated in the domain for new rows, legacy cuids for copied rows); timestamps `TIMESTAMPTZ(6)`. | Additive. `holder_type` is not checked against `user_id`/`group_id` by a constraint (the domain enforces it; query 6 checks it). There is no exclusion constraint against overlaps: overlaps are prevented by the advisory lock in the use cases. |
| `CREATE TABLE "ventilator_commands"` | Command history (`params` JSONB, encoding, encoded payload, status, timestamps, latency). | Additive. |
| `CREATE TABLE "telemetry_chunks"` | Compressed recording chunks (`BYTEA`). | Additive. Rows can be large; recording is off by default. |
| 6 × `CREATE INDEX` | Calendar range, active lookup, per group, per user, command history, recording order. | Built on empty tables before the data copy, so cheap; no lock on existing tables. |
| FK `reservations.user_id`, `group_id`, `created_by_id` with `ON DELETE RESTRICT` | A user or group referenced by any reservation, history included, can no longer be deleted physically. | **Behaviour change.** In the legacy table `userId` cascaded and `groupId` was set to null. Physical user deletion paths now fail with a foreign key error for anyone who ever reserved; the group delete guard already counts `reservations` and blocks the delete. Soft deactivation is unaffected. |
| FK `reservations.preempted_by_id` with `ON DELETE SET NULL` | Deleting the preempting user keeps the reservation. | None. |
| FK `ventilator_commands.reservation_id`, `user_id` with `ON DELETE RESTRICT` | Commands block deletion of their reservation and their user. | Same behaviour change as above. The application never deletes reservations. |
| FK `telemetry_chunks.reservation_id` with `ON DELETE CASCADE` | Recordings follow their reservation. | None. |
| `INSERT INTO "reservations" … SELECT … FROM "ventilator_reservations" … ON CONFLICT ("id") DO NOTHING` | Copies every legacy row. Idempotent: running it again inserts nothing. | See the data copy notes. |

### Data copy notes

- **Holder.** A legacy row with `groupId` becomes a `GROUP` holder with `user_id` null; otherwise a `USER` holder with `user_id = userId`. `created_by_id` is always the legacy `userId`. `leaderId`, `userRole`, `deviceId`, `durationMinutes` and `cancelReason` are not copied; they stay in the frozen legacy table.
- **Status.** `ACTIVE` → `SCHEDULED` keeping `endTime`; `CANCELLED` → `CANCELLED`; `COMPLETED` and `EXPIRED` → `COMPLETED`. The last three end at `COALESCE(releasedAt, endTime)`.
- **Stale `ACTIVE` rows.** The legacy flow had no expiry job, so an `ACTIVE` row whose `endTime` already passed becomes a `SCHEDULED` row in the past. It is never active (`starts_at <= now < ends_at` is false) and does not count toward the upcoming limits (`ends_at > now`), but history views show it as `SCHEDULED`. Query 7 counts them.
- **Overlaps.** Overlapping legacy `ACTIVE` rows would be copied as overlapping `SCHEDULED` rows; the invariant is not retroactive. Query 4 finds them.
- **Time zones.** The legacy columns are `timestamp(3)` without time zone holding UTC (what Prisma writes). `x AT TIME ZONE 'UTC'` reads them as UTC and returns `timestamptz`, so the instants are preserved whatever the session `TimeZone` is. A legacy row written in local time by another tool would shift; none is known.
- **Transaction.** The file has no explicit `BEGIN`/`COMMIT`. Do not rely on a partial failure being rolled back: if a statement fails, `prisma migrate deploy` records the migration as failed, the objects already created must be dropped by hand, and then `npx prisma migrate resolve --rolled-back 20261010120000_ventilator_features` clears it. Wrapping the file in `BEGIN; … COMMIT;` before applying avoids this (DDL is transactional in PostgreSQL).
- **Order.** The copy reads `ventilator_reservations` columns `"userId"`, `"groupId"`, `"status"`, `"startTime"`, `"endTime"`, `"releasedAt"`, `"purpose"`, `"createdAt"`, `"updatedAt"`. `20261006120000_identity_features` only changes that table's `"userRole"` enum and `20261009120000_simulation_features` leaves it untouched, so the copy works after them.

## Apply steps (author)

1. Back up the database (earlier features keep dumps in `../_backups-neon/`).
2. Review this file and, preferably, wrap it in `BEGIN; … COMMIT;`.
3. Run query 1 below and keep the output.
4. Make sure the earlier pending migrations are ready: `20261006120000_identity_features` aborts until `<SUPERADMIN_EMAIL>` is replaced in its file (see `odd/tasks/identity-features.md`); several earlier migrations have a `verification.sql` with a part A to run before applying. `migrate deploy` applies every pending folder in name order, so this migration runs last.
5. Apply. `prisma/schema.prisma` declares `directUrl = env("DIRECT_URL")`, so Prisma Migrate uses the direct (non-pooled) connection when `DIRECT_URL` is set:

   ```bash
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```

6. Run the verification queries below and compare with step 3.
7. Run the PostgreSQL concurrency test (20 concurrent creates of one slot, expects exactly one):

   ```bash
   RUN_DB_INTEGRATION=1 npx jest --testRegex 'reservations-concurrency\.integration-spec\.ts$'
   ```

## Verification queries

```sql
-- 1. Legacy rows by status (before and after; must not change)
SELECT "status", COUNT(*) FROM "ventilator_reservations" GROUP BY "status" ORDER BY 1;

-- 2. Copied rows by status: SCHEDULED = legacy ACTIVE, CANCELLED = legacy CANCELLED, COMPLETED = legacy COMPLETED + EXPIRED
SELECT "status", COUNT(*) FROM "reservations" GROUP BY "status" ORDER BY 1;

-- 3. Every legacy row was copied (expected 0)
SELECT COUNT(*) FROM "ventilator_reservations" vr LEFT JOIN "reservations" r ON r."id" = vr."id" WHERE r."id" IS NULL;

-- 4. Overlapping SCHEDULED reservations (expected no rows)
SELECT a."id", b."id" FROM "reservations" a JOIN "reservations" b ON a."id" < b."id"
WHERE a."status" = 'SCHEDULED' AND b."status" = 'SCHEDULED' AND a."starts_at" < b."ends_at" AND b."starts_at" < a."ends_at";

-- 5. Start instants preserved (expected 0)
SELECT COUNT(*) FROM "ventilator_reservations" vr JOIN "reservations" r ON r."id" = vr."id"
WHERE r."starts_at" <> vr."startTime" AT TIME ZONE 'UTC';

-- 6. Holder consistency (expected 0)
SELECT COUNT(*) FROM "reservations"
WHERE ("holder_type" = 'GROUP' AND ("group_id" IS NULL OR "user_id" IS NOT NULL))
   OR ("holder_type" = 'USER' AND ("user_id" IS NULL OR "group_id" IS NOT NULL));

-- 7. SCHEDULED rows already in the past (informational)
SELECT COUNT(*) FROM "reservations" WHERE "status" = 'SCHEDULED' AND "ends_at" <= now();
```
