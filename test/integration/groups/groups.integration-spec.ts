/*
 * Funcionalidad: Prueba de integración de grupos
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica bajo concurrencia las reglas de grupos protegidas con pg_advisory_xact_lock: N altas simultáneas del mismo estudiante en N grupos STUDENT activos dejan exactamente una membresía (las demás StudentAlreadyInGroupError), N asignaciones simultáneas de líder dejan exactamente un LEADER sincronizado con simulatorLeaderId, y que borrar un grupo con subgrupos se rechace (409) sin borrar filas, que uno sin actividad se borre físicamente y que uno con miembros solo se desactive conservando su historial
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupMember, type User } from "@prisma/client";

import { AddGroupMemberCommand } from "@/features/groups/application/commands/add-group-member.command";
import { DeleteGroupCommand } from "@/features/groups/application/commands/delete-group.command";
import { SetSimulatorLeadCommand } from "@/features/groups/application/commands/set-simulator-lead.command";
import { AddGroupMemberUseCase } from "@/features/groups/application/use-cases/add-group-member.usecase";
import { type DeleteGroupOutcome, DeleteGroupUseCase } from "@/features/groups/application/use-cases/delete-group.usecase";
import { SetSimulatorLeadUseCase } from "@/features/groups/application/use-cases/set-simulator-lead.usecase";
import { GroupHasSubgroupsError, StudentAlreadyInGroupError } from "@/features/groups/domain/groups.errors";

import { createAdmin, createStudent, createStudentGroup, createTeacher, type GroupWithMembers } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 8;

function rejectedWith(results: PromiseSettledResult<unknown>[], errorClass: new (...args: never[]) => Error): number {
  return results.filter((result: PromiseSettledResult<unknown>): boolean => result.status === "rejected" && result.reason instanceof errorClass).length;
}

function fulfilled(results: PromiseSettledResult<unknown>[]): number {
  return results.filter((result: PromiseSettledResult<unknown>): boolean => result.status === "fulfilled").length;
}

describe("groups against PostgreSQL", () => {
  let harness: IntegrationApp;
  let admin: User;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    admin = await createAdmin(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it(`should keep a student in one active student group when ${CONCURRENCY} additions race`, async () => {
    const teacher: User = await createTeacher(harness.prisma);
    const student: User = await createStudent(harness.prisma);
    const groups: GroupWithMembers[] = [];

    for (let index: number = 0; index < CONCURRENCY; index++) {
      groups.push(await createStudentGroup(harness.prisma, { createdBy: teacher }));
    }

    const useCase: AddGroupMemberUseCase = harness.app.get(AddGroupMemberUseCase);

    const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
      groups.map((entry: GroupWithMembers): Promise<unknown> =>
        useCase.execute(new AddGroupMemberCommand({ groupId: entry.group.id, userId: student.id, performedBy: admin.id, performedByRole: "ADMIN" })),
      ),
    );

    expect(fulfilled(results)).toBe(1);
    expect(rejectedWith(results, StudentAlreadyInGroupError)).toBe(CONCURRENCY - 1);
    expect(await harness.prisma.groupMember.count({ where: { userId: student.id, group: { type: "STUDENT", isActive: true } } })).toBe(1);
  });

  it(`should end with exactly one synchronized leader when ${CONCURRENCY} leader assignments race`, async () => {
    const members: User[] = [];

    for (let index: number = 0; index < CONCURRENCY; index++) {
      members.push(await createStudent(harness.prisma));
    }

    const { group } = await createStudentGroup(harness.prisma, { members });
    const useCase: SetSimulatorLeadUseCase = harness.app.get(SetSimulatorLeadUseCase);

    const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
      members.map((member: User): Promise<unknown> =>
        useCase.execute(new SetSimulatorLeadCommand({ groupId: group.id, userId: member.id, performedBy: admin.id, performedByRole: "ADMIN" })),
      ),
    );

    const leaders: GroupMember[] = await harness.prisma.groupMember.findMany({ where: { groupId: group.id, memberRole: "LEADER" } });
    const stored: { simulatorLeaderId: string | null } | null = await harness.prisma.group.findUnique({ where: { id: group.id }, select: { simulatorLeaderId: true } });

    expect(fulfilled(results)).toBe(CONCURRENCY);
    expect(leaders).toHaveLength(1);
    expect(stored?.simulatorLeaderId).toBe(leaders[0].userId);
  });

  it("should reject deleting a group that still has subgroups without deleting anything", async () => {
    const teacher: User = await createTeacher(harness.prisma);
    const parent: GroupWithMembers = await createStudentGroup(harness.prisma, { createdBy: teacher });

    await createStudentGroup(harness.prisma, { createdBy: teacher, parentGroupId: parent.group.id, depth: 1 });

    const deletion: Promise<DeleteGroupOutcome> = harness.app.get(DeleteGroupUseCase).execute(new DeleteGroupCommand({ groupId: parent.group.id, performedBy: admin.id, performedByRole: "ADMIN" }));

    await expect(deletion).rejects.toBeInstanceOf(GroupHasSubgroupsError);
    expect(await harness.prisma.group.count()).toBe(2);
  });

  it("should physically delete a group that never had activity", async () => {
    const { group } = await createStudentGroup(harness.prisma);

    const outcome: DeleteGroupOutcome = await harness.app.get(DeleteGroupUseCase).execute(new DeleteGroupCommand({ groupId: group.id, performedBy: admin.id, performedByRole: "ADMIN" }));

    expect(outcome).toBe("deleted");
    expect(await harness.prisma.group.count({ where: { id: group.id } })).toBe(0);
  });

  it("should only deactivate a group with members, keeping its membership history", async () => {
    const student: User = await createStudent(harness.prisma);
    const { group } = await createStudentGroup(harness.prisma, { members: [student], leader: student });

    const outcome: DeleteGroupOutcome = await harness.app.get(DeleteGroupUseCase).execute(new DeleteGroupCommand({ groupId: group.id, performedBy: admin.id, performedByRole: "ADMIN" }));

    expect(outcome).toBe("deactivated");
    expect(await harness.prisma.group.findUnique({ where: { id: group.id }, select: { isActive: true } })).toEqual({ isActive: false });
    expect(await harness.prisma.groupMember.count({ where: { groupId: group.id } })).toBe(1);
  });
});
