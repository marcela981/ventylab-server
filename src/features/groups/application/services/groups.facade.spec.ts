/*
 * Funcionalidad: Pruebas de GroupsFacade
 * Descripción: Verifica las lecturas públicas de la feature de grupos con repositorios simulados: grupo STUDENT del usuario, miembros, liderazgo, pertenencia, grupos supervisados por un profesor y alcance de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GroupsFacade, type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";
import { buildDoubles, buildGroup, buildMember, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";

function buildFacade(doubles: GroupsDoubles): GroupsFacade {
  return new GroupsFacade(doubles.groupsRepository, doubles.membersRepository, doubles.access);
}

function defaultDoubles(): GroupsDoubles {
  return buildDoubles({
    groups: [buildGroup({ createdBy: "teacher-1" })],
    members: [buildMember({ userId: "student-1", memberRole: "LEADER" }), buildMember({ userId: "student-2" })],
    supervisedByTeacher: [{ teacherUserId: "teacher-9", studentGroupId: "group-1" }],
  });
}

describe("GroupsFacade", () => {
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
});
