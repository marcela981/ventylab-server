/*
 * Funcionalidad: Caso de uso GetAttemptForGradingUseCase
 * Descripción: Vista de calificación de un intento para un profesor en su alcance (o un administrador): cierra antes de forma perezosa un intento en curso vencido y devuelve la evaluación completa (respuestas correctas, explicaciones y rúbricas), las respuestas del estudiante con puntajes automáticos y manuales y el desglose práctico de las preguntas SIMULATION recalculado bajo demanda con IPracticalScoreProvider (solo lectura, no se almacena), más los medios resueltos y la nota mínima aprobatoria
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Optional } from "@nestjs/common";

import {
  type IMediaUrlResolver,
  MEDIA_URL_RESOLVER_TOKEN,
  type ResolvedMediaURL,
} from "@/common/application/ports/media-url-resolver.interface";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import {
  type IPracticalScoreProvider,
  PRACTICAL_SCORE_PROVIDER_TOKEN,
  type PracticalScoreResult,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { GradingAttemptDetailResult } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { SIMULATION_QUESTION_TYPE } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {EvaluationGradingForbiddenError} If a teacher reads an attempt outside their groups (or a legacy attempt of an evaluation they did not create)
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 */
@Injectable()
export class GetAttemptForGradingUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    private readonly _closer: EvaluationAttemptCloser,
    private readonly _access: EvaluationGradingAccess,
    @Inject(PRACTICAL_SCORE_PROVIDER_TOKEN)
    private readonly _practicalScoreProvider: IPracticalScoreProvider,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  public async execute(attemptId: string, actor: EvaluationActor): Promise<GradingAttemptDetailResult> {
    const found: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

    if (!found) {
      throw new EvaluationAttemptNotFoundError();
    }

    await this._access.assertCanGrade(actor, found.id);
    await this._closer.lazyClose(found, new Date());

    const attempt: StudentEvaluationAttempt = (await this._attemptsRepository.getById(found.id)) ?? found;
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(attempt.evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const [practicalScores, mediaUrls] = await Promise.all([this._practicalScores(attempt, evaluation), this._resolveMedia(evaluation.referencedMediaIds)]);

    return new GradingAttemptDetailResult({ attempt, evaluation, practicalScores, mediaUrls, passingGrade: this._gradingConfig.passingGrade });
  }

  private async _practicalScores(attempt: StudentEvaluationAttempt, evaluation: Evaluation): Promise<Map<string, PracticalScoreResult>> {
    const scores: Map<string, PracticalScoreResult> = new Map<string, PracticalScoreResult>();

    for (const question of evaluation.questions) {
      const sessionId: string | undefined = attempt.answerFor(question.id)?.simulationSessionId;

      if (question.type === SIMULATION_QUESTION_TYPE && sessionId !== undefined) {
        scores.set(question.id, await this._practicalScoreProvider.getSessionScore(sessionId, question.rubric, { userId: attempt.userId, attemptId: attempt.id, questionId: question.id }));
      }
    }

    return scores;
  }

  private async _resolveMedia(mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>> {
    if (!this._mediaUrlResolver || mediaIds.length === 0) {
      return new Map<string, ResolvedMediaURL>();
    }

    return await this._mediaUrlResolver.resolveMany(mediaIds);
  }
}
