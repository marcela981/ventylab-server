/*
 * Funcionalidad: Pruebas de GetAdminStudentsUseCase
 * Descripción: Verifica con dobles del repositorio y de las fachadas que myGroups filtre por los grupos que el docente gestiona y devuelva una página vacía si no tiene ninguno, que groupId se combine con myGroups, que el avance salga de LearningProgressFacade, que canView sea verdadero para el administrador y para los estudiantes de grupos gestionados (incluidos los inactivos) y falso para los demás, y que el orden por progreso se calcule antes de paginar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { GetAdminStudentsUseCase } from "@/features/admin/application/use-cases/get-admin-students.usecase";
import {
  type AdminStudentListItem,
  type AdminStudentRow,
  type GetAdminStudentsQuery,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { type IAdminDashboardRepository } from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type LearningProgressFacade, type UserLearningProgress } from "@/features/progress/application/services/learning-progress.facade";

const TEACHER: GetAdminStudentsQuery["actor"] = { id: "teacher-1", role: "TEACHER" };
const ADMIN: GetAdminStudentsQuery["actor"] = { id: "admin-1", role: "ADMIN" };

const ROWS: Record<string, AdminStudentRow> = {
  ana: { id: "ana", name: "Ana", email: "ana@example.edu", studentCode: "2026-01", activeGroups: [{ id: "group-a", name: "Grupo A" }], groupIds: ["group-a"] },
  beto: { id: "beto", name: "Beto", email: "beto@example.edu", activeGroups: [], groupIds: ["group-old"] },
  caro: { id: "caro", name: "Caro", email: "caro@example.edu", activeGroups: [{ id: "group-z", name: "Grupo Z" }], groupIds: ["group-z"] },
};

const PERCENTAGES: Record<string, number> = { ana: 40, beto: 90, caro: 10 };

function report(userId: string): UserLearningProgress {
  const percentage: number = PERCENTAGES[userId] ?? 0;

  return {
    userId,
    report: {
      overall: { completedLessons: 0, totalLessons: 10, percentage, completed: false },
      modules: [
        { moduleId: "m1", completedLessons: 0, totalLessons: 5, percentage: 100, completed: percentage >= 90, lessons: [] },
        { moduleId: "m2", completedLessons: 0, totalLessons: 5, percentage: 0, completed: false, lessons: [] },
      ],
      levels: [],
      sections: [],
    },
  };
}

interface Harness {
  readonly useCase: GetAdminStudentsUseCase;
  readonly repository: jest.Mocked<IAdminDashboardRepository>;
  readonly groups: { getManageableStudentGroupIds: jest.Mock };
}

function build(managedGroupIds: string[] = ["group-a", "group-old"]): Harness {
  const repository: jest.Mocked<IAdminDashboardRepository> = {
    countStudents: jest.fn().mockResolvedValue(3),
    getStudentPage: jest.fn().mockResolvedValue([ROWS.ana, ROWS.beto, ROWS.caro]),
    getStudentIds: jest.fn().mockResolvedValue(["ana", "beto", "caro"]),
    getStudentRows: jest.fn().mockImplementation((ids: string[]) => Promise.resolve(ids.map((id: string) => ROWS[id]))),
    getStudentProfile: jest.fn(),
    getStudentActivity: jest.fn(),
    getTeachers: jest.fn(),
    getPlatformCounts: jest.fn(),
  };
  const groups: { getManageableStudentGroupIds: jest.Mock } = {
    getManageableStudentGroupIds: jest.fn().mockImplementation((actor: { role: string }) => Promise.resolve(actor.role === "ADMIN" ? ["group-a", "group-old", "group-z"] : managedGroupIds)),
  };
  const progress: { getProgressForUsers: jest.Mock; getLastActivityForUsers: jest.Mock } = {
    getProgressForUsers: jest.fn().mockImplementation((ids: string[]) => Promise.resolve(ids.map(report))),
    getLastActivityForUsers: jest.fn().mockResolvedValue([{ userId: "ana", lastActivityAt: new Date("2026-10-30T12:00:00Z") }]),
  };

  return {
    useCase: new GetAdminStudentsUseCase(repository, groups as unknown as GroupsFacade, progress as unknown as LearningProgressFacade),
    repository,
    groups,
  };
}

function query(overrides: Partial<GetAdminStudentsQuery> = {}): GetAdminStudentsQuery {
  return { actor: TEACHER, page: 1, limit: 20, myGroups: false, sortBy: "name", sortOrder: "asc", ...overrides };
}

describe("GetAdminStudentsUseCase", () => {
  it("returns an empty page when a teacher filters by their groups and manages none", async () => {
    const { useCase, repository }: Harness = build([]);

    const page: Paginated<AdminStudentListItem> = await useCase.execute(query({ myGroups: true }));

    expect(page.data).toEqual([]);
    expect(page.pagination.total).toBe(0);
    expect(repository.countStudents).not.toHaveBeenCalled();
    expect(repository.getStudentPage).not.toHaveBeenCalled();
  });

  it("filters by the managed groups and searches name, email or code through the repository", async () => {
    const { useCase, repository }: Harness = build();

    await useCase.execute(query({ myGroups: true, search: "2026" }));

    expect(repository.countStudents).toHaveBeenCalledWith({ search: "2026", groupIds: ["group-a", "group-old"] });
    expect(repository.getStudentPage).toHaveBeenCalledWith({ search: "2026", groupIds: ["group-a", "group-old"] }, { sortBy: "name", sortOrder: "asc", skip: 0, take: 20 });
  });

  it("keeps a requested group with myGroups only when the teacher manages it", async () => {
    const { useCase, repository }: Harness = build();

    const outside: Paginated<AdminStudentListItem> = await useCase.execute(query({ myGroups: true, groupId: "group-z" }));
    await useCase.execute(query({ myGroups: true, groupId: "group-a" }));

    expect(outside.data).toEqual([]);
    expect(repository.countStudents).toHaveBeenCalledTimes(1);
    expect(repository.countStudents).toHaveBeenCalledWith({ search: undefined, groupIds: ["group-a"] });
  });

  it("maps progress, code, active groups and canView for a teacher (inactive managed groups count)", async () => {
    const { useCase }: Harness = build();

    const page: Paginated<AdminStudentListItem> = await useCase.execute(query());

    expect(page.data.map((item: AdminStudentListItem) => [item.id, item.canView])).toEqual([
      ["ana", true],
      ["beto", true],
      ["caro", false],
    ]);
    expect(page.data[0]).toEqual({
      id: "ana",
      name: "Ana",
      email: "ana@example.edu",
      studentCode: "2026-01",
      groupName: "Grupo A",
      groups: [{ id: "group-a", name: "Grupo A" }],
      canView: true,
      overallProgress: 40,
      completedModules: 0,
      totalModules: 2,
      lastActivity: new Date("2026-10-30T12:00:00Z"),
    });
  });

  it("lets an administrator open every student", async () => {
    const { useCase, groups }: Harness = build();

    const page: Paginated<AdminStudentListItem> = await useCase.execute(query({ actor: ADMIN }));

    expect(page.data.every((item: AdminStudentListItem) => item.canView)).toBe(true);
    expect(groups.getManageableStudentGroupIds).not.toHaveBeenCalled();
  });

  it("sorts by progress over every matching student before paging", async () => {
    const { useCase, repository }: Harness = build();

    const page: Paginated<AdminStudentListItem> = await useCase.execute(query({ sortBy: "progress", sortOrder: "desc", limit: 2 }));

    expect(page.data.map((item: AdminStudentListItem) => item.id)).toEqual(["beto", "ana"]);
    expect(page.pagination).toEqual(expect.objectContaining({ total: 3, pages: 2, page: 1 }));
    expect(repository.getStudentRows).toHaveBeenCalledWith(["beto", "ana"]);
    expect(repository.getStudentPage).not.toHaveBeenCalled();
  });
});
