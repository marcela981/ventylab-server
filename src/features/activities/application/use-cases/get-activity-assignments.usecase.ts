/*
 * Funcionalidad: Caso de uso GetActivityAssignmentsUseCase
 * Descripción: Lista las asignaciones activas de una actividad con los datos básicos de cada grupo, de la más reciente a la más antigua
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ActivityAssignmentView } from "@/features/activities/domain/read-models/activity.read-model";
import {
  ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IActivityAssignmentsRepository,
} from "@/features/activities/domain/repositories/activity-assignments.repository";

@Injectable()
export class GetActivityAssignmentsUseCase {
  public constructor(
    @Inject(ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IActivityAssignmentsRepository,
  ) {}

  public async execute(activityId: string): Promise<ActivityAssignmentView[]> {
    return await this._assignmentsRepository.getActiveByActivity(activityId);
  }
}
