/*
 * Funcionalidad: Caso de uso RegenerateGradeFeedbackUseCase
 * Descripción: Regeneración de la retroalimentación de un intento calificado por un docente con alcance sobre su grupo o un administrador: en una transacción bajo el candado por intento borra las filas anteriores e inserta una fila global PENDING, y tras confirmar publica GradeFeedbackRegenerationRequestedEvent para que la generación corra de forma asíncrona; responde de inmediato con el estado PENDING
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type RegenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-regeneration.command";
import { GradeFeedbackRegenerationResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { GradeFeedbackAccess } from "@/features/evaluation/application/services/grade-feedback-access";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, GradeFeedbackAttemptNotGradedError } from "@/features/evaluation/domain/evaluation.errors";
import { GradeFeedbackRegenerationRequestedEvent } from "@/features/evaluation/domain/events/grade-feedback.events";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN, type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { createPendingGradeFeedback, gradeFeedbackLockKey } from "@/features/evaluation/domain/services/grade-feedback-records";
import { GRADED_ATTEMPT_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {GradeFeedbackForbiddenError} If a teacher does not manage the group of the attempt
 * @throws {GradeFeedbackAttemptNotGradedError} If the attempt has no final grade yet
 */
@Injectable()
export class RegenerateGradeFeedbackUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(GRADE_FEEDBACKS_REPOSITORY_TOKEN)
    private readonly _feedbacksRepository: IGradeFeedbacksRepository,
    private readonly _access: GradeFeedbackAccess,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RegenerateGradeFeedbackCommand): Promise<GradeFeedbackRegenerationResult> {
    const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(command.attemptId);

    if (!attempt) {
      throw new EvaluationAttemptNotFoundError();
    }

    await this._access.assertCanReview(command.actor, attempt);

    if (attempt.status !== GRADED_ATTEMPT_STATUS || attempt.grade === undefined) {
      throw new GradeFeedbackAttemptNotGradedError();
    }

    const pending: GradeFeedbackRecord = await this._transactionManager.run(async (transaction: unknown): Promise<GradeFeedbackRecord> => {
      await this._feedbacksRepository.acquireTransactionLock(gradeFeedbackLockKey(attempt.id), transaction);

      const reserved: GradeFeedbackRecord = createPendingGradeFeedback(attempt.id, new Date());

      await this._feedbacksRepository.replaceForAttempt(attempt.id, [reserved], transaction);

      return reserved;
    });

    this._eventBus.publish([new GradeFeedbackRegenerationRequestedEvent({ attemptId: attempt.id, feedbackId: pending.id, performedBy: command.actor.id })]);

    return new GradeFeedbackRegenerationResult({ attemptId: attempt.id, feedbackId: pending.id, status: pending.status });
  }
}
