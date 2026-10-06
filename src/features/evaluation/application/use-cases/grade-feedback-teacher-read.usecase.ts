/*
 * Funcionalidad: Caso de uso GetGradeFeedbackUseCase
 * Descripción: Retroalimentación de un intento para un docente con alcance sobre su grupo o un administrador, separada en global y por pregunta con origen, proveedor, modelo y estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { GradeFeedbackAccess } from "@/features/evaluation/application/services/grade-feedback-access";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN, type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { splitGradeFeedback } from "@/features/evaluation/domain/services/grade-feedback-records";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {GradeFeedbackForbiddenError} If a teacher does not manage the group of the attempt
 */
@Injectable()
export class GetGradeFeedbackUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(GRADE_FEEDBACKS_REPOSITORY_TOKEN)
    private readonly _feedbacksRepository: IGradeFeedbacksRepository,
    private readonly _access: GradeFeedbackAccess,
  ) {}

  public async execute(attemptId: string, actor: EvaluationActor): Promise<GradeFeedbackResult> {
    const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

    if (!attempt) {
      throw new EvaluationAttemptNotFoundError();
    }

    await this._access.assertCanReview(actor, attempt);

    return new GradeFeedbackResult({ attemptId: attempt.id, ...splitGradeFeedback(await this._feedbacksRepository.getByAttempt(attempt.id)) });
  }
}
