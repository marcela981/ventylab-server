/*
 * Funcionalidad: Pruebas del caso de uso ChangeUserStatusUseCase
 * Descripción: Verifica la activación y desactivación de usuarios, la inmutabilidad del estado del superadmin, la revocación de refresh tokens y la auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ChangeUserStatusCommand } from "@/features/users/application/commands/change-user-status.command";
import { ChangeUserStatusUseCase } from "@/features/users/application/use-cases/change-user-status.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { UserStatusChangedEvent } from "@/features/users/domain/events/user.events";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { CannotChangeOwnStatusError, SuperadminStatusImmutableError, UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const SUPERADMIN_EMAIL: string = "root@ventylab.com";
const TRANSACTION: string = "tx";

interface Harness {
  useCase: ChangeUserStatusUseCase;
  save: jest.Mock;
  record: jest.Mock;
  publish: jest.Mock;
}

function buildUser(id: string, role: string, isActive: boolean = true, email: string = `${id.toLowerCase()}@ventylab.com`): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id,
    email,
    name: "Test user",
    passwordHash: "hash",
    role: UserRole.create(role),
    isActive,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness(users: User[]): Harness {
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const publish: jest.Mock = jest.fn();

  const usersRepository: IUserRepository = {
    getById: jest.fn().mockImplementation((id: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.id === id))),
    save,
  } as unknown as IUserRepository;
  const auditRecorder: IAuditRecorder = { record };
  const transactionManager: ITransactionManager = { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TRANSACTION) };
  const eventBus: IEventBus = { publish };

  const useCase: ChangeUserStatusUseCase = new ChangeUserStatusUseCase(usersRepository, auditRecorder, transactionManager, eventBus, SUPERADMIN_EMAIL);

  return { useCase, save, record, publish };
}

describe("ChangeUserStatusUseCase", () => {
  it("deactivates a user, revokes refresh tokens and audits", async () => {
    const teacher: User = buildUser("T1", "TEACHER");
    const { useCase, save, record, publish } = buildHarness([teacher]);

    await useCase.execute(new ChangeUserStatusCommand({ userId: "T1", isActive: false, performedBy: "A1" }));

    expect(teacher.isActive).toBe(false);
    expect(teacher.refreshTokensRevokedAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledWith(teacher, TRANSACTION);
    expect(record).toHaveBeenCalledWith("A1", "user_status_changed", "users", "T1", { isActive: true }, { isActive: false }, TRANSACTION);
    expect(publish).toHaveBeenCalledWith([expect.any(UserStatusChangedEvent)]);
  });

  it("reactivates a user without revoking refresh tokens", async () => {
    const student: User = buildUser("S1", "STUDENT", false);
    const { useCase } = buildHarness([student]);

    await useCase.execute(new ChangeUserStatusCommand({ userId: "S1", isActive: true, performedBy: "A1" }));

    expect(student.isActive).toBe(true);
    expect(student.refreshTokensRevokedAt).toBeUndefined();
  });

  it("rejects deactivating the superadmin", async () => {
    const superadmin: User = buildUser("R1", "ADMIN", true, "Root@VentyLab.com");
    const { useCase, save } = buildHarness([superadmin]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStatusCommand({ userId: "R1", isActive: false, performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(SuperadminStatusImmutableError);
    expect(save).not.toHaveBeenCalled();
  });

  it("rejects changing the own status", async () => {
    const admin: User = buildUser("A1", "ADMIN");
    const { useCase } = buildHarness([admin]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStatusCommand({ userId: "A1", isActive: false, performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(CannotChangeOwnStatusError);
  });

  it("rejects an unknown user", async () => {
    const { useCase } = buildHarness([]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStatusCommand({ userId: "X", isActive: false, performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("does nothing when the status is unchanged", async () => {
    const student: User = buildUser("S1", "STUDENT");
    const { useCase, save, record } = buildHarness([student]);

    await useCase.execute(new ChangeUserStatusCommand({ userId: "S1", isActive: true, performedBy: "A1" }));

    expect(save).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });
});
