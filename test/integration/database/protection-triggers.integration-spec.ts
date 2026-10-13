/*
 * Funcionalidad: Prueba de integración de los disparadores de protección
 * Descripción: Comprueba contra el PostgreSQL de Testcontainers que, a nivel SQL y sin pasar por la aplicación, el disparador protect_superadmin rechace degradar, desactivar, renombrar y borrar la cuenta del superadministrador (y no afecte a otro ADMIN), y que audit_logs acepte INSERT pero rechace UPDATE, DELETE y TRUNCATE
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient, type User } from "@prisma/client";

import { createAdmin, createSuperadmin } from "../../factories";
import { createTestPrismaClient, resetDatabase } from "../../support/database";

const SUPERADMIN_UPDATE_REJECTED: RegExp = /Superadmin account cannot be demoted, deactivated or renamed/;
const SUPERADMIN_DELETE_REJECTED: RegExp = /Superadmin account cannot be deleted/;
const AUDIT_APPEND_ONLY: RegExp = /append-only/;

interface UserStateRow {
  readonly role: string;
  readonly isActive: boolean;
  readonly email: string;
}

async function insertAuditRow(prisma: PrismaClient, id: string, actorId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    "INSERT INTO audit_logs (id, entity_collection, entity_type, entity_id, action, performed_by_user_id, performed_at) VALUES ($1, 'users', 'User', $2, 'TEST', $2, now())",
    id,
    actorId,
  );
}

describe("protection triggers against PostgreSQL", () => {
  let prisma: PrismaClient;
  let superadmin: User;

  beforeAll(() => {
    prisma = createTestPrismaClient();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    superadmin = await createSuperadmin(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("superadmin row", () => {
    it.each([
      ["demoted to STUDENT", "UPDATE users SET role = 'STUDENT' WHERE id = $1"],
      ["demoted to TEACHER", "UPDATE users SET role = 'TEACHER' WHERE id = $1"],
      ["deactivated", "UPDATE users SET \"isActive\" = false WHERE id = $1"],
      ["renamed", "UPDATE users SET email = 'someone-else@ventylab.test' WHERE id = $1"],
    ])("should reject an UPDATE that leaves it %s", async (_label: string, sql: string) => {
      const update: Promise<number> = prisma.$executeRawUnsafe(sql, superadmin.id);

      await expect(update).rejects.toThrow(SUPERADMIN_UPDATE_REJECTED);

      const rows: UserStateRow[] = await prisma.$queryRawUnsafe<UserStateRow[]>("SELECT role::text AS role, \"isActive\", email FROM users WHERE id = $1", superadmin.id);

      expect(rows).toEqual([{ role: "ADMIN", isActive: true, email: superadmin.email }]);
    });

    it("should reject a DELETE", async () => {
      const deletion: Promise<number> = prisma.$executeRawUnsafe("DELETE FROM users WHERE id = $1", superadmin.id);

      await expect(deletion).rejects.toThrow(SUPERADMIN_DELETE_REJECTED);
      expect(await prisma.user.count({ where: { id: superadmin.id } })).toBe(1);
    });

    it("should still allow updates of unprotected columns", async () => {
      const updated: number = await prisma.$executeRawUnsafe("UPDATE users SET name = 'Renamed display name' WHERE id = $1", superadmin.id);

      expect(updated).toBe(1);
    });

    it("should leave other ADMIN accounts unprotected", async () => {
      const admin: User = await createAdmin(prisma);

      const demoted: number = await prisma.$executeRawUnsafe("UPDATE users SET role = 'STUDENT', \"isActive\" = false WHERE id = $1", admin.id);
      const deleted: number = await prisma.$executeRawUnsafe("DELETE FROM users WHERE id = $1", admin.id);

      expect([demoted, deleted]).toEqual([1, 1]);
    });
  });

  describe("audit_logs", () => {
    beforeEach(async () => {
      await insertAuditRow(prisma, "audit-trigger-1", superadmin.id);
    });

    it("should accept INSERT", async () => {
      await insertAuditRow(prisma, "audit-trigger-2", superadmin.id);

      expect(await prisma.auditLog.count()).toBe(2);
    });

    it.each([
      ["UPDATE", "UPDATE audit_logs SET action = 'TAMPERED' WHERE id = 'audit-trigger-1'"],
      ["DELETE", "DELETE FROM audit_logs WHERE id = 'audit-trigger-1'"],
      ["TRUNCATE", "TRUNCATE TABLE audit_logs"],
    ])("should reject %s", async (_operation: string, sql: string) => {
      const mutation: Promise<number> = prisma.$executeRawUnsafe(sql);

      await expect(mutation).rejects.toThrow(AUDIT_APPEND_ONLY);

      const rows: { action: string }[] = await prisma.$queryRawUnsafe<{ action: string }[]>("SELECT action FROM audit_logs WHERE id = 'audit-trigger-1'");

      expect(rows).toEqual([{ action: "TEST" }]);
    });
  });
});
