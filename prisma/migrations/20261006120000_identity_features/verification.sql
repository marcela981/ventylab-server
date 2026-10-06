-- ============================================================
-- verification.sql for migration 20261006120000_identity_features
-- Read-only. Never applied by Prisma (only migration.sql is).
--
-- PART A uses only pre-existing columns: run it BEFORE and AFTER applying.
-- PART B uses the new tables/columns: run it AFTER applying only
-- (before, it fails with "column/relation does not exist").
-- ============================================================

-- ============================================================
-- PART A: BEFORE and AFTER
-- ============================================================

-- A1. Row counts. users, groups, teacher_students and accounts must be identical
--     before and after. group_members after = before + A3 forecast (= B2 count).
SELECT 'users' AS "table", COUNT(*) AS "rows" FROM "users"
UNION ALL SELECT 'groups', COUNT(*) FROM "groups"
UNION ALL SELECT 'group_members', COUNT(*) FROM "group_members"
UNION ALL SELECT 'teacher_students', COUNT(*) FROM "teacher_students"
UNION ALL SELECT 'accounts', COUNT(*) FROM "accounts"
UNION ALL SELECT 'ventilator_reservations', COUNT(*) FROM "ventilator_reservations";

-- A2. Users per role. Before: SUPERUSER + ADMIN must equal ADMIN after.
--     STUDENT and TEACHER must be identical.
SELECT "role"::text AS "role", COUNT(*) AS "users"
FROM "users"
GROUP BY 1
ORDER BY 1;

-- A2b. Folded role computed the same way the migration does (before: forecast; after: actual).
SELECT CASE WHEN "role"::text = 'SUPERUSER' THEN 'ADMIN' ELSE "role"::text END AS "role_after_fold",
       COUNT(*) AS "users"
FROM "users"
GROUP BY 1
ORDER BY 1;

-- A3. Leader membership forecast: leaders that are not members of their group.
--     Before: rows the migration will insert. After: must return 0 rows.
SELECT g."id" AS "group_id", g."name" AS "group_name", g."simulatorLeaderId" AS "leader_id", u."role"::text AS "leader_role"
FROM "groups" AS g
JOIN "users" AS u ON u."id" = g."simulatorLeaderId"
WHERE NOT EXISTS (
  SELECT 1 FROM "group_members" AS gm
  WHERE gm."groupId" = g."id" AND gm."userId" = g."simulatorLeaderId"
)
ORDER BY g."id";

-- A4. googleId backfill forecast: users with exactly one google account.
SELECT COUNT(*) AS "users_with_one_google_account"
FROM (
  SELECT "userId" FROM "accounts" WHERE "provider" = 'google' GROUP BY "userId" HAVING COUNT(*) = 1
) AS a;

-- ============================================================
-- PART B: AFTER only
-- ============================================================

-- B1. SUPERUSER fold snapshot (one row per folded user / reservation).
SELECT "entity_collection", "entity_id", "metadata" ->> 'email' AS "email", "performed_at"
FROM "audit_logs"
WHERE "action" = 'role_folded_superuser_to_admin'
ORDER BY "entity_collection", "entity_id";

-- B2. Leader membership rows inserted by the migration (count = group_members delta in A1).
SELECT "entity_id" AS "group_member_id", "metadata" ->> 'groupId' AS "group_id", "metadata" ->> 'userId' AS "user_id",
       "metadata" ->> 'role' AS "legacy_role"
FROM "audit_logs"
WHERE "action" = 'leader_membership_backfilled'
ORDER BY 2, 3;

-- B3. Groups per type.
SELECT "type"::text AS "type", COUNT(*) AS "groups" FROM "groups" GROUP BY 1 ORDER BY 1;

-- B4. Memberships per memberRole.
SELECT "memberRole"::text AS "member_role", COUNT(*) AS "memberships" FROM "group_members" GROUP BY 1 ORDER BY 1;

-- B5. Leaders per group (must be <= 1; any row here is a violation).
SELECT "groupId" AS "group_id", COUNT(*) AS "leaders"
FROM "group_members"
WHERE "memberRole" = 'LEADER'
GROUP BY "groupId"
HAVING COUNT(*) > 1;

-- B5b. LEADER memberships out of sync with groups."simulatorLeaderId" (must be empty).
SELECT gm."groupId" AS "group_id", gm."userId" AS "user_id", g."simulatorLeaderId" AS "simulator_leader_id"
FROM "group_members" AS gm
JOIN "groups" AS g ON g."id" = gm."groupId"
WHERE (gm."memberRole" = 'LEADER') <> (gm."userId" IS NOT DISTINCT FROM g."simulatorLeaderId");

