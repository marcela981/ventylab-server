/*
 * Funcionalidad: Pruebas del caso de uso GetGroupByIdUseCase
 * Descripción: Verifica que un estudiante solo ve su propio grupo STUDENT y recibe 404 para cualquier otro, y que el profesor ve solo los grupos que gestiona
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildDoubles, buildGroup, buildMember, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { GetGroupByIdUseCase } from "@/features/groups/application/use-cases/get-group-by-id.usecase";
import { GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { type GroupDetailView } from "@/features/groups/domain/read-models/group.read-model";

function buildUseCase(doubles: GroupsDoubles): GetGroupByIdUseCase {
  return new GetGroupByIdUseCase(doubles.groupsRepository, doubles.access);
}

describe("GetGroupByIdUseCase", () => {
  it("returns the group to a student member", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()], members: [buildMember({ userId: "student-1" })] });

    const view: GroupDetailView = await buildUseCase(doubles).execute("group-1", { id: "student-1", role: "STUDENT" });

    expect(view.group.id).toBe("group-1");
  });

  it("hides the group from a student who is not a member", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup()] });

    const result: Promise<GroupDetailView> = buildUseCase(doubles).execute("group-1", { id: "student-2", role: "STUDENT" });

    await expect(result).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it("hides a student group from a teacher outside its scope", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup({ createdBy: "teacher-2" })] });

    const result: Promise<GroupDetailView> = buildUseCase(doubles).execute("group-1", { id: "teacher-1", role: "TEACHER" });

    await expect(result).rejects.toBeInstanceOf(GroupNotFoundError);
  });

  it("returns a student group to the teacher who created it", async () => {
    const doubles: GroupsDoubles = buildDoubles({ groups: [buildGroup({ createdBy: "teacher-1" })] });

    const view: GroupDetailView = await buildUseCase(doubles).execute("group-1", { id: "teacher-1", role: "TEACHER" });

    expect(view.group.id).toBe("group-1");
  });
});
