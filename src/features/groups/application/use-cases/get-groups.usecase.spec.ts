/*
 * Funcionalidad: Pruebas de GetGroupsUseCase
 * Descripción: Verifica que el profesor siempre recibe el listado acotado a sus grupos con la relación MANAGED (creado) o SUPERVISED (supervisado) de cada grupo STUDENT leída con una sola consulta de supervisiones, que el administrador con myGroups recibe la misma relación y que el administrador sin acotar no la recibe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildGroup } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { GetGroupsUseCase } from "@/features/groups/application/use-cases/get-groups.usecase";
import { type GroupView } from "@/features/groups/domain/read-models/group.read-model";
import { type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor } from "@/features/groups/domain/services/group-management-policy";

const TEACHER: GroupActor = { id: "teacher-1", role: "TEACHER" };
const ADMIN: GroupActor = { id: "admin-1", role: "ADMIN" };

const VIEWS: GroupView[] = [
  { group: buildGroup({ id: "created", createdBy: "teacher-1" }), subGroups: [], membersCount: 3, subGroupsCount: 0 },
  { group: buildGroup({ id: "supervised", createdBy: "teacher-2" }), subGroups: [], membersCount: 2, subGroupsCount: 0 },
  { group: buildGroup({ id: "teachers", type: "TEACHER", createdBy: "admin-1" }), subGroups: [], membersCount: 5, subGroupsCount: 0 },
];

function buildRepository(): { repository: IGroupsRepository; getViews: jest.Mock; getSupervisedStudentGroupIds: jest.Mock } {
  const getViews: jest.Mock = jest.fn().mockResolvedValue(VIEWS);
  const getSupervisedStudentGroupIds: jest.Mock = jest.fn().mockImplementation((userId: string) => Promise.resolve(userId === "teacher-1" || userId === "admin-1" ? ["supervised"] : []));

  return { repository: { getViews, getSupervisedStudentGroupIds } as unknown as IGroupsRepository, getViews, getSupervisedStudentGroupIds };
}

function relations(views: GroupView[]): Record<string, string | undefined> {
  return Object.fromEntries(views.map((view: GroupView): [string, string | undefined] => [view.group.id, view.relation]));
}

describe("GetGroupsUseCase", () => {
  it("scopes a teacher to their groups and adds the relation of each student group", async () => {
    const { repository, getViews, getSupervisedStudentGroupIds } = buildRepository();

    const views: GroupView[] = await new GetGroupsUseCase(repository).execute({}, TEACHER);

    expect(getViews).toHaveBeenCalledWith({ managedByTeacherId: "teacher-1" });
    expect(getSupervisedStudentGroupIds).toHaveBeenCalledTimes(1);
    expect(relations(views)).toEqual({ created: "MANAGED", supervised: "SUPERVISED", teachers: undefined });
  });

  it("adds the relation for an admin listing their own groups and omits it otherwise", async () => {
    const { repository, getSupervisedStudentGroupIds } = buildRepository();

    const own: GroupView[] = await new GetGroupsUseCase(repository).execute({ managedByTeacherId: "admin-1" }, ADMIN);
    const all: GroupView[] = await new GetGroupsUseCase(repository).execute({}, ADMIN);

    expect(relations(own)).toEqual({ created: undefined, supervised: "SUPERVISED", teachers: undefined });
    expect(all.every((view: GroupView) => view.relation === undefined)).toBe(true);
    expect(getSupervisedStudentGroupIds).toHaveBeenCalledTimes(1);
  });
});
