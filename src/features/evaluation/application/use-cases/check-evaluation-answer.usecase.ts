/*
 * Funcionalidad: Caso de uso CheckEvaluationAnswerUseCase
 * Descripción: Retroalimentación inmediata de una pregunta de selección del intento propio en curso (solo QUIZ y WORKSHOP): bajo el candado por evaluación y usuario y el compartido de estructura hace el upsert de la respuesta, marca revealedAt (la respuesta queda bloqueada: un PUT o un check posterior responde 409) y devuelve si es correcta, las opciones correctas y la explicación; tras el plazo más la gracia confirma el cierre perezoso y responde 409
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
import { type CheckEvaluationAnswerCommand } from "@/features/evaluation/application/commands/check-evaluation-answer.command";
import { CheckEvaluationAnswerResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { StudentAnswerRecorder } from "@/features/evaluation/application/services/student-answer-recorder";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
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
import { correctOptionIds, isChoiceAnswerCorrect } from "@/features/evaluation/domain/services/evaluation-attempt-grader";

type CheckOutcome =
  | { readonly expired: true; readonly events: DomainEvent[]; readonly result?: undefined }
  | { readonly expired: false; readonly events: DomainEvent[]; readonly result: CheckEvaluationAnswerResult };

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist or belongs to another user
 * @throws {EvaluationAttemptReadOnlyError} If the attempt was migrated from the legacy model
 * @throws {EvaluationAttemptNotInProgressError} If the attempt was already submitted
 * @throws {AttemptDeadlinePassedError} If the deadline plus grace passed; the attempt is closed with the saved answers
 * @throws {EvaluationAnswerCheckUnavailableError} If the evaluation is an EXAM or the question is not a choice question
 * @throws {EvaluationAnswerLockedError} If the answer was already checked
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {InvalidEvaluationAnswerError} If the selected options do not match the question
 */
@Injectable()
export class CheckEvaluationAnswerUseCase {
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

  public async execute(command: CheckEvaluationAnswerCommand): Promise<CheckEvaluationAnswerResult> {
    const owned: StudentEvaluationAttempt = await this._closer.getOwned(command.attemptId, command.userId);

    if (owned.isLegacy) {
      throw new EvaluationAttemptReadOnlyError();
    }

    const now: Date = new Date();

    const outcome: CheckOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<CheckOutcome> => {
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

      const question: EvaluationQuestionItem = this._recorder.reveal(
        attempt,
        context.evaluation,
        { questionId: command.questionId, selectedOptionIds: command.selectedOptionIds },
        now,
      );

      await this._attemptsRepository.save(attempt, transaction);

      return {
        expired: false,
        events: attempt.getEvents(),
        result: new CheckEvaluationAnswerResult({
          isCorrect: isChoiceAnswerCorrect(question, command.selectedOptionIds),
          correctOptionIds: correctOptionIds(question),
          explanation: question.explanation,
        }),
      };
    });

    this._eventBus.publish(outcome.events);

    if (outcome.expired) {
      throw new AttemptDeadlinePassedError();
    }

    return outcome.result;
  }
}
