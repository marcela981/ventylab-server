/*
 * Funcionalidad: Caso de uso GetSubmissionByIdUseCase
 * Descripción: Obtiene una entrega con actividad, estudiante y calificador; un estudiante solo puede ver sus propias entregas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ActivitySubmissionNotFoundError, ActivitySubmissionNotOwnedError } from "@/features/activities/domain/activities.errors";
import { type ActivitySubmissionView } from "@/features/activities/domain/read-models/activity.read-model";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivitySubmissionNotFoundError} If the submission does not exist
 * @throws {ActivitySubmissionNotOwnedError} If a student requests another student's submission
 */
@Injectable()
export class GetSubmissionByIdUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
  ) {}

  public async execute(submissionId: string, userId: string, role: string): Promise<ActivitySubmissionView> {
    const view: ActivitySubmissionView | undefined = await this._submissionsRepository.getViewById(submissionId);

    if (!view) {
      throw new ActivitySubmissionNotFoundError();
    }

    if (isStudentRole(role) && !view.submission.isOwnedBy(userId)) {
      throw new ActivitySubmissionNotOwnedError();
    }

    return view;
  }
}
