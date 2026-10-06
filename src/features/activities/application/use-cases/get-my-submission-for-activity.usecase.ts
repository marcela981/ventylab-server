/*
 * Funcionalidad: Caso de uso GetMySubmissionForActivityUseCase
 * Descripción: Obtiene la entrega del usuario autenticado para una actividad, o ninguna si no la ha iniciado
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
export class GetMySubmissionForActivityUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
  ) {}

  public async execute(activityId: string, userId: string): Promise<ActivitySubmissionView | undefined> {
    return await this._submissionsRepository.getViewByActivityAndUser(activityId, userId);
  }
}
