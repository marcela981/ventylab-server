/*
 * Funcionalidad: Caso de uso GetGroupsUseCase
 * Descripción: Lista grupos con líder, creador, grupo padre, subgrupos activos y conteos, filtrando por profesor, estudiante, grupo padre, profundidad, tipo o estado; el profesor solo ve los grupos STUDENT que gestiona y los grupos TEACHER a los que pertenece; ordena por profundidad y nombre; cuando el listado se acota al solicitante (profesor, o administrador con myGroups) añade a cada grupo STUDENT su relación MANAGED (creado) o SUPERVISED (supervisado) con una sola lectura de supervisiones
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type GetGroupsFilter, type GroupView } from "@/features/groups/domain/read-models/group.read-model";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor, groupRelationOf, isAdminActor } from "@/features/groups/domain/services/group-management-policy";

@Injectable()
export class GetGroupsUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
  ) {}

  public async execute(filter: GetGroupsFilter, actor: GroupActor): Promise<GroupView[]> {
    const scoped: GetGroupsFilter = isAdminActor(actor) ? filter : { ...filter, managedByTeacherId: actor.id };

    const views: GroupView[] = await this._groupsRepository.getViews(scoped);

    if (scoped.managedByTeacherId === undefined) {
      return views;
    }

    const supervisedGroupIds: Set<string> = new Set<string>(await this._groupsRepository.getSupervisedStudentGroupIds(scoped.managedByTeacherId));
    const requester: GroupActor = { id: scoped.managedByTeacherId, role: actor.role };

    return views.map(
      (view: GroupView): GroupView => ({ ...view, relation: groupRelationOf(requester, view.group, { supervisedByActor: supervisedGroupIds.has(view.group.id) }) }),
    );
  }
}
