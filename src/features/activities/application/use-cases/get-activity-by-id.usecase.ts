/*
 * Funcionalidad: Caso de uso GetActivityByIdUseCase
 * Descripción: Detalle de una actividad con sus asignaciones activas; un estudiante solo accede si la actividad está activa, publicada y asignada a alguno de sus grupos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ActivityAccessDeniedError, ActivityNotFoundError } from "@/features/activities/domain/activities.errors";
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { type ActivityDetailView } from "@/features/activities/domain/read-models/activity.read-model";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN,
  type IActivityGroupMembershipRepository,
} from "@/features/activities/domain/repositories/activity-group-membership.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivityNotFoundError} If the activity does not exist
 * @throws {ActivityAccessDeniedError} If a student is not assigned to the activity through a group
 */
@Injectable()
export class GetActivityByIdUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN)
    private readonly _groupMembershipRepository: IActivityGroupMembershipRepository,
  ) {}

  public async execute(activityId: string, userId: string, role: string): Promise<ActivityDetailView> {
    const detail: ActivityDetailView | undefined = await this._activitiesRepository.getDetail(activityId);

    if (!detail) {
      throw new ActivityNotFoundError();
    }

    if (isStudentRole(role)) {
      const groupIds: string[] = await this._groupMembershipRepository.getGroupIdsForUser(userId);
      const isAssigned: boolean = detail.assignments.some((assignment: ActivityAssignment) => groupIds.includes(assignment.groupId));

      if (!detail.activity.isActive || !detail.activity.isPublished || !isAssigned) {
        throw new ActivityAccessDeniedError();
      }
    }

    return detail;
  }
}
