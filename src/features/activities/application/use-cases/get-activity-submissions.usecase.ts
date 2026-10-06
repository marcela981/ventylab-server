/*
 * Funcionalidad: Caso de uso GetActivitySubmissionsUseCase
 * Descripción: Lista las entregas de una actividad (opcionalmente de un grupo) con estudiante y calificador, de la más reciente a la más antigua por fecha de envío
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ActivitySubmissionView } from "@/features/activities/domain/read-models/activity.read-model";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";

@Injectable()
export class GetActivitySubmissionsUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
  ) {}

  public async execute(activityId: string, groupId?: string): Promise<ActivitySubmissionView[]> {
    return await this._submissionsRepository.getViewsByActivity(activityId, groupId);
  }
}
