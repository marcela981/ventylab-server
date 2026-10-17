/*
 * Funcionalidad: Pruebas de ChangeUserStudentCodeUseCase
 * Descripción: Verifica que el código estudiantil se recorta, se guarda y se audita con su valor anterior y el nuevo, que quitarlo (null) también se audita, que repetir el valor actual no escribe ni audita, que un código de otro usuario responde 409 sin guardar, que un código inválido se rechaza antes de leer y que un usuario inexistente responde 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ChangeUserStudentCodeCommand } from "@/features/users/application/commands/change-user-student-code.command";
import { ChangeUserStudentCodeUseCase } from "@/features/users/application/use-cases/change-user-student-code.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { InvalidStudentCodeError, StudentCodeAlreadyInUseError, UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const TRANSACTION: string = "tx";

interface Harness {
  useCase: ChangeUserStudentCodeUseCase;
  getById: jest.Mock;
  save: jest.Mock;
  record: jest.Mock;
}

function buildUser(id: string, studentCode?: string): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id,
    email: `${id.toLowerCase()}@ventylab.com`,
    name: "Test user",
    role: UserRole.create("STUDENT"),
    isActive: true,
    studentCode,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness(users: User[]): Harness {
  const getById: jest.Mock = jest.fn().mockImplementation((id: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.id === id)));
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);

  const usersRepository: IUserRepository = {
    getById,
    getByStudentCode: jest
      .fn()
      .mockImplementation((studentCode: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.studentCode === studentCode))),
    save,
  } as unknown as IUserRepository;
  const auditRecorder: IAuditRecorder = { record };
  const transactionManager: ITransactionManager = { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TRANSACTION) };

  return { useCase: new ChangeUserStudentCodeUseCase(usersRepository, auditRecorder, transactionManager), getById, save, record };
}

describe("ChangeUserStudentCodeUseCase", () => {
  it("trims, saves and audits a new code with the previous value", async () => {
    const student: User = buildUser("S1", "OLD-1");
    const { useCase, save, record } = buildHarness([student]);

    await useCase.execute(new ChangeUserStudentCodeCommand({ userId: "S1", studentCode: "  2026-0001 ", performedBy: "A1" }));

    expect(student.studentCode).toBe("2026-0001");
    expect(save).toHaveBeenCalledWith(student, TRANSACTION);
    expect(record).toHaveBeenCalledWith("A1", "user_student_code_changed", "users", "S1", { studentCode: "OLD-1" }, { studentCode: "2026-0001" }, TRANSACTION);
  });

  it("removes the code and audits the removal", async () => {
    const student: User = buildUser("S1", "2026-0001");
    const { useCase, record } = buildHarness([student]);

    await useCase.execute(new ChangeUserStudentCodeCommand({ userId: "S1", studentCode: null, performedBy: "A1" }));

    expect(student.studentCode).toBeUndefined();
    expect(record).toHaveBeenCalledWith("A1", "user_student_code_changed", "users", "S1", { studentCode: "2026-0001" }, { studentCode: null }, TRANSACTION);
  });

  it("does not write nor audit when the code does not change", async () => {
    const student: User = buildUser("S1", "2026-0001");
    const { useCase, save, record } = buildHarness([student]);

    await useCase.execute(new ChangeUserStudentCodeCommand({ userId: "S1", studentCode: "2026-0001", performedBy: "A1" }));

    expect(save).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it("rejects a code already assigned to another user", async () => {
    const student: User = buildUser("S1");
    const { useCase, save } = buildHarness([student, buildUser("S2", "2026-0001")]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStudentCodeCommand({ userId: "S1", studentCode: "2026-0001", performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(StudentCodeAlreadyInUseError);
    expect(save).not.toHaveBeenCalled();
  });

  it.each<[string, string]>([
    ["an empty code", "   "],
    ["a code with spaces inside", "2026 0001"],
    ["a code longer than 32 characters", "A".repeat(33)],
  ])("rejects %s before reading the user", async (_label: string, studentCode: string) => {
    const { useCase, getById } = buildHarness([buildUser("S1")]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStudentCodeCommand({ userId: "S1", studentCode, performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(InvalidStudentCodeError);
    expect(getById).not.toHaveBeenCalled();
  });

  it("rejects an unknown user", async () => {
    const { useCase } = buildHarness([]);

    const execution: Promise<void> = useCase.execute(new ChangeUserStudentCodeCommand({ userId: "missing", studentCode: "2026-0001", performedBy: "A1" }));

    await expect(execution).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
