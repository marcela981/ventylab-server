/*
 * Funcionalidad: Pruebas del caso de uso UpdateGroupUseCase
 * Descripción: Verifica que reactivar un grupo STUDENT revise, bajo pg_advisory_xact_lock por estudiante, que ningún miembro pertenezca a otro grupo STUDENT activo (409), y que las demás actualizaciones no tomen bloqueos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { UpdateGroupCommand } from "@/features/groups/application/commands/update-group.command";
import {
  buildDoubles,
  buildGroup,
  buildMember,
  type GroupsDoubles,
  type GroupsState,
  TRANSACTION,
} from "@/features/groups/application/testing/groups-test-doubles-spec";
import { UpdateGroupUseCase } from "@/features/groups/application/use-cases/update-group.usecase";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { StudentAlreadyInGroupError } from "@/features/groups/domain/groups.errors";
import { studentMembershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

function buildUseCase(doubles: GroupsDoubles): UpdateGroupUseCase {
  return new UpdateGroupUseCase(doubles.groupsRepository, doubles.membersRepository, doubles.access, doubles.transactionManager, doubles.eventBus);
}

function command(changes: { isActive?: boolean; name?: string }): UpdateGroupCommand {
  return new UpdateGroupCommand({ groupId: "group-1", performedBy: "admin-1", performedByRole: "ADMIN", ...changes });
}

function inactiveStudentGroupState(extra: GroupsState = {}): GroupsState {
  return {
    groups: [buildGroup({ type: "STUDENT", isActive: false })],
    members: [buildMember({ userId: "student-2" }), buildMember({ userId: "student-1" })],
    ...extra,
  };
}

describe("UpdateGroupUseCase", () => {
  it("rejects reactivating a student group when a member already belongs to another active student group with 409", async () => {
    const doubles: GroupsDoubles = buildDoubles(inactiveStudentGroupState({ studentsInOtherActiveGroups: ["student-2"] }));

    const result: Promise<void> = buildUseCase(doubles).execute(command({ isActive: true }));

    await expect(result).rejects.toBeInstanceOf(StudentAlreadyInGroupError);
    expect(doubles.saveGroup).not.toHaveBeenCalled();
  });

  it("reactivates a student group after locking every student member in a stable order", async () => {
    const doubles: GroupsDoubles = buildDoubles(inactiveStudentGroupState());

    await buildUseCase(doubles).execute(command({ isActive: true }));

    const saved: Group = doubles.saveGroup.mock.calls[0][0] as Group;

    expect(doubles.acquireLock.mock.calls).toEqual([
      [studentMembershipLockKey("student-1"), TRANSACTION],
      [studentMembershipLockKey("student-2"), TRANSACTION],
    ]);
    expect(saved.isActive).toBe(true);
    expect(doubles.publish).toHaveBeenCalled();
  });

  it("does not check memberships when reactivating a teacher group", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ type: "TEACHER", isActive: false })],
      members: [buildMember({ userId: "teacher-2", role: "TEACHER" })],
    });

    await buildUseCase(doubles).execute(command({ isActive: true }));

    expect(doubles.acquireLock).not.toHaveBeenCalled();
    expect(doubles.saveGroup).toHaveBeenCalled();
  });

  it("does not check memberships when the group is already active or the update does not reactivate it", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ type: "STUDENT", isActive: true })],
      members: [buildMember({ userId: "student-1" })],
      studentsInOtherActiveGroups: ["student-1"],
    });

    await buildUseCase(doubles).execute(command({ isActive: true, name: "Renamed" }));

    expect(doubles.acquireLock).not.toHaveBeenCalled();
    expect(doubles.saveGroup).toHaveBeenCalled();
  });
});
