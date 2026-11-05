/*
 * Funcionalidad: Pruebas de la consulta de grupos de estudiantes activos
 * Descripción: Verifica que GetStudentMembershipsUseCase devuelve el grupo STUDENT activo de cada usuario pedido, elimina ids repetidos y no consulta el repositorio sin usuarios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildDoubles, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { GetStudentMembershipsUseCase } from "@/features/groups/application/use-cases/get-student-memberships.usecase";
import { type UserActiveStudentGroupView } from "@/features/groups/domain/read-models/group.read-model";

describe("GetStudentMembershipsUseCase", () => {
  it("returns the active student group of each requested user, asking once per distinct id", async () => {
    const doubles: GroupsDoubles = buildDoubles({});
    const rows: UserActiveStudentGroupView[] = [{ userId: "student-1", group: { id: "group-1", name: "Grupo A" } }];
    const lookup: jest.Mock = doubles.groupsRepository.getActiveStudentGroupsOfUsers as jest.Mock;

    lookup.mockResolvedValue(rows);

    const result: UserActiveStudentGroupView[] = await new GetStudentMembershipsUseCase(doubles.groupsRepository).execute(["student-1", "student-2", "student-1"]);

    expect(result).toStrictEqual(rows);
    expect(lookup).toHaveBeenCalledWith(["student-1", "student-2"]);
  });

  it("does not query without users", async () => {
    const doubles: GroupsDoubles = buildDoubles({});

    await expect(new GetStudentMembershipsUseCase(doubles.groupsRepository).execute([])).resolves.toStrictEqual([]);
    expect(doubles.groupsRepository.getActiveStudentGroupsOfUsers).not.toHaveBeenCalled();
  });
});
