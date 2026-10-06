/*
 * Funcionalidad: Pruebas del caso de uso ChangeUserRoleUseCase
 * Descripción: Verifica la inmutabilidad del superadmin frente a otro administrador y a sí mismo, el cambio propio, la limpieza de grupos, la revocación de refresh tokens, la auditoría y el evento posterior a la transacción
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { UserRoleChangedEvent } from "@/features/users/domain/events/user.events";
import { type IUserGroupMembershipsRepository } from "@/features/users/domain/repositories/user-group-memberships.repository";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { CannotChangeOwnRoleError, SuperadminRoleImmutableError, UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const SUPERADMIN_EMAIL: string = "root@ventylab.com";
const TRANSACTION: string = "tx";

interface Harness {
  useCase: ChangeUserRoleUseCase;
  save: jest.Mock;
  removeFromGroupTypes: jest.Mock;
  record: jest.Mock;
  publish: jest.Mock;
}

function buildUser(id: string, role: string, email: string = `${id.toLowerCase()}@ventylab.com`): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id,
    email,
    name: "Test user",
    passwordHash: "hash",
    role: UserRole.create(role),
    isActive: true,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness(users: User[], removedGroupIds: string[] = []): Harness {
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const removeFromGroupTypes: jest.Mock = jest.fn().mockResolvedValue(removedGroupIds);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const publish: jest.Mock = jest.fn();

  const usersRepository: IUserRepository = {
    getById: jest.fn().mockImplementation((id: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.id === id))),
    save,
  } as unknown as IUserRepository;
  const membershipsRepository: IUserGroupMembershipsRepository = { removeFromGroupTypes };
  const auditRecorder: IAuditRecorder = { record };
  const transactionManager: ITransactionManager = { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TRANSACTION) };
  const eventBus: IEventBus = { publish };

  const useCase: ChangeUserRoleUseCase = new ChangeUserRoleUseCase(
    usersRepository,
    membershipsRepository,
    auditRecorder,
    transactionManager,
    eventBus,
    SUPERADMIN_EMAIL,
  );

  return { useCase, save, removeFromGroupTypes, record, publish };
}

describe("ChangeUserRoleUseCase", () => {
  it("promotes a student, leaves student groups, revokes refresh tokens and audits in one transaction", async () => {
    const student: User = buildUser("S1", "STUDENT");
    const { useCase, save, removeFromGroupTypes, record, publish } = buildHarness([student], ["G1", "G2"]);

    await useCase.execute(new ChangeUserRoleCommand({ userId: "S1", role: "TEACHER", performedBy: "A1" }));

    expect(student.role.value).toBe("TEACHER");
    expect(student.refreshTokensRevokedAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledWith(student, TRANSACTION);
    expect(removeFromGroupTypes).toHaveBeenCalledWith("S1", ["STUDENT"], TRANSACTION);
    expect(record).toHaveBeenCalledWith(
      "A1",
      "user_role_changed",
      "users",
      "S1",
      { role: "STUDENT" },
      { role: "TEACHER", removedGroupIds: ["G1", "G2"] },
      TRANSACTION,
    );
    expect(publish).toHaveBeenCalledWith([expect.any(UserRoleChangedEvent)]);
    expect((publish.mock.calls[0] as [UserRoleChangedEvent[]])[0][0]).toMatchObject({ previousRole: "STUDENT", newRole: "TEACHER" });
  });

  it("leaves teacher groups when staff becomes a student", async () => {
    const teacher: User = buildUser("T1", "TEACHER");
    const { useCase, removeFromGroupTypes } = buildHarness([teacher], ["TG1"]);

    await useCase.execute(new ChangeUserRoleCommand({ userId: "T1", role: "STUDENT", performedBy: "A1" }));

    expect(removeFromGroupTypes).toHaveBeenCalledWith("T1", ["TEACHER"], TRANSACTION);
  });

  it("does not leave any group between teacher and admin", async () => {
    const teacher: User = buildUser("T1", "TEACHER");
    const { useCase, removeFromGroupTypes } = buildHarness([teacher]);

    await useCase.execute(new ChangeUserRoleCommand({ userId: "T1", role: "ADMIN", performedBy: "A1" }));

    expect(removeFromGroupTypes).toHaveBeenCalledWith("T1", [], TRANSACTION);
  });

  it("rejects another admin demoting the superadmin", async () => {
    const superadmin: User = buildUser("R1", "ADMIN", "ROOT@ventylab.com");
    const admin: User = buildUser("A1", "ADMIN");
    const { useCase, save, publish } = buildHarness([superadmin, admin]);

    const execution: Promise<void> = useCase.execute(new ChangeUserRoleCommand({ userId: "R1", role: "TEACHER", performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(SuperadminRoleImmutableError);
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("rejects changing the superadmin role even by the superadmin", async () => {
    const superadmin: User = buildUser("R1", "ADMIN", "ROOT@ventylab.com");
    const { useCase, save, publish } = buildHarness([superadmin]);

    const execution: Promise<void> = useCase.execute(new ChangeUserRoleCommand({ userId: "R1", role: "TEACHER", performedBy: "R1" }));

    await expect(execution).rejects.toBeInstanceOf(SuperadminRoleImmutableError);
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("rejects changing the own role", async () => {
    const admin: User = buildUser("A1", "ADMIN");
    const { useCase } = buildHarness([admin]);

    const execution: Promise<void> = useCase.execute(new ChangeUserRoleCommand({ userId: "A1", role: "TEACHER", performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
  });

  it("rejects an unknown user", async () => {
    const { useCase } = buildHarness([]);

    const execution: Promise<void> = useCase.execute(new ChangeUserRoleCommand({ userId: "X", role: "TEACHER", performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("does nothing when the role is unchanged", async () => {
    const teacher: User = buildUser("T1", "TEACHER");
    const { useCase, save, record, publish } = buildHarness([teacher]);

    await useCase.execute(new ChangeUserRoleCommand({ userId: "T1", role: "TEACHER", performedBy: "A1" }));

    expect(save).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });
});
