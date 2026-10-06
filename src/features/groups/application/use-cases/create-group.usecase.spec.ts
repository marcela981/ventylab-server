/*
 * Funcionalidad: Pruebas del caso de uso CreateGroupUseCase
 * Descripción: Verifica que el profesor solo crea grupos STUDENT, que el administrador crea grupos TEACHER y que el grupo se guarda con su tipo y su creador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CreateGroupCommand } from "@/features/groups/application/commands/create-group.command";
import { buildDoubles, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { CreateGroupUseCase } from "@/features/groups/application/use-cases/create-group.usecase";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupTypeCreationForbiddenError } from "@/features/groups/domain/groups.errors";
import { type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

function buildUseCase(doubles: GroupsDoubles): CreateGroupUseCase {
  return new CreateGroupUseCase(doubles.groupsRepository, doubles.transactionManager, doubles.eventBus);
}

function command(type: GroupTypeValue, performedByRole: string): CreateGroupCommand {
  return new CreateGroupCommand({ name: "Group", type, performedBy: "user-1", performedByRole });
}

describe("CreateGroupUseCase", () => {
  it("lets a teacher create a student group", async () => {
    const doubles: GroupsDoubles = buildDoubles();

    await buildUseCase(doubles).execute(command("STUDENT", "TEACHER"));

    const saved: Group = doubles.saveGroup.mock.calls[0][0] as Group;

    expect(saved.type).toBe("STUDENT");
    expect(saved.createdBy).toBe("user-1");
    expect(doubles.saveMember).not.toHaveBeenCalled();
  });

  it("forbids a teacher from creating a teacher group", async () => {
    const doubles: GroupsDoubles = buildDoubles();

    const result: Promise<string> = buildUseCase(doubles).execute(command("TEACHER", "TEACHER"));

    await expect(result).rejects.toBeInstanceOf(GroupTypeCreationForbiddenError);
    expect(doubles.saveGroup).not.toHaveBeenCalled();
  });

  it("lets an admin create a teacher group", async () => {
    const doubles: GroupsDoubles = buildDoubles();

    await buildUseCase(doubles).execute(command("TEACHER", "ADMIN"));

    const saved: Group = doubles.saveGroup.mock.calls[0][0] as Group;

    expect(saved.type).toBe("TEACHER");
  });
});
