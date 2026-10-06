-- ============================================================
-- Migration: identity_features
-- Structure was generated offline with
--   prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script
-- and hand-edited so that the whole file is lossless:
--   1. SUPERUSER ids are snapshotted into audit_logs BEFORE the enum fold.
--   2. The UserRole enum is recreated without SUPERUSER; SUPERUSER rows become ADMIN.
--   3. New columns, tables and indexes (generated).
--   4. Data backfills (hand-written, idempotent).
--   5. app_settings 'superadmin_email' row (REPLACE THE PLACEHOLDER BEFORE APPLYING).
--   6. protect_superadmin() trigger on users (created after every backfill).
--
-- Transaction: Prisma 6 does not wrap a migration file in a transaction by
-- itself, so the whole file is wrapped in an explicit BEGIN/COMMIT (the
-- BEGIN/COMMIT that migrate diff emits around the enum change was removed).
-- Any failure rolls back structure and data together.
--
-- Requires PostgreSQL 13+ (gen_random_uuid() is built in).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. SNAPSHOT: SUPERUSER -> ADMIN fold, recorded in audit_logs
-- ============================================================
-- Same shape the app writes for a role change (action 'user_role_changed' uses
-- metadata.changes.role.before/after); a dedicated action keeps it searchable.
INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "description", "performed_by_user_id", "performed_at", "metadata")
SELECT
  gen_random_uuid()::text,
  'users',
  'user',
  u."id",
  'role_folded_superuser_to_admin',
  'Migration 20261006120000_identity_features folded role SUPERUSER into ADMIN',
  NULL,
  CURRENT_TIMESTAMP,
  jsonb_build_object(
    'changes', jsonb_build_object('role', jsonb_build_object('before', 'SUPERUSER', 'after', 'ADMIN')),
    'email', u."email",
    'source', 'migration:20261006120000_identity_features'
  )
FROM "users" AS u
WHERE u."role"::text = 'SUPERUSER';

-- ventilator_reservations."userRole" is a role snapshot of the same enum.
INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "description", "performed_by_user_id", "performed_at", "metadata")
SELECT
  gen_random_uuid()::text,
  'ventilator_reservations',
  'ventilator_reservation',
  r."id",
  'role_folded_superuser_to_admin',
  'Migration 20261006120000_identity_features folded userRole snapshot SUPERUSER into ADMIN',
  NULL,
  CURRENT_TIMESTAMP,
  jsonb_build_object(
    'changes', jsonb_build_object('userRole', jsonb_build_object('before', 'SUPERUSER', 'after', 'ADMIN')),
    'userId', r."userId",
    'source', 'migration:20261006120000_identity_features'
  )
FROM "ventilator_reservations" AS r
WHERE r."userRole"::text = 'SUPERUSER';

-- ============================================================
-- 2. ENUM FOLD: UserRole without SUPERUSER (generated, USING clause hand-edited)
-- ============================================================
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new"
  USING (CASE WHEN "role"::text = 'SUPERUSER' THEN 'ADMIN' ELSE "role"::text END)::"UserRole_new";
