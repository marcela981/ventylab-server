/*
 * Funcionalidad: Caso de uso GetMySubmissionsUseCase
 * Descripción: Lista las entregas del usuario autenticado con los datos básicos de cada actividad, de la más recientemente actualizada a la más antigua
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
export class GetMySubmissionsUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
  ) {}

  public async execute(userId: string): Promise<ActivitySubmissionView[]> {
    return await this._submissionsRepository.getViewsByUser(userId);
  }
}
