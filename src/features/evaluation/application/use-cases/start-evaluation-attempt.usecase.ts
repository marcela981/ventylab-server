/*
 * Funcionalidad: Caso de uso StartEvaluationAttemptUseCase
 * Descripción: Inicia o retoma el intento de un estudiante en una asignación de su grupo STUDENT (GroupsFacade): en una transacción bajo el candado por evaluación y usuario cierra de forma perezosa un intento vencido, devuelve el intento en curso si existe (idempotente), exige asignación ACTIVE y evaluación READY (403), aplica maxAttempts contando también los intentos heredados (409) y crea el intento con número max+1 y plazo calculado en el servidor; un cierre perezoso se confirma aunque el inicio se rechace
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
import { type DomainError } from "@/common/domain/errors/domain-error";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { StartEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAssignmentNotFoundError,
  EvaluationNotFoundError,
  EvaluationNotOpenError,
  MaxAttemptsReachedError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type AttemptCounters,
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { computeAttemptDeadline } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { ACTIVE_ASSIGNMENT_STATE } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { READY_EVALUATION_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-status";

type StartOutcome =
  | { readonly events: DomainEvent[]; readonly result: StartEvaluationAttemptResult; readonly rejection?: undefined }
  | { readonly events: DomainEvent[]; readonly rejection: DomainError; readonly result?: undefined };

/**
 * @throws {EvaluationAssignmentNotFoundError} If the assignment does not exist or is not for the student's active STUDENT group
 * @throws {EvaluationNotFoundError} If the evaluation of the assignment does not exist
 * @throws {EvaluationNotOpenError} If the assignment is not ACTIVE or the evaluation is not READY
 * @throws {MaxAttemptsReachedError} If the student already used every allowed attempt
 */
@Injectable()
export class StartEvaluationAttemptUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
    private readonly _closer: EvaluationAttemptCloser,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: StartEvaluationAttemptCommand): Promise<StartEvaluationAttemptResult> {
    const assignment: EvaluationAssignment = await this._loadStudentAssignment(command.assignmentId, command.userId);
    const now: Date = new Date();

    const outcome: StartOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<StartOutcome> => {
      await this._closer.lock(assignment.evaluationId, command.userId, transaction);

      const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(assignment.evaluationId, transaction);

      if (!evaluation) {
        throw new EvaluationNotFoundError();
      }

      const events: DomainEvent[] = [];
      const existing: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getInProgress(evaluation.id, command.userId, transaction);

      if (existing) {
        const context: EvaluationAttemptContext = await this._closer.loadContext(existing, transaction);

        if (!(await this._closer.closeIfExpired(existing, context, now, transaction))) {
          return { events, result: new StartEvaluationAttemptResult({ attempt: existing, created: false, deadlineAt: context.deadlineAt, now }) };
        }

        events.push(...existing.getEvents());
      }

      const current: EvaluationAssignment | undefined = await this._assignmentsRepository.getById(assignment.id, transaction);

      if (!current || current.stateAt(now) !== ACTIVE_ASSIGNMENT_STATE || evaluation.status !== READY_EVALUATION_STATUS) {
        return { events, rejection: new EvaluationNotOpenError() };
      }

      const counters: AttemptCounters = await this._attemptsRepository.getAttemptCounters(evaluation.id, command.userId, transaction);

      if (counters.count >= evaluation.maxAttempts) {
        return { events, rejection: new MaxAttemptsReachedError(evaluation.maxAttempts) };
      }

      const attempt: StudentEvaluationAttempt = StudentEvaluationAttempt.start({
        evaluationId: evaluation.id,
        assignmentId: current.id,
        userId: command.userId,
        attemptNumber: counters.maxAttemptNumber + 1,
        startedAt: now,
        deadlineAt: computeAttemptDeadline({ startedAt: now, durationMinutes: evaluation.durationMinutes, endsAt: current.endsAt }),
      });

      await this._attemptsRepository.save(attempt, transaction);

      return { events, result: new StartEvaluationAttemptResult({ attempt, created: true, deadlineAt: attempt.deadlineAt, now }) };
    });

    this._eventBus.publish(outcome.events);

    if (outcome.rejection !== undefined) {
      throw outcome.rejection;
    }

    return outcome.result;
  }

  private async _loadStudentAssignment(assignmentId: string, userId: string): Promise<EvaluationAssignment> {
    const groupId: string | undefined = await this._access.studentGroupIdOf(userId);
    const assignment: EvaluationAssignment | undefined = groupId === undefined ? undefined : await this._assignmentsRepository.getById(assignmentId);

    if (!assignment || assignment.groupId !== groupId) {
      throw new EvaluationAssignmentNotFoundError();
    }

    return assignment;
  }
}
