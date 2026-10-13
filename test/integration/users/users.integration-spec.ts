/*
 * Funcionalidad: Prueba de integración de usuarios y transacciones
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de usuarios a través de ChangeUserRoleUseCase y ChangeUserStatusUseCase (rol, revocación de refresh tokens, salida de los grupos que ya no corresponden y fila de auditoría en la misma transacción), la inmutabilidad del superadministrador en el caso de uso, el rechazo del disparador protect_superadmin propagado como reversión completa, y que el gestor de transacciones de la aplicación no deje filas parciales cuando el trabajo falla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type User } from "@prisma/client";

import { TRANSACTION_MANAGER_TOKEN, type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { ChangeUserStatusCommand } from "@/features/users/application/commands/change-user-status.command";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";
import { ChangeUserStatusUseCase } from "@/features/users/application/use-cases/change-user-status.usecase";
import { SuperadminRoleImmutableError, SuperadminStatusImmutableError } from "@/features/users/domain/users.errors";

import { type ContentTree, createAdmin, createContentTree, createStudent, createStudentGroup, createSuperadmin, createTeacher, createTeacherGroup } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

class IntentionalRollbackError extends Error {}

describe("users and transactions against PostgreSQL", () => {
  let harness: IntegrationApp;
  let admin: User;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    admin = await createAdmin(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it("should change a teacher to student, leave teacher groups, revoke refresh tokens and audit in one transaction", async () => {
    const teacher: User = await createTeacher(harness.prisma);

    await createTeacherGroup(harness.prisma, { members: [teacher] });

    await harness.app.get(ChangeUserRoleUseCase).execute(new ChangeUserRoleCommand({ userId: teacher.id, role: "STUDENT", performedBy: admin.id }));

    const stored: User | null = await harness.prisma.user.findUnique({ where: { id: teacher.id } });
    const memberships: number = await harness.prisma.groupMember.count({ where: { userId: teacher.id } });
    const audits: number = await harness.prisma.auditLog.count({ where: { entityId: teacher.id, action: "user_role_changed", performedByUserId: admin.id } });

    expect(stored?.role).toBe("STUDENT");
    expect(stored?.refreshTokensRevokedAt).toBeInstanceOf(Date);
    expect(memberships).toBe(0);
    expect(audits).toBe(1);
  });

  it("should keep the superadmin role and status immutable in the use case without writing an audit row", async () => {
    const superadmin: User = await createSuperadmin(harness.prisma);

    const roleChange: Promise<void> = harness.app.get(ChangeUserRoleUseCase).execute(new ChangeUserRoleCommand({ userId: superadmin.id, role: "TEACHER", performedBy: admin.id }));
    const statusChange: Promise<void> = harness.app.get(ChangeUserStatusUseCase).execute(new ChangeUserStatusCommand({ userId: superadmin.id, isActive: false, performedBy: admin.id }));

    await expect(roleChange).rejects.toBeInstanceOf(SuperadminRoleImmutableError);
    await expect(statusChange).rejects.toBeInstanceOf(SuperadminStatusImmutableError);
    expect(await harness.prisma.user.findUnique({ where: { id: superadmin.id }, select: { role: true, isActive: true } })).toEqual({ role: "ADMIN", isActive: true });
    expect(await harness.prisma.auditLog.count()).toBe(0);
  });

  it("should roll back the whole role change when the database trigger rejects it", async () => {
    // The trigger reads the protected address from app_settings; pointing it to another student exercises the SQL guard behind a use case that does not know that account is protected.
    const protectedStudent: User = await createStudent(harness.prisma);

    await createStudentGroup(harness.prisma, { members: [protectedStudent] });
    await harness.prisma.appSetting.update({ where: { key: "superadmin_email" }, data: { value: protectedStudent.email } });

    const roleChange: Promise<void> = harness.app.get(ChangeUserRoleUseCase).execute(new ChangeUserRoleCommand({ userId: protectedStudent.id, role: "TEACHER", performedBy: admin.id }));

    await expect(roleChange).rejects.toThrow();
    expect(await harness.prisma.user.findUnique({ where: { id: protectedStudent.id }, select: { role: true, refreshTokensRevokedAt: true } })).toEqual({ role: "STUDENT", refreshTokensRevokedAt: null });
    expect(await harness.prisma.groupMember.count({ where: { userId: protectedStudent.id } })).toBe(1);
    expect(await harness.prisma.auditLog.count()).toBe(0);
  });

  it("should leave no partial rows when the work of the application transaction manager fails", async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);
    const transactionManager: ITransactionManager = harness.app.get<ITransactionManager>(TRANSACTION_MANAGER_TOKEN);
    const auditRecorder: IAuditRecorder = harness.app.get<IAuditRecorder>(AUDIT_RECORDER_TOKEN);

    const work: Promise<void> = transactionManager.run(async (transaction: unknown): Promise<void> => {
      const client: Prisma.TransactionClient = transaction as Prisma.TransactionClient;

      await client.note.create({ data: { userId: student.id, lessonId: tree.lesson.id, content: { type: "doc", content: [] } } });
      await client.user.update({ where: { id: student.id }, data: { name: "Changed inside the transaction" } });
      await auditRecorder.record(admin.id, "test_action", "users", student.id, { name: student.name }, { name: "Changed inside the transaction" }, transaction);

      throw new IntentionalRollbackError("fail after three writes");
    });

    await expect(work).rejects.toBeInstanceOf(IntentionalRollbackError);
    expect(await harness.prisma.note.count()).toBe(0);
    expect((await harness.prisma.user.findUnique({ where: { id: student.id } }))?.name).toBe(student.name);
    expect(await harness.prisma.auditLog.count()).toBe(0);
  });

  it("should commit every write of the application transaction manager together", async () => {
    const student: User = await createStudent(harness.prisma);
    const transactionManager: ITransactionManager = harness.app.get<ITransactionManager>(TRANSACTION_MANAGER_TOKEN);
    const auditRecorder: IAuditRecorder = harness.app.get<IAuditRecorder>(AUDIT_RECORDER_TOKEN);

    await transactionManager.run(async (transaction: unknown): Promise<void> => {
      await (transaction as Prisma.TransactionClient).user.update({ where: { id: student.id }, data: { name: "Committed name" } });
      await auditRecorder.record(admin.id, "test_action", "users", student.id, { name: student.name }, { name: "Committed name" }, transaction);
    });

    expect((await harness.prisma.user.findUnique({ where: { id: student.id } }))?.name).toBe("Committed name");
    expect(await harness.prisma.auditLog.count({ where: { entityId: student.id, action: "test_action" } })).toBe(1);
  });
});
