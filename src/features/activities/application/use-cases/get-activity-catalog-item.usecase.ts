/*
 * Funcionalidad: Caso de uso GetActivityCatalogItemUseCase
 * Descripción: Obtiene una actividad activa del catálogo; los estudiantes solo pueden ver actividades publicadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ActivityNotAvailableError, ActivityNotFoundError } from "@/features/activities/domain/activities.errors";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivityNotFoundError} If the activity does not exist or is inactive
 * @throws {ActivityNotAvailableError} If a student requests an unpublished activity
 */
@Injectable()
export class GetActivityCatalogItemUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
  ) {}

  public async execute(activityId: string, role: string): Promise<Activity> {
    const activity: Activity | undefined = await this._activitiesRepository.getById(activityId);

    if (!activity || !activity.isActive) {
      throw new ActivityNotFoundError();
    }

    if (isStudentRole(role) && !activity.isPublished) {
      throw new ActivityNotAvailableError();
    }

    return activity;
  }
}