ALTER TABLE "ventilator_reservations" ALTER COLUMN "userRole" TYPE "UserRole_new"
  USING (CASE WHEN "userRole"::text = 'SUPERUSER' THEN 'ADMIN' ELSE "userRole"::text END)::"UserRole_new";
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- ============================================================
-- 3. STRUCTURE (generated)
-- ============================================================
-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "GroupMembershipRole" AS ENUM ('LEADER', 'MEMBER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "refreshTokensRevokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "type" "GroupType" NOT NULL DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "group_members" ADD COLUMN     "memberRole" "GroupMembershipRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "group_supervisions" (
    "teacherGroupId" TEXT NOT NULL,
    "studentGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_supervisions_pkey" PRIMARY KEY ("teacherGroupId","studentGroupId")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "group_supervisions_studentGroupId_idx" ON "group_supervisions"("studentGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- AddForeignKey
ALTER TABLE "group_supervisions" ADD CONSTRAINT "group_supervisions_teacherGroupId_fkey" FOREIGN KEY ("teacherGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_supervisions" ADD CONSTRAINT "group_supervisions_studentGroupId_fkey" FOREIGN KEY ("studentGroupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 4. DATA BACKFILLS (hand-written, idempotent)
-- ============================================================

-- 4.1 users."googleId" from accounts (provider = 'google'), only when the user has
--     exactly one google account and that providerAccountId belongs to no other user.
UPDATE "users" AS u
SET "googleId" = a."providerAccountId"
FROM (
  SELECT "userId", MIN("providerAccountId") AS "providerAccountId"
  FROM "accounts"
  WHERE "provider" = 'google'
  GROUP BY "userId"
  HAVING COUNT(*) = 1
) AS a
WHERE u."id" = a."userId"
  AND u."googleId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "accounts" AS a2
    WHERE a2."provider" = 'google'
      AND a2."providerAccountId" = a."providerAccountId"
      AND a2."userId" <> a."userId"
  );

-- 4.2 Leaders that are not members of their group get a membership row
--     (legacy role derived from the user's role). Each inserted row is recorded
--     in audit_logs so verification.sql can list them after the fact.
WITH "inserted" AS (
  INSERT INTO "group_members" ("id", "groupId", "userId", "role", "memberRole", "joinedAt")
  SELECT
    gen_random_uuid()::text,
    g."id",
    g."simulatorLeaderId",
    CASE WHEN u."role" = 'STUDENT' THEN 'STUDENT' ELSE 'TEACHER' END,
    'LEADER',
    CURRENT_TIMESTAMP
  FROM "groups" AS g
  JOIN "users" AS u ON u."id" = g."simulatorLeaderId"
  WHERE NOT EXISTS (
    SELECT 1 FROM "group_members" AS gm
    WHERE gm."groupId" = g."id" AND gm."userId" = g."simulatorLeaderId"
  )
  ON CONFLICT ("groupId", "userId") DO NOTHING
  RETURNING "id", "groupId", "userId", "role"
)
INSERT INTO "audit_logs" ("id", "entity_collection", "entity_type", "entity_id", "action", "description", "performed_by_user_id", "performed_at", "metadata")
SELECT
  gen_random_uuid()::text,
  'group_members',
  'group_member',
  i."id",
  'leader_membership_backfilled',
  'Migration 20261006120000_identity_features added the simulator leader as a group member',
  NULL,
  CURRENT_TIMESTAMP,
  jsonb_build_object(
    'groupId', i."groupId",
    'userId', i."userId",
    'role', i."role",
    'memberRole', 'LEADER',
    'source', 'migration:20261006120000_identity_features'
  )
FROM "inserted" AS i;

-- 4.3 memberRole = LEADER for the current simulator leader of every group.
UPDATE "group_members" AS gm
SET "memberRole" = 'LEADER'
FROM "groups" AS g
WHERE gm."groupId" = g."id"
  AND gm."userId" = g."simulatorLeaderId"
  AND gm."memberRole" <> 'LEADER';

-- 4.4 groups.type = TEACHER when the group has at least one member and none of
--     its members is a STUDENT user. Runs after 4.2 so that backfilled leaders
--     count as members. Everything else keeps the STUDENT default.
UPDATE "groups" AS g
SET "type" = 'TEACHER'
WHERE g."type" <> 'TEACHER'
  AND EXISTS (SELECT 1 FROM "group_members" AS gm WHERE gm."groupId" = g."id")
  AND NOT EXISTS (
    SELECT 1
    FROM "group_members" AS gm
    JOIN "users" AS u ON u."id" = gm."userId"
    WHERE gm."groupId" = g."id"
      AND u."role" = 'STUDENT'
  );

-- 4.5 group_supervisions intentionally stays empty (populated from the group
--     tree only with the author's approval).

-- ============================================================
-- 5. SUPERADMIN SETTING
-- ============================================================
-- >>> REPLACE BEFORE APPLYING: put the value of SUPERADMIN_EMAIL in place of
-- >>> <SUPERADMIN_EMAIL> below. The guard right after aborts the whole
-- >>> migration if the placeholder is still there.
INSERT INTO "app_settings" ("key", "value", "updatedAt")
VALUES ('superadmin_email', lower('<SUPERADMIN_EMAIL>'), CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "app_settings"
    WHERE "key" = 'superadmin_email'
      AND ("value" LIKE '<%' OR "value" NOT LIKE '%@%')
  ) THEN
    RAISE EXCEPTION 'app_settings.superadmin_email still holds the placeholder: replace <SUPERADMIN_EMAIL> in migration.sql before applying';
  END IF;
END
$$;

-- ============================================================
-- 6. SUPERADMIN PROTECTION TRIGGER
-- ============================================================
-- The account whose email equals app_settings.superadmin_email cannot be
-- demoted (role other than ADMIN), deactivated, renamed (email change) or
-- deleted. Promotion to ADMIN is allowed (the app bootstrap promotes it if it
-- is currently STUDENT/TEACHER); a no-op write that keeps a non-ADMIN role
-- unchanged is also allowed so the pre-bootstrap state does not lock the row.
--
-- How to change the superadmin email:
--   1. UPDATE "app_settings" SET "value" = lower('new.superadmin@example.com'), "updatedAt" = CURRENT_TIMESTAMP
--      WHERE "key" = 'superadmin_email';
--   2. Set SUPERADMIN_EMAIL to the same address in the server environment.
--   3. Restart the server (the bootstrap promotes the new account to ADMIN).
-- The previous superadmin stays ADMIN but is no longer protected.
--
-- Emergency maintenance only:
--   ALTER TABLE "users" DISABLE TRIGGER "users_protect_superadmin_update";
--   ... ;
--   ALTER TABLE "users" ENABLE TRIGGER "users_protect_superadmin_update";
CREATE OR REPLACE FUNCTION protect_superadmin() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  superadmin_email TEXT;
BEGIN
  SELECT lower("value") INTO superadmin_email
  FROM "app_settings"
  WHERE "key" = 'superadmin_email';

  IF superadmin_email IS NULL OR lower(OLD."email") <> superadmin_email THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Superadmin account cannot be deleted' USING ERRCODE = 'P0001';
  END IF;

  IF (NEW."role" <> 'ADMIN' AND NEW."role" IS DISTINCT FROM OLD."role")
     OR NEW."isActive" = false
     OR lower(NEW."email") <> superadmin_email THEN
    RAISE EXCEPTION 'Superadmin account cannot be demoted, deactivated or renamed' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS "users_protect_superadmin_update" ON "users";
CREATE TRIGGER "users_protect_superadmin_update"
BEFORE UPDATE OF "role", "isActive", "email" ON "users"
FOR EACH ROW EXECUTE FUNCTION protect_superadmin();

DROP TRIGGER IF EXISTS "users_protect_superadmin_delete" ON "users";
CREATE TRIGGER "users_protect_superadmin_delete"
BEFORE DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION protect_superadmin();

COMMIT;
