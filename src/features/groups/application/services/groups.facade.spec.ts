/*
 * Funcionalidad: Pruebas de GroupsFacade
 * Descripción: Verifica las lecturas públicas de la feature de grupos con repositorios simulados: grupo STUDENT del usuario, miembros, liderazgo, pertenencia, grupos supervisados por un profesor, alcance de gestión y resumen de un grupo; los grupos STUDENT gestionables por actor con una sola lectura del repositorio de analítica, si un actor gestiona algún grupo STUDENT de un estudiante sin bucle por grupo y que las membresías de estudiantes se leen del repositorio de analítica
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GroupsFacade, type GroupMemberSummary, type GroupSummary } from "@/features/groups/application/services/groups.facade";
import { buildDoubles, buildGroup, buildMember, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import {
  type IGroupAnalyticsRepository,
  type StudentGroupIdsFilter,
  type StudentMembershipView,
} from "@/features/groups/domain/repositories/group-analytics.repository";

const MEMBERSHIPS: StudentMembershipView[] = [{ userId: "student-1", groupId: "group-1" }];

function buildAnalyticsRepository(): jest.Mocked<IGroupAnalyticsRepository> {
  return {
    getStudentMemberships: jest.fn().mockResolvedValue(MEMBERSHIPS),
    getStudentGroupIds: jest
      .fn()
      .mockImplementation((filter: StudentGroupIdsFilter) => Promise.resolve(filter.managedBy === "teacher-1" || filter.managedBy === undefined ? ["group-1"] : [])),
    isStudentMemberOfAny: jest
      .fn()
      .mockImplementation((userId: string, groupIds?: ReadonlyArray<string>) => Promise.resolve(userId === "student-1" && (groupIds === undefined || groupIds.includes("group-1")))),
  };
}

function buildFacade(doubles: GroupsDoubles, analytics: IGroupAnalyticsRepository = buildAnalyticsRepository()): GroupsFacade {
  return new GroupsFacade(doubles.groupsRepository, doubles.membersRepository, doubles.access, analytics);
}

function defaultDoubles(): GroupsDoubles {
  return buildDoubles({
    groups: [buildGroup({ createdBy: "teacher-1" })],
    members: [buildMember({ userId: "student-1", memberRole: "LEADER" }), buildMember({ userId: "student-2" })],
    supervisedByTeacher: [{ teacherUserId: "teacher-9", studentGroupId: "group-1" }],
  });
}

describe("GroupsFacade", () => {
  it("summarizes a group with its name, type and status", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const summaries: (GroupSummary | undefined)[] = [await facade.getGroupSummary("group-1"), await facade.getGroupSummary("ghost")];

    expect(summaries).toEqual([{ id: "group-1", name: "Group group-1", type: "STUDENT", isActive: true }, undefined]);
  });

  it("tells whether a user leads a group", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const results: boolean[] = [
      await facade.isGroupLeader("student-1", "group-1"),
      await facade.isGroupLeader("student-2", "group-1"),
      await facade.isGroupLeader("ghost", "group-1"),
    ];

    expect(results).toEqual([true, false, false]);
  });

  it("tells whether a user belongs to a group", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const results: boolean[] = [await facade.isMemberOf("student-2", "group-1"), await facade.isMemberOf("ghost", "group-1")];

    expect(results).toEqual([true, false]);
  });

  it("lists the members of a group with their membership role", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const members: GroupMemberSummary[] = await facade.getGroupMembers("group-1");

    expect(members.map((member: GroupMemberSummary) => [member.userId, member.memberRole])).toEqual([
      ["student-1", "LEADER"],
      ["student-2", "MEMBER"],
    ]);
  });

  it("returns the student groups supervised by a teacher", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const ids: string[] = await facade.getSupervisedStudentGroupIds("teacher-9");

    expect(ids).toEqual(["group-1"]);
  });

  it("returns the student group of a user", async () => {
    const doubles: GroupsDoubles = defaultDoubles();
    const summary: StudentGroupSummaryView = { id: "group-1", name: "Group", members: [], supervisingGroups: [] };

    (doubles.groupsRepository.getStudentGroupSummaryOfUser as jest.Mock).mockResolvedValue(summary);

    const result: StudentGroupSummaryView | undefined = await buildFacade(doubles).getStudentGroupOfUser("student-1");

    expect(result).toBe(summary);
  });

  it("applies the management scope, and denies unknown groups", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    const results: boolean[] = [
      await facade.canManageGroup({ id: "teacher-1", role: "TEACHER" }, "group-1"),
      await facade.canManageGroup({ id: "teacher-9", role: "TEACHER" }, "group-1"),
      await facade.canManageGroup({ id: "teacher-5", role: "TEACHER" }, "group-1"),
      await facade.canManageGroup({ id: "student-1", role: "STUDENT" }, "group-1"),
      await facade.canManageGroup({ id: "admin-1", role: "ADMIN" }, "missing"),
    ];

    expect(results).toEqual([true, true, false, false, false]);
  });

  it("tells whether an actor manages any student group of a student with batched reads", async () => {
    const analytics: jest.Mocked<IGroupAnalyticsRepository> = buildAnalyticsRepository();
    const facade: GroupsFacade = buildFacade(defaultDoubles(), analytics);

    const results: boolean[] = [
      await facade.canManageAnyGroupOfUser({ id: "teacher-1", role: "TEACHER" }, "student-1"),
      await facade.canManageAnyGroupOfUser({ id: "teacher-2", role: "TEACHER" }, "student-1"),
      await facade.canManageAnyGroupOfUser({ id: "teacher-1", role: "TEACHER" }, "outsider"),
      await facade.canManageAnyGroupOfUser({ id: "admin-1", role: "ADMIN" }, "student-1"),
    ];

    expect(results).toEqual([true, false, false, true]);
    expect(analytics.getStudentGroupIds).toHaveBeenCalledTimes(3);
    expect(analytics.getStudentGroupIds).toHaveBeenCalledWith({ managedBy: "teacher-1", groupIds: undefined });
    expect(analytics.isStudentMemberOfAny).toHaveBeenCalledWith("student-1", ["group-1"]);
    expect(analytics.isStudentMemberOfAny).toHaveBeenLastCalledWith("student-1");
  });

  it("returns the student groups an actor manages, narrowed to candidates, and none for students", async () => {
    const analytics: jest.Mocked<IGroupAnalyticsRepository> = buildAnalyticsRepository();
    const facade: GroupsFacade = buildFacade(defaultDoubles(), analytics);

    const results: string[][] = [
      await facade.getManageableStudentGroupIds({ id: "teacher-1", role: "TEACHER" }, ["group-1", "group-2"]),
      await facade.getManageableStudentGroupIds({ id: "student-1", role: "STUDENT" }),
    ];

    expect(results).toEqual([["group-1"], []]);
    expect(analytics.getStudentGroupIds).toHaveBeenCalledTimes(1);
    expect(analytics.getStudentGroupIds).toHaveBeenCalledWith({ managedBy: "teacher-1", groupIds: ["group-1", "group-2"] });
  });

  it("reads the student memberships from the analytics repository", async () => {
    const facade: GroupsFacade = buildFacade(defaultDoubles());

    expect(await facade.getStudentMemberships()).toEqual(MEMBERSHIPS);
  });
});
