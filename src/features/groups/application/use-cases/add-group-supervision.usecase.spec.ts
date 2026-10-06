/*
 * Funcionalidad: Pruebas del caso de uso AddGroupSupervisionUseCase
 * Descripción: Verifica que solo se vinculan grupos TEACHER con grupos STUDENT (422), que ambos grupos deben existir, que el alta es idempotente y que queda auditada en el grupo TEACHER
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuditLog } from "@/common/domain/entities/audit-log.entity";
import { AddGroupSupervisionCommand } from "@/features/groups/application/commands/add-group-supervision.command";
import { buildDoubles, buildGroup, type GroupsDoubles, TRANSACTION } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { AddGroupSupervisionUseCase } from "@/features/groups/application/use-cases/add-group-supervision.usecase";
import { type Group, type GroupAuditAction } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError, InvalidGroupSupervisionError } from "@/features/groups/domain/groups.errors";

function buildUseCase(doubles: GroupsDoubles): AddGroupSupervisionUseCase {
  return new AddGroupSupervisionUseCase(doubles.groupsRepository, doubles.supervisionsRepository, doubles.transactionManager, doubles.eventBus);
}

function command(teacherGroupId: string, studentGroupId: string): AddGroupSupervisionCommand {
  return new AddGroupSupervisionCommand({ teacherGroupId, studentGroupId, performedBy: "admin-1" });
}

describe("AddGroupSupervisionUseCase", () => {
  it("links a teacher group to a student group and audits it", async () => {
    const teacherGroup: Group = buildGroup({ id: "teachers", type: "TEACHER", createdBy: "admin-1" });
    const doubles: GroupsDoubles = buildDoubles({ groups: [teacherGroup, buildGroup({ id: "students" })] });

    await buildUseCase(doubles).execute(command("teachers", "students"));

    const actions: string[] = teacherGroup.auditLogs.map((log: AuditLog<GroupAuditAction>) => log.action);

    expect(doubles.addSupervision).toHaveBeenCalledWith("teachers", "students", TRANSACTION);
    expect(doubles.saveGroup).toHaveBeenCalledWith(teacherGroup, TRANSACTION);
    expect(actions).toContain("group_supervision_added");
  });

  it("rejects links that are not teacher to student with 422", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup({ id: "a" }), buildGroup({ id: "b" })] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("a", "b"));

    await expect(result).rejects.toBeInstanceOf(InvalidGroupSupervisionError);
  });

  it("requires both groups to exist", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup({ id: "teachers", type: "TEACHER" })] });

    const result: Promise<void> = buildUseCase(doubles).execute(command("teachers", "missing"));

    await expect(result).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it("does nothing when the link already exists", async () => {
    const doubles: GroupsDoubles = buildDoubles({
      groups: [buildGroup({ id: "teachers", type: "TEACHER" }), buildGroup({ id: "students" })],
      supervisions: [{ teacherGroupId: "teachers", studentGroupId: "students" }],
    });

    await buildUseCase(doubles).execute(command("teachers", "students"));

    expect(doubles.addSupervision).not.toHaveBeenCalled();
  });
});
