/*
 * Funcionalidad: Pruebas del caso de uso RemoveGroupMemberUseCase
 * Descripción: Verifica que retirar al líder anula simulatorLeaderId en la misma transacción, que retirar a otro miembro no lo toca, que el miembro debe existir y el alcance de gestión del profesor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RemoveGroupMemberCommand } from "@/features/groups/application/commands/remove-group-member.command";
import {
  buildDoubles,
  buildGroup,
  buildMember,
  type GroupsDoubles,
  TRANSACTION,
} from "@/features/groups/application/testing/groups-test-doubles-spec";
import { RemoveGroupMemberUseCase } from "@/features/groups/application/use-cases/remove-group-member.usecase";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupManagementForbiddenError, GroupMemberNotFoundError } from "@/features/groups/domain/groups.errors";

function buildUseCase(doubles: GroupsDoubles): RemoveGroupMemberUseCase {
  return new RemoveGroupMemberUseCase(
    doubles.groupsRepository,
    doubles.membersRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.eventBus,
  );
}

function command(userId: string, performedBy: string = "teacher-1"): RemoveGroupMemberCommand {
  return new RemoveGroupMemberCommand({ groupId: "group-1", userId, performedBy, performedByRole: "TEACHER" });
}

describe("RemoveGroupMemberUseCase", () => {
  it("nulls simulatorLeaderId when the removed member is the leader", async () => {
    const leader: GroupMember = buildMember({ userId: "student-1", memberRole: "LEADER" });
    const group: Group = buildGroup({ simulatorLeaderId: "student-1" });
    const doubles: GroupsDoubles = buildDoubles({ groups: [group], members: [leader] });

    await buildUseCase(doubles).execute(command("student-1"));

    expect(group.simulatorLeaderId).toBeUndefined();
    expect(doubles.saveGroup).toHaveBeenCalledWith(group, TRANSACTION);
    expect(doubles.deleteMember).toHaveBeenCalledWith(leader, TRANSACTION);
  });

  it("keeps the leader when another member leaves", async () => {
    const group: Group = buildGroup({ simulatorLeaderId: "student-1" });
    const doubles: GroupsDoubles = buildDoubles({
      groups: [group],
      members: [buildMember({ userId: "student-1", memberRole: "LEADER" }), buildMember({ userId: "student-2" })],
    });

    await buildUseCase(doubles).execute(command("student-2"));

    expect(group.simulatorLeaderId).toBe("student-1");
    expect(doubles.saveGroup).not.toHaveBeenCalled();
  });

  it("fails when the user is not a member", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-9"));

    await expect(result).rejects.toBeInstanceOf(GroupMemberNotFoundError);
  });

  it("rejects a teacher outside the management scope", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()], members: [buildMember({ userId: "student-1" })] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-1", "teacher-9"));

    await expect(result).rejects.toBeInstanceOf(GroupManagementForbiddenError);
  });
});
