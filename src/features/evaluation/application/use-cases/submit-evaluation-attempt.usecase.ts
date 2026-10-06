/*
 * Funcionalidad: Caso de uso SubmitEvaluationAttemptUseCase
 * Descripción: Entrega idempotente del intento propio: bajo el candado por evaluación y usuario y el compartido de estructura (pg_advisory_xact_lock_shared, para que el editor no cambie preguntas mientras se califica) devuelve el mismo resultado sin escribir si ya está cerrado; si el plazo efectivo más 30 s venció ignora las respuestas del cuerpo y cierra con lo autoguardado al plazo; si no, aplica las respuestas finales y cierra ahora; calcula la calificación automática, publica según showResultsImmediately y emite los eventos tras confirmar; la nota solo se devuelve si está publicada
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { SubmitEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { StudentAnswerRecorder } from "@/features/evaluation/application/services/student-answer-recorder";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, EvaluationAttemptReadOnlyError } from "@/features/evaluation/domain/evaluation.errors";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";

interface SubmitOutcome {
  readonly attempt: StudentEvaluationAttempt;
  readonly events: DomainEvent[];
}

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist or belongs to another user
 * @throws {EvaluationAttemptReadOnlyError} If the attempt was migrated from the legacy model and is still in progress
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 * @throws {EvaluationQuestionNotFoundError} If a final answer targets a question outside the evaluation
 * @throws {InvalidEvaluationAnswerError} If a final answer does not match its question
 */
@Injectable()
export class SubmitEvaluationAttemptUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
    private readonly _recorder: StudentAnswerRecorder,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SubmitEvaluationAttemptCommand): Promise<SubmitEvaluationAttemptResult> {
    const owned: StudentEvaluationAttempt = await this._closer.getOwned(command.attemptId, command.userId);

    if (owned.isClosed) {
      return new SubmitEvaluationAttemptResult(owned, this._gradingConfig.passingGrade);
    }

    if (owned.isLegacy) {
      throw new EvaluationAttemptReadOnlyError();
    }

    const now: Date = new Date();

    const outcome: SubmitOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<SubmitOutcome> => {
      await this._closer.lock(owned.evaluationId, owned.userId, transaction);

      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(owned.id, transaction);

      if (!attempt) {
        throw new EvaluationAttemptNotFoundError();
      }

      if (attempt.isClosed) {
        return { attempt, events: [] };
      }

      const context: EvaluationAttemptContext = await this._closer.loadContext(attempt, transaction);

      if (await this._closer.closeIfExpired(attempt, context, now, transaction)) {
        return { attempt, events: attempt.getEvents() };
      }

      for (const answer of command.answers ?? []) {
        await this._recorder.record(attempt, context.evaluation, answer, now);
      }

      await this._closer.close(attempt, context.evaluation, now, now);
      await this._attemptsRepository.save(attempt, transaction);

      return { attempt, events: attempt.getEvents() };
    });

    this._eventBus.publish(outcome.events);

    return new SubmitEvaluationAttemptResult(outcome.attempt, this._gradingConfig.passingGrade);
  }
}
