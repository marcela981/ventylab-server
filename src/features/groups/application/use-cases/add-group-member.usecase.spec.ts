/*
 * Funcionalidad: Pruebas del caso de uso AddGroupMemberUseCase
 * Descripción: Verifica el rol admitido por tipo de grupo (422), el único grupo STUDENT activo por estudiante con su bloqueo (409), el alcance de gestión del profesor (403), el usuario inexistente y el alta como MEMBER con el rol heredado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AddGroupMemberCommand } from "@/features/groups/application/commands/add-group-member.command";
import {
  buildAccount,
  buildDoubles,
  buildGroup,
  type GroupsDoubles,
  type GroupsState,
  TRANSACTION,
} from "@/features/groups/application/testing/groups-test-doubles-spec";
import { AddGroupMemberUseCase } from "@/features/groups/application/use-cases/add-group-member.usecase";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import {
  GroupManagementForbiddenError,
  GroupMemberRoleNotAllowedError,
  GroupUserNotFoundError,
  StudentAlreadyInGroupError,
} from "@/features/groups/domain/groups.errors";
import { studentMembershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

function buildUseCase(doubles: GroupsDoubles): AddGroupMemberUseCase {
  return new AddGroupMemberUseCase(
    doubles.groupsRepository,
    doubles.membersRepository,
    doubles.usersFacade,
    doubles.access,
    doubles.transactionManager,
    doubles.eventBus,
  );
}

function command(userId: string, performedBy: string = "teacher-1", performedByRole: string = "TEACHER"): AddGroupMemberCommand {
  return new AddGroupMemberCommand({ groupId: "group-1", userId, performedBy, performedByRole });
}

function studentGroupState(): GroupsState {
  return {
    groups: [buildGroup({ type: "STUDENT", createdBy: "teacher-1" })],
    users: [buildAccount("student-1", "STUDENT"), buildAccount("teacher-2", "TEACHER")],
  };
}

describe("AddGroupMemberUseCase", () => {
  it("adds a student to a student group as MEMBER with the legacy STUDENT role, locking per student", async () => {
    const doubles: GroupsDoubles = buildDoubles(studentGroupState());

    await buildUseCase(doubles).execute(command("student-1"));

    const saved: GroupMember = doubles.saveMember.mock.calls[0][0] as GroupMember;

    expect(doubles.acquireLock).toHaveBeenCalledWith(studentMembershipLockKey("student-1"), TRANSACTION);
    expect(saved.memberRole).toBe("MEMBER");
    expect(saved.role).toBe("STUDENT");
    expect(doubles.publish).toHaveBeenCalled();
  });

  it("rejects a teacher in a student group with 422", async () => {
    const doubles: GroupsDoubles = buildDoubles(studentGroupState());

    const result: Promise<void> = buildUseCase(doubles).execute(command("teacher-2"));

    await expect(result).rejects.toBeInstanceOf(GroupMemberRoleNotAllowedError);
    expect(doubles.saveMember).not.toHaveBeenCalled();
  });

  it("rejects a student in a teacher group with 422", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ type: "TEACHER", createdBy: "admin-1" })],
      users: [buildAccount("student-1", "STUDENT")],
    });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-1", "admin-1", "ADMIN"));

    await expect(result).rejects.toBeInstanceOf(GroupMemberRoleNotAllowedError);
  });

  it("accepts a teacher in a teacher group when an admin adds them", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ type: "TEACHER", createdBy: "admin-1" })],
      users: [buildAccount("teacher-2", "TEACHER")],
    });

    await buildUseCase(doubles).execute(command("teacher-2", "admin-1", "ADMIN"));

    const saved: GroupMember = doubles.saveMember.mock.calls[0][0] as GroupMember;

    expect(saved.role).toBe("TEACHER");
    expect(doubles.acquireLock).not.toHaveBeenCalled();
  });

  it("rejects a student who already belongs to another active student group with 409", async () => {
    const doubles: GroupsDoubles = buildDoubles({ ...studentGroupState(), otherActiveStudentMemberships: 1 });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-1"));

    await expect(result).rejects.toBeInstanceOf(StudentAlreadyInGroupError);
    expect(doubles.saveMember).not.toHaveBeenCalled();
  });

  it("rejects a teacher who neither created nor supervises the group with 403", async () => {
    const doubles: GroupsDoubles = buildDoubles(studentGroupState());

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-1", "teacher-9"));

    await expect(result).rejects.toBeInstanceOf(GroupManagementForbiddenError);
  });

  it("lets a teacher whose teacher group supervises the group add members", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      ...studentGroupState(),
      supervisedByTeacher: [{ teacherUserId: "teacher-9", studentGroupId: "group-1" }],
    });

    await buildUseCase(doubles).execute(command("student-1", "teacher-9"));

    expect(doubles.saveMember).toHaveBeenCalled();
  });

  it("rejects an unknown user", async () => {
    const doubles: GroupsDoubles = buildDoubles(studentGroupState());

    const result: Promise<void> = buildUseCase(doubles).execute(command("ghost"));

    await expect(result).rejects.toBeInstanceOf(GroupUserNotFoundError);
  });
});
