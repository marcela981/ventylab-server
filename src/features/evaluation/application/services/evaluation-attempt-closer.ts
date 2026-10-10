/*
 * Funcionalidad: Cierre y calificación de intentos de evaluación
 * Descripción: Servicio compartido por los casos de uso de intentos: carga un intento solo para su propietario (404 en otro caso), toma el candado exclusivo por evaluación y usuario y el compartido de estructura de la evaluación (pg_advisory_xact_lock_shared sobre la misma clave que el editor), carga la evaluación y el plazo efectivo (plazo del intento ajustado por un cierre anticipado de la asignación), califica con el calificador puro y el puntaje práctico de IPracticalScoreProvider, cierra el intento y lo cierra de forma perezosa en su propia transacción cuando venció (plazo + 30 s), publicando los eventos tras confirmar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import {
  type IPracticalScoreProvider,
  PRACTICAL_SCORE_PROVIDER_TOKEN,
  type PracticalScoreResult,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationAnswerRecord, type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { type EvaluationAttemptGrading, type GradableAnswer, gradeEvaluationAttempt } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { effectiveAttemptDeadline, evaluationAttemptLockKey, isAttemptExpired } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { evaluationStructureLockKey } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { SIMULATION_QUESTION_TYPE } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export interface EvaluationAttemptContext {
  readonly evaluation: Evaluation;
  readonly deadlineAt?: Date;
}

@Injectable()
export class EvaluationAttemptCloser {
  private readonly _logger: Logger = new Logger(EvaluationAttemptCloser.name);

  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    @Inject(PRACTICAL_SCORE_PROVIDER_TOKEN)
    private readonly _practicalScoreProvider: IPracticalScoreProvider,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public get passingGrade(): number {
    return this._gradingConfig.passingGrade;
  }

  public async getOwned(attemptId: string, userId: string): Promise<StudentEvaluationAttempt> {
    const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

    if (!attempt || attempt.userId !== userId) {
      throw new EvaluationAttemptNotFoundError();
    }

    return attempt;
  }

  public async lock(evaluationId: string, userId: string, transaction: unknown): Promise<void> {
    await this._attemptsRepository.acquireTransactionLock(evaluationAttemptLockKey(evaluationId, userId), transaction);
    await this._attemptsRepository.acquireSharedTransactionLock(evaluationStructureLockKey(evaluationId), transaction);
  }

  public async loadContext(attempt: StudentEvaluationAttempt, transaction?: unknown): Promise<EvaluationAttemptContext> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(attempt.evaluationId, transaction);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const assignment: EvaluationAssignment | undefined =
      attempt.assignmentId === undefined ? undefined : await this._assignmentsRepository.getById(attempt.assignmentId, transaction);

    return { evaluation, deadlineAt: effectiveAttemptDeadline(attempt.deadlineAt, assignment?.endsAt) };
  }

  public isExpired(attempt: StudentEvaluationAttempt, context: EvaluationAttemptContext, now: Date): boolean {
    return attempt.isInProgress && !attempt.isLegacy && isAttemptExpired(context.deadlineAt, now);
  }

  public async close(attempt: StudentEvaluationAttempt, evaluation: Evaluation, submittedAt: Date, now: Date): Promise<void> {
    const answers: Map<string, GradableAnswer> = new Map<string, GradableAnswer>(
      attempt.answers.map((answer: EvaluationAnswerRecord) => [answer.questionId, answer]),
    );

    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(evaluation.questions, answers, await this._practicalScores(attempt, evaluation));

    if (grading.zeroMaxScore) {
      this._logger.warn(`Attempt ${attempt.id} of evaluation ${evaluation.id} was graded against 0 total points`);
    }

    attempt.close({
      grading,
      submittedAt,
      now,
      publishImmediately: evaluation.showResultsImmediately,
      passingGrade: this._gradingConfig.passingGrade,
    });
  }

  public async closeIfExpired(attempt: StudentEvaluationAttempt, context: EvaluationAttemptContext, now: Date, transaction: unknown): Promise<boolean> {
    if (!this.isExpired(attempt, context, now) || context.deadlineAt === undefined) {
      return false;
    }

    await this.close(attempt, context.evaluation, context.deadlineAt, now);
    await this._attemptsRepository.save(attempt, transaction);

    return true;
  }

  public async lazyClose(attempt: StudentEvaluationAttempt, now: Date): Promise<void> {
    if (!attempt.isInProgress || attempt.isLegacy) {
      return;
    }

    if (!this.isExpired(attempt, await this.loadContext(attempt), now)) {
      return;
    }

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      await this.lock(attempt.evaluationId, attempt.userId, transaction);

      const current: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attempt.id, transaction);

      if (!current) {
        return [];
      }

      const closed: boolean = await this.closeIfExpired(current, await this.loadContext(current, transaction), now, transaction);

      return closed ? current.getEvents() : [];
    });

    this._eventBus.publish(events);
  }

  private async _practicalScores(attempt: StudentEvaluationAttempt, evaluation: Evaluation): Promise<Map<string, number>> {
    const scores: Map<string, number> = new Map<string, number>();

    for (const question of evaluation.questions) {
      const sessionId: string | undefined = attempt.answerFor(question.id)?.simulationSessionId;

      if (question.type !== SIMULATION_QUESTION_TYPE || sessionId === undefined) {
        continue;
      }

      const result: PracticalScoreResult = await this._practicalScoreProvider.getSessionScore(sessionId, question.rubric, {
        userId: attempt.userId,
        attemptId: attempt.id,
        questionId: question.id,
      });

      if (result.available) {
        scores.set(question.id, result.score);
      }
    }

    return scores;
  }
}
