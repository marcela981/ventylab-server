/*
 * Funcionalidad: Caso de uso GenerateGradeFeedbackUseCase
 * Descripción: Genera la retroalimentación de un intento calificado: reserva bajo candado por intento una fila global PENDING (idempotente: omite si ya hay una PENDING o READY, salvo que se complete una reserva de regeneración), arma el contexto sin datos personales, llama a IGradeFeedbackGenerator fuera de toda transacción y guarda en otra transacción la fila global y una por pregunta como READY con origen, proveedor y modelo, solo si la reserva sigue vigente; ante un error inesperado marca la reserva FAILED y relanza
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { GRADE_FEEDBACK_GENERATOR_TOKEN, type IGradeFeedbackGenerator } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN, type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { buildGradeFeedbackContext } from "@/features/evaluation/domain/services/grade-feedback-context";
import {
  buildReadyGradeFeedback,
  createPendingGradeFeedback,
  gradeFeedbackLockKey,
  hasActiveGradeFeedback,
} from "@/features/evaluation/domain/services/grade-feedback-records";
import { GRADED_ATTEMPT_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { type GeneratedGradeFeedback } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { FAILED_FEEDBACK_STATUS, PENDING_FEEDBACK_STATUS } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

export type GradeFeedbackGenerationOutcome = "ready" | "skipped" | "superseded";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 */
@Injectable()
export class GenerateGradeFeedbackUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(GRADE_FEEDBACKS_REPOSITORY_TOKEN)
    private readonly _feedbacksRepository: IGradeFeedbacksRepository,
    @Inject(GRADE_FEEDBACK_GENERATOR_TOKEN)
    private readonly _generator: IGradeFeedbackGenerator,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: GenerateGradeFeedbackCommand): Promise<GradeFeedbackGenerationOutcome> {
    const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(command.attemptId);

    if (!attempt) {
      throw new EvaluationAttemptNotFoundError();
    }

    if (attempt.status !== GRADED_ATTEMPT_STATUS || attempt.grade === undefined) {
      return "skipped";
    }

    const pendingId: string | undefined = command.pendingFeedbackId ?? (await this._reserve(attempt.id));

    if (pendingId === undefined) {
      return "skipped";
    }

    try {
      const generated: GeneratedGradeFeedback = await this._generator.generate(
        buildGradeFeedbackContext({ evaluation: await this._loadEvaluation(attempt), attempt, passingGrade: this._gradingConfig.passingGrade }),
      );

      return (await this._store(attempt.id, pendingId, generated)) ? "ready" : "superseded";
    } catch (error) {
      await this._markFailed(attempt.id, pendingId);

      throw error;
    }
  }

  private async _loadEvaluation(attempt: StudentEvaluationAttempt): Promise<Evaluation> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(attempt.evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    return evaluation;
  }

  private async _reserve(attemptId: string): Promise<string | undefined> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<string | undefined> => {
      await this._feedbacksRepository.acquireTransactionLock(gradeFeedbackLockKey(attemptId), transaction);

      if (hasActiveGradeFeedback(await this._feedbacksRepository.getByAttempt(attemptId, transaction))) {
        return undefined;
      }

      const pending: GradeFeedbackRecord = createPendingGradeFeedback(attemptId, new Date());

      await this._feedbacksRepository.replaceForAttempt(attemptId, [pending], transaction);

      return pending.id;
    });
  }

  private async _store(attemptId: string, pendingId: string, generated: GeneratedGradeFeedback): Promise<boolean> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<boolean> => {
      if (!(await this._isStillPending(attemptId, pendingId, transaction))) {
        return false;
      }

      await this._feedbacksRepository.replaceForAttempt(attemptId, buildReadyGradeFeedback(attemptId, pendingId, generated, new Date()), transaction);

      return true;
    });
  }

  private async _markFailed(attemptId: string, pendingId: string): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      if (await this._isStillPending(attemptId, pendingId, transaction)) {
        await this._feedbacksRepository.updateStatus(pendingId, FAILED_FEEDBACK_STATUS, new Date(), transaction);
      }
    });
  }

  private async _isStillPending(attemptId: string, pendingId: string, transaction: unknown): Promise<boolean> {
    await this._feedbacksRepository.acquireTransactionLock(gradeFeedbackLockKey(attemptId), transaction);

    const records: GradeFeedbackRecord[] = await this._feedbacksRepository.getByAttempt(attemptId, transaction);

    // A regeneration replaces the reserved row, so a result for an older reservation is discarded instead of overwriting the newer one
    return records.some((record: GradeFeedbackRecord) => record.id === pendingId && record.status === PENDING_FEEDBACK_STATUS);
  }
}
