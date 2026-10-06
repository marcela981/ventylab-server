/*
 * Funcionalidad: Pruebas del caso de uso SetSimulatorLeadUseCase
 * Descripción: Verifica que asignar líder degrada al anterior y sincroniza simulatorLeaderId bajo el bloqueo del grupo, que el líder debe ser miembro, que solo los grupos STUDENT tienen líder, que limpiar el líder degrada a todos y el alcance de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SetSimulatorLeadCommand } from "@/features/groups/application/commands/set-simulator-lead.command";
import {
  buildDoubles,
  buildGroup,
  buildMember,
  type GroupsDoubles,
  TRANSACTION,
} from "@/features/groups/application/testing/groups-test-doubles-spec";
import { SetSimulatorLeadUseCase } from "@/features/groups/application/use-cases/set-simulator-lead.usecase";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import {
  GroupLeaderNotAllowedError,
  GroupManagementForbiddenError,
  SimulatorLeadNotMemberError,
} from "@/features/groups/domain/groups.errors";
import { groupLeadershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

function buildUseCase(doubles: GroupsDoubles): SetSimulatorLeadUseCase {
  return new SetSimulatorLeadUseCase(
    doubles.groupsRepository,
    doubles.membersRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.eventBus,
  );
}

function command(userId: string | undefined, performedBy: string = "teacher-1", performedByRole: string = "TEACHER"): SetSimulatorLeadCommand {
  return new SetSimulatorLeadCommand({ groupId: "group-1", userId, performedBy, performedByRole });
}

describe("SetSimulatorLeadUseCase", () => {
  it("promotes the new leader, demotes the previous one and syncs simulatorLeaderId under the group lock", async () => {
    const previous: GroupMember = buildMember({ userId: "student-1", memberRole: "LEADER" });
    const next: GroupMember = buildMember({ userId: "student-2" });
    const group: Group = buildGroup({ simulatorLeaderId: "student-1" });
    const doubles: GroupsDoubles = buildDoubles({ groups: [group], members: [previous, next] });

    await buildUseCase(doubles).execute(command("student-2"));

    expect(doubles.acquireLock).toHaveBeenCalledWith(groupLeadershipLockKey("group-1"), TRANSACTION);
    expect(previous.memberRole).toBe("MEMBER");
    expect(next.memberRole).toBe("LEADER");
    expect(group.simulatorLeaderId).toBe("student-2");
    expect(doubles.saveMember).toHaveBeenCalledWith(previous, TRANSACTION);
    expect(doubles.saveMember).toHaveBeenCalledWith(next, TRANSACTION);
    expect(doubles.saveGroup).toHaveBeenCalledWith(group, TRANSACTION);
  });

  it("requires the leader to be a member", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-9"));

    await expect(result).rejects.toBeInstanceOf(SimulatorLeadNotMemberError);
  });

  it("refuses a leader in a teacher group", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ type: "TEACHER", createdBy: "admin-1" })],
      members: [buildMember({ userId: "teacher-2", role: "TEACHER" })],
    });

    const result: Promise<void> = buildUseCase(doubles).execute(command("teacher-2", "admin-1", "ADMIN"));

    await expect(result).rejects.toBeInstanceOf(GroupLeaderNotAllowedError);
  });

  it("clears the leader, demoting every LEADER membership", async () => {
    const previous: GroupMember = buildMember({ userId: "student-1", memberRole: "LEADER" });
    const group: Group = buildGroup({ simulatorLeaderId: "student-1" });
    const doubles: GroupsDoubles = buildDoubles({ groups: [group], members: [previous] });

    await buildUseCase(doubles).execute(command(undefined));

    expect(previous.memberRole).toBe("MEMBER");
    expect(group.simulatorLeaderId).toBeUndefined();
  });

  it("rejects a teacher outside the management scope", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()], members: [buildMember({ userId: "student-1" })] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("student-1", "teacher-9"));

    await expect(result).rejects.toBeInstanceOf(GroupManagementForbiddenError);
  });
});
