/*
 * Funcionalidad: Caso de uso GetMyGradeFeedbackUseCase
 * Descripción: Retroalimentación del intento propio para el estudiante: 404 para intentos ajenos o inexistentes, 404 GradeFeedbackNotAvailableError mientras la nota no esté publicada, y una vez publicada la retroalimentación global y por pregunta con su estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, GradeFeedbackNotAvailableError } from "@/features/evaluation/domain/evaluation.errors";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN, type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { splitGradeFeedback } from "@/features/evaluation/domain/services/grade-feedback-records";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist or belongs to another user
 * @throws {GradeFeedbackNotAvailableError} If the grade of the attempt is not published yet
 */
@Injectable()
export class GetMyGradeFeedbackUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(GRADE_FEEDBACKS_REPOSITORY_TOKEN)
    private readonly _feedbacksRepository: IGradeFeedbacksRepository,
  ) {}

  public async execute(attemptId: string, userId: string): Promise<GradeFeedbackResult> {
    const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

    if (!attempt || attempt.userId !== userId) {
      throw new EvaluationAttemptNotFoundError();
    }

    if (!attempt.isPublished) {
      throw new GradeFeedbackNotAvailableError();
    }

    return new GradeFeedbackResult({ attemptId: attempt.id, ...splitGradeFeedback(await this._feedbacksRepository.getByAttempt(attempt.id)) });
  }
}
