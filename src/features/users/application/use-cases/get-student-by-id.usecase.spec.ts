/*
 * Funcionalidad: Pruebas de GetStudentByIdUseCase
 * Descripción: Verifica que el detalle de un estudiante lleva su código institucional y sus grupos STUDENT activos (lista vacía sin grupo) junto al resumen de progreso, que un docente lo lee si gestiona un grupo del estudiante o lo tiene asignado en TeacherStudent y recibe 403 en otro caso sin leer progreso ni grupos, que el administrador no pasa por el alcance docente, y que un usuario inexistente o que no es estudiante responde 404 y 400
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GetStudentByIdCommand } from "@/features/users/application/commands/get-student-by-id.command";
import { type IStudentGroupsReader, type StudentGroupRef } from "@/features/users/application/ports/student-groups-reader.interface";
import { type IStudentScopeChecker } from "@/features/users/application/ports/student-scope-checker.interface";
import { type StudentResult } from "@/features/users/application/results/student.result";
import { GetStudentByIdUseCase } from "@/features/users/application/use-cases/get-student-by-id.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserStatisticsRepository } from "@/features/users/domain/repositories/user-statistics.repository";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { StudentAccessDeniedError, UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";
import { StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";

const GROUP_A: StudentGroupRef = { id: "group-a", name: "Grupo A" };

interface Harness {
  useCase: GetStudentByIdUseCase;
  canViewStudent: jest.Mock;
  isStudentAssignedToTeacher: jest.Mock;
  getActiveGroups: jest.Mock;
  getStudentProgressSummaries: jest.Mock;
}

function buildUser(id: string, role: string, studentCode?: string): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id,
    email: `${id.toLowerCase()}@ventylab.com`,
    name: "Test user",
    role: UserRole.create(role),
    isActive: true,
    studentCode,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness({ inScope = false, assigned = false }: { inScope?: boolean; assigned?: boolean } = {}): Harness {
  const users: User[] = [buildUser("S1", "STUDENT", "2026-0001"), buildUser("S2", "STUDENT"), buildUser("T9", "TEACHER")];
  const canViewStudent: jest.Mock = jest.fn().mockResolvedValue(inScope);
  const isStudentAssignedToTeacher: jest.Mock = jest.fn().mockResolvedValue(assigned);
  const getActiveGroups: jest.Mock = jest
    .fn()
    .mockImplementation((ids: ReadonlyArray<string>): Promise<ReadonlyMap<string, StudentGroupRef[]>> => Promise.resolve(new Map(ids.includes("S1") ? [["S1", [GROUP_A]]] : [])));
  const getStudentProgressSummaries: jest.Mock = jest
    .fn()
    .mockImplementation((ids: string[]): Promise<StudentProgressSummary[]> =>
      Promise.resolve(ids.includes("S1") ? [new StudentProgressSummary({ studentId: "S1", completedLessons: 2, totalLessons: 4, totalTimeSpent: 60 })] : []),
    );

  const usersRepository: IUserRepository = {
    getById: jest.fn().mockImplementation((id: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.id === id))),
    isStudentAssignedToTeacher,
  } as unknown as IUserRepository;
  const statistics: IUserStatisticsRepository = { getStudentProgressSummaries } as unknown as IUserStatisticsRepository;
  const scope: IStudentScopeChecker = { canViewStudent };
  const groups: IStudentGroupsReader = { getActiveGroups };

  return {
    useCase: new GetStudentByIdUseCase(usersRepository, statistics, scope, groups),
    canViewStudent,
    isStudentAssignedToTeacher,
    getActiveGroups,
    getStudentProgressSummaries,
  };
}

function command(studentId: string, requesterRole: string, requesterId: string = "T1"): GetStudentByIdCommand {
  return new GetStudentByIdCommand({ studentId, requesterId, requesterRole });
}

describe("GetStudentByIdUseCase", () => {
  it("returns the student with the code, the active groups and the progress summary to a teacher who manages a group", async () => {
    const { useCase, canViewStudent, getActiveGroups } = buildHarness({ inScope: true });

    const result: StudentResult = await useCase.execute(command("S1", "TEACHER"));

    expect(result.user.studentCode).toBe("2026-0001");
    expect(result.groups).toEqual([GROUP_A]);
    expect(result.progress.completedLessons).toBe(2);
    expect(canViewStudent).toHaveBeenCalledWith({ id: "T1", role: "TEACHER" }, "S1");
    expect(getActiveGroups).toHaveBeenCalledWith(["S1"]);
  });

  it("answers an empty group list and an empty summary for a student without a group or progress", async () => {
    const { useCase } = buildHarness();

    const result: StudentResult = await useCase.execute(command("S2", "ADMIN"));

    expect(result.groups).toEqual([]);
    expect(result.user.studentCode).toBeUndefined();
    expect(result.progress).toEqual(StudentProgressSummary.empty("S2"));
  });

  it("lets a teacher read a student assigned through TeacherStudent", async () => {
    const { useCase, isStudentAssignedToTeacher } = buildHarness({ assigned: true });

    await expect(useCase.execute(command("S1", "TEACHER"))).resolves.toEqual(expect.objectContaining({ groups: [GROUP_A] }));
    expect(isStudentAssignedToTeacher).toHaveBeenCalledWith("T1", "S1");
  });

  it("refuses a teacher outside the student's scope without reading progress or groups", async () => {
    const { useCase, getActiveGroups, getStudentProgressSummaries } = buildHarness();

    await expect(useCase.execute(command("S1", "TEACHER"))).rejects.toBeInstanceOf(StudentAccessDeniedError);
    expect(getActiveGroups).not.toHaveBeenCalled();
    expect(getStudentProgressSummaries).not.toHaveBeenCalled();
  });

  it("does not apply the teacher scope to an administrator", async () => {
    const { useCase, canViewStudent } = buildHarness();

    await useCase.execute(command("S1", "ADMIN"));

    expect(canViewStudent).not.toHaveBeenCalled();
  });

  it("rejects an unknown user and a user who is not a student", async () => {
    const { useCase } = buildHarness({ inScope: true });

    await expect(useCase.execute(command("ghost", "ADMIN"))).rejects.toBeInstanceOf(UserNotFoundError);
    await expect(useCase.execute(command("T9", "ADMIN"))).rejects.toBeInstanceOf(UserNotStudentError);
  });
});
