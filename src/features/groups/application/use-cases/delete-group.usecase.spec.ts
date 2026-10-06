/*
 * Funcionalidad: Pruebas del caso de uso DeleteGroupUseCase
 * Descripción: Verifica el borrado físico de un grupo sin historial, la desactivación cuando tiene historial, el bloqueo por subgrupos y el alcance de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DeleteGroupCommand } from "@/features/groups/application/commands/delete-group.command";
import { buildDoubles, buildGroup, type GroupsDoubles, TRANSACTION } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { type DeleteGroupOutcome, DeleteGroupUseCase } from "@/features/groups/application/use-cases/delete-group.usecase";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupHasSubgroupsError, GroupManagementForbiddenError } from "@/features/groups/domain/groups.errors";

function buildUseCase(doubles: GroupsDoubles): DeleteGroupUseCase {
  return new DeleteGroupUseCase(doubles.groupsRepository, doubles.access, doubles.transactionManager, doubles.eventBus);
}

function command(performedBy: string = "teacher-1", performedByRole: string = "TEACHER"): DeleteGroupCommand {
  return new DeleteGroupCommand({ groupId: "group-1", performedBy, performedByRole });
}

describe("DeleteGroupUseCase", () => {
  it("deletes a group that never had activity", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()], hasActivityHistory: false });

    const outcome: DeleteGroupOutcome = await buildUseCase(doubles).execute(command());

    expect(outcome).toBe("deleted");
    expect(doubles.deleteGroup).toHaveBeenCalled();
    expect(doubles.saveGroup).not.toHaveBeenCalled();
  });

  it("deactivates a group with history instead of deleting it", async () => {
    const group: Group = buildGroup();
    const doubles: GroupsDoubles = buildDoubles({ groups: [group], hasActivityHistory: true });

    const outcome: DeleteGroupOutcome = await buildUseCase(doubles).execute(command());

    expect(outcome).toBe("deactivated");
    expect(group.isActive).toBe(false);
    expect(doubles.saveGroup).toHaveBeenCalledWith(group, TRANSACTION);
    expect(doubles.deleteGroup).not.toHaveBeenCalled();
  });

  it("keeps the subgroup guard", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()], subgroups: 1 });

    const result: Promise<DeleteGroupOutcome> = buildUseCase(doubles).execute(command());

    await expect(result).rejects.toBeInstanceOf(GroupHasSubgroupsError);
  });

  it("denies a teacher on a teacher group", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup({ type: "TEACHER", createdBy: "teacher-1" })] });

    const result: Promise<DeleteGroupOutcome> = buildUseCase(doubles).execute(command());

    await expect(result).rejects.toBeInstanceOf(GroupManagementForbiddenError);
  });
});
