/*
 * Funcionalidad: Alcance de calificación de intentos de evaluación
 * Descripción: Reutiliza el alcance de lectura de asignaciones (grupos STUDENT creados o supervisados por el profesor, resuelto con EvaluationAssignmentAccess y GroupsFacade) para la calificación: ADMIN califica cualquier intento; TEACHER solo los intentos cuya asignación pertenece a ese alcance o, si son heredados sin asignación, los de evaluaciones que creó (403 en otro caso)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationGradingForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

@Injectable()
export class EvaluationGradingAccess {
  public constructor(
    private readonly _assignmentAccess: EvaluationAssignmentAccess,
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
  ) {}

  public async scopeFor(actor: EvaluationActor): Promise<EvaluationAssignmentScope | undefined> {
    return await this._assignmentAccess.scopeFor(actor);
  }

  public async assertCanGrade(actor: EvaluationActor, attemptId: string): Promise<void> {
    const scope: EvaluationAssignmentScope | undefined = await this.scopeFor(actor);

    if (scope === undefined) {
      return;
    }

    if (!(await this._gradingRepository.isAttemptInScope(attemptId, scope))) {
      throw new EvaluationGradingForbiddenError();
    }
  }
}
