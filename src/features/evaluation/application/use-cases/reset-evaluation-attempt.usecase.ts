/*
 * Funcionalidad: Caso de uso ResetEvaluationAttemptUseCase
 * Descripción: Reinicio no destructivo de un intento: con el alcance de calificación sobre el grupo STUDENT del estudiante, exige que la asignación de ese grupo esté activa (409 con la asignación para ampliar su ventana) y, bajo el mismo candado por evaluación y usuario que el inicio, rechaza un intento en curso no vencido (409), suma un intento a la concesión EvaluationAttemptGrant y registra la auditoría evaluation_attempt_reset con el motivo y el antes y después en la misma transacción; tras confirmar publica EvaluationAttemptResetEvent (notificación ATTEMPT_RESET). No borra intentos, notas ni retroalimentación
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
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { AUDIT_ACTIONS } from "@/common/domain/audit/audit-action";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type ResetEvaluationAttemptCommand } from "@/features/evaluation/application/commands/reset-evaluation-attempt.command";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAssignmentNotActiveError,
  EvaluationAssignmentNotFoundError,
  EvaluationAttemptInProgressError,
  EvaluationNotFoundError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationAttemptResetEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { ACTIVE_ASSIGNMENT_STATE } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

export const EVALUATION_ATTEMPT_GRANT_AUDIT_TARGET: string = "evaluation_attempt_grants";

export interface ResetEvaluationAttemptResult {
  readonly extraAttempts: number;
  readonly attemptsAllowed: number;
}

interface ResetOutcome {
  readonly result: ResetEvaluationAttemptResult;
  readonly events: DomainEvent[];
}

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationAssignmentNotFoundError} If the student has no STUDENT group or the evaluation is not assigned to it
 * @throws {EvaluationGradingForbiddenError} If a teacher neither created nor supervises the student group
 * @throws {EvaluationAssignmentNotActiveError} If no assignment of the student group is active now
 * @throws {EvaluationAttemptInProgressError} If the student has an attempt in progress that has not expired
 */
@Injectable()
export class ResetEvaluationAttemptUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _assignmentAccess: EvaluationAssignmentAccess,
    private readonly _gradingAccess: EvaluationGradingAccess,
    private readonly _closer: EvaluationAttemptCloser,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: ResetEvaluationAttemptCommand): Promise<ResetEvaluationAttemptResult> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(command.evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const groupId: string | undefined = await this._assignmentAccess.studentGroupIdOf(command.userId);

    if (groupId === undefined) {
      throw new EvaluationAssignmentNotFoundError();
    }

    await this._gradingAccess.assertCanGradeGroup(command.actor, groupId);

    const now: Date = new Date();

    this._assertActiveAssignment(await this._assignmentsRepository.getByEvaluationAndGroups(evaluation.id, [groupId]), now);

    const outcome: ResetOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<ResetOutcome> => {
      await this._closer.lock(evaluation.id, command.userId, transaction);

      const events: DomainEvent[] = [];
      const inProgress: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getInProgress(evaluation.id, command.userId, transaction);

      if (inProgress) {
        const context: EvaluationAttemptContext = await this._closer.loadContext(inProgress, transaction);

        if (!(await this._closer.closeIfExpired(inProgress, context, now, transaction))) {
          throw new EvaluationAttemptInProgressError();
        }

        events.push(...inProgress.getEvents());
      }

      const before: number = await this._attemptsRepository.getExtraAttempts(evaluation.id, command.userId, transaction);
      const after: number = before + 1;

      const grantId: string = await this._attemptsRepository.saveAttemptGrant(
        { evaluationId: evaluation.id, userId: command.userId, extraAttempts: after, updatedById: command.actor.id },
        transaction,
      );

      await this._auditRecorder.record(
        command.actor.id,
        AUDIT_ACTIONS.EVALUATION_ATTEMPT_RESET,
        EVALUATION_ATTEMPT_GRANT_AUDIT_TARGET,
        grantId,
        { evaluationId: evaluation.id, userId: command.userId, extraAttempts: before },
        { evaluationId: evaluation.id, userId: command.userId, extraAttempts: after, reason: command.reason },
        transaction,
      );

      events.push(
        new EvaluationAttemptResetEvent({ evaluationId: evaluation.id, userId: command.userId, title: evaluation.title, extraAttempts: after, performedBy: command.actor.id }),
      );

      return { result: { extraAttempts: after, attemptsAllowed: evaluation.maxAttempts + after }, events };
    });

    this._eventBus.publish(outcome.events);

    return outcome.result;
  }

  private _assertActiveAssignment(assignments: ReadonlyArray<EvaluationAssignment>, now: Date): void {
    if (assignments.length === 0) {
      throw new EvaluationAssignmentNotFoundError();
    }

    if (assignments.some((assignment: EvaluationAssignment) => assignment.stateAt(now) === ACTIVE_ASSIGNMENT_STATE)) {
      return;
    }

    const latest: EvaluationAssignment = [...assignments].sort((left: EvaluationAssignment, right: EvaluationAssignment) => right.startsAt.getTime() - left.startsAt.getTime())[0];

    throw new EvaluationAssignmentNotActiveError({ assignmentId: latest.id, startsAt: latest.startsAt, endsAt: latest.endsAt });
  }
}
