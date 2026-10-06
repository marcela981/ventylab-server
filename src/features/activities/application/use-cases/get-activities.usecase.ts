/*
 * Funcionalidad: Caso de uso GetActivitiesUseCase
 * Descripción: Listado de actividades según el rol: el estudiante ve las actividades activas y publicadas asignadas a sus grupos con sus entregas; el docente o administrador ve las actividades activas que creó con sus asignaciones y el conteo de entregas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ActivityListItemView } from "@/features/activities/domain/read-models/activity.read-model";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN,
  type IActivityGroupMembershipRepository,
} from "@/features/activities/domain/repositories/activity-group-membership.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

@Injectable()
export class GetActivitiesUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN)
    private readonly _groupMembershipRepository: IActivityGroupMembershipRepository,
  ) {}

  public async execute(userId: string, role: string): Promise<ActivityListItemView[]> {
    if (!isStudentRole(role)) {
      return await this._activitiesRepository.getTeacherActivities(userId);
    }

    const groupIds: string[] = await this._groupMembershipRepository.getGroupIdsForUser(userId);

    if (groupIds.length === 0) {
      return [];
    }

    return await this._activitiesRepository.getStudentActivities(userId, groupIds);
  }
}
