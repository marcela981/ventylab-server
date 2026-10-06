/*
 * Funcionalidad: Caso de uso SaveEvaluationAnswerUseCase
 * Descripción: Autoguardado de la respuesta a una pregunta del intento propio en curso, con upsert por (intento, pregunta), bajo el candado por evaluación y usuario y el compartido de estructura; se permite hasta el plazo efectivo más 30 s de gracia (el mismo margen de la entrega); después confirma el cierre perezoso con lo autoguardado y responde 409
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
import { type SaveEvaluationAnswerCommand } from "@/features/evaluation/application/commands/save-evaluation-answer.command";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { StudentAnswerRecorder } from "@/features/evaluation/application/services/student-answer-recorder";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  AttemptDeadlinePassedError,
  EvaluationAttemptNotFoundError,
  EvaluationAttemptNotInProgressError,
  EvaluationAttemptReadOnlyError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";

interface SaveOutcome {
  readonly expired: boolean;
  readonly events: DomainEvent[];
}

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist or belongs to another user
 * @throws {EvaluationAttemptReadOnlyError} If the attempt was migrated from the legacy model
 * @throws {EvaluationAttemptNotInProgressError} If the attempt was already submitted
 * @throws {AttemptDeadlinePassedError} If the deadline plus grace passed; the attempt is closed with the saved answers
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {InvalidEvaluationAnswerError} If the answer does not match the question type, options or simulation session owner
 */
@Injectable()
export class SaveEvaluationAnswerUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
    private readonly _recorder: StudentAnswerRecorder,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SaveEvaluationAnswerCommand): Promise<void> {
    const owned: StudentEvaluationAttempt = await this._closer.getOwned(command.attemptId, command.userId);

    if (owned.isLegacy) {
      throw new EvaluationAttemptReadOnlyError();
    }

    const now: Date = new Date();

    const outcome: SaveOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<SaveOutcome> => {
      await this._closer.lock(owned.evaluationId, owned.userId, transaction);

      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(owned.id, transaction);

      if (!attempt) {
        throw new EvaluationAttemptNotFoundError();
      }

      if (!attempt.isInProgress) {
        throw new EvaluationAttemptNotInProgressError();
      }

      const context: EvaluationAttemptContext = await this._closer.loadContext(attempt, transaction);

      if (await this._closer.closeIfExpired(attempt, context, now, transaction)) {
        return { expired: true, events: attempt.getEvents() };
      }

      await this._recorder.record(
        attempt,
        context.evaluation,
        {
          questionId: command.questionId,
          selectedOptionIds: command.selectedOptionIds,
          textAnswer: command.textAnswer,
          simulationSessionId: command.simulationSessionId,
        },
        now,
      );

      await this._attemptsRepository.save(attempt, transaction);

      return { expired: false, events: attempt.getEvents() };
    });

    this._eventBus.publish(outcome.events);

    if (outcome.expired) {
      throw new AttemptDeadlinePassedError();
    }
  }
}