-- B6. Pre-existing conflict (not resolved by the migration): students in more
--     than one active STUDENT group.
SELECT gm."userId" AS "user_id", u."email", COUNT(*) AS "active_student_groups",
       string_agg(g."id", ', ' ORDER BY g."id") AS "group_ids"
FROM "group_members" AS gm
JOIN "groups" AS g ON g."id" = gm."groupId"
JOIN "users" AS u ON u."id" = gm."userId"
WHERE g."isActive" = true
  AND g."type" = 'STUDENT'
  AND u."role" = 'STUDENT'
GROUP BY gm."userId", u."email"
HAVING COUNT(*) > 1
ORDER BY 3 DESC, 1;

-- B7. Pre-existing conflict: membership / user role mismatches
--     (STUDENT users in TEACHER groups, TEACHER/ADMIN users in STUDENT groups).
SELECT g."id" AS "group_id", g."name" AS "group_name", g."type"::text AS "group_type",
       u."id" AS "user_id", u."email", u."role"::text AS "user_role", gm."role" AS "legacy_member_role",
       gm."memberRole"::text AS "member_role"
FROM "group_members" AS gm
JOIN "groups" AS g ON g."id" = gm."groupId"
JOIN "users" AS u ON u."id" = gm."userId"
WHERE (g."type" = 'TEACHER' AND u."role" = 'STUDENT')
   OR (g."type" = 'STUDENT' AND u."role" IN ('TEACHER', 'ADMIN'))
ORDER BY g."id", u."id";

-- B8. Users with googleId (must equal A4 unless a google account was already ambiguous).
SELECT COUNT(*) AS "users_with_google_id" FROM "users" WHERE "googleId" IS NOT NULL;

-- B9. New columns defaults: every user active, no revoked refresh tokens yet.
SELECT COUNT(*) FILTER (WHERE "isActive" = false) AS "inactive_users",
       COUNT(*) FILTER (WHERE "refreshTokensRevokedAt" IS NOT NULL) AS "users_with_revocation"
FROM "users";

-- B10. Superadmin setting and account (value must be the real email; account role should be ADMIN,
--      or STUDENT/TEACHER until the server bootstrap promotes it; no row = account not created yet).
SELECT s."key", s."value", s."updatedAt", u."id" AS "user_id", u."role"::text AS "role", u."isActive"
FROM "app_settings" AS s
LEFT JOIN "users" AS u ON lower(u."email") = s."value"
WHERE s."key" = 'superadmin_email';

-- B11. Superadmin triggers exist and are enabled ('O' = enabled).
SELECT t."tgname" AS "trigger", t."tgenabled" AS "enabled", p."proname" AS "function"
FROM "pg_trigger" AS t
JOIN "pg_proc" AS p ON p."oid" = t."tgfoid"
WHERE t."tgrelid" = '"users"'::regclass
  AND NOT t."tgisinternal"
ORDER BY 1;

-- B12. group_supervisions must be empty right after the migration.
SELECT COUNT(*) AS "group_supervisions" FROM "group_supervisions";

-- ============================================================
-- PART C: MANUAL TRIGGER TEST (optional, uncomment and run by hand)
-- Every statement must fail with 'Superadmin account cannot be ...'; the
-- ROLLBACK leaves the database untouched. Run each block separately, since
-- the first error aborts the transaction.
-- ============================================================
-- BEGIN;
-- UPDATE "users" SET "role" = 'STUDENT'
-- WHERE lower("email") = (SELECT "value" FROM "app_settings" WHERE "key" = 'superadmin_email');
-- ROLLBACK;
--
-- BEGIN;
-- UPDATE "users" SET "isActive" = false
-- WHERE lower("email") = (SELECT "value" FROM "app_settings" WHERE "key" = 'superadmin_email');
-- ROLLBACK;
--
-- BEGIN;
-- UPDATE "users" SET "email" = 'renamed@example.com'
-- WHERE lower("email") = (SELECT "value" FROM "app_settings" WHERE "key" = 'superadmin_email');
-- ROLLBACK;
--
-- BEGIN;
-- DELETE FROM "users"
-- WHERE lower("email") = (SELECT "value" FROM "app_settings" WHERE "key" = 'superadmin_email');
-- ROLLBACK;
--
-- Allowed (must succeed): promotion / no-op write to ADMIN.
-- BEGIN;
-- UPDATE "users" SET "role" = 'ADMIN'
-- WHERE lower("email") = (SELECT "value" FROM "app_settings" WHERE "key" = 'superadmin_email');
-- ROLLBACK;
