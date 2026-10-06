/*
 * Funcionalidad: Caso de uso GetMyGroupsUseCase
 * Descripción: Devuelve los grupos del usuario autenticado: para un estudiante, su grupo STUDENT activo (nombre, líder, miembros y grupos TEACHER que lo supervisan) o null; para todos, la lista de sus membresías
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type GroupMembershipSummaryView, type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor, STUDENT_ACTOR_ROLE } from "@/features/groups/domain/services/group-management-policy";

export interface MyGroupsResult {
  readonly studentGroup?: StudentGroupSummaryView;
  readonly memberships: GroupMembershipSummaryView[];
}

@Injectable()
export class GetMyGroupsUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
  ) {}

  public async execute(actor: GroupActor): Promise<MyGroupsResult> {
    const memberships: GroupMembershipSummaryView[] = await this._groupsRepository.getMembershipSummariesOfUser(actor.id);

    if (actor.role !== STUDENT_ACTOR_ROLE) {
      return { memberships };
    }

    const studentGroup: StudentGroupSummaryView | undefined = await this._groupsRepository.getStudentGroupSummaryOfUser(actor.id);

    return { studentGroup, memberships };
  }
}
