/*
 * Funcionalidad: Caso de uso CreateEvaluationAssignmentsUseCase
 * Descripción: Activa una evaluación READY del banco compartido para uno o varios grupos STUDENT activos que el ejecutor gestiona, todo-o-nada en una transacción bajo el candado de la evaluación: valida ventana y solapamientos, guarda una asignación por grupo, audita cada una y publica EvaluationActivatedEvent después del commit
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { CreateEvaluationAssignmentsCommand } from "@/features/evaluation/application/commands/create-evaluation-assignments.command";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EVALUATION_ASSIGNMENT_AUDIT_TARGET, EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationAlreadyAssignedError,
  EvaluationNotFoundError,
  InvalidEvaluationAssignmentGroupError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  type EvaluationAssignmentGroupTarget,
  isAssignableGroup,
} from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { evaluationStructureLockKey } from "@/features/evaluation/domain/services/evaluation-management-policy";

export const EVALUATION_ASSIGNMENT_CREATED_ACTION: string = "evaluation_assignment_created";

/**
 * @throws {EvaluationAssignmentForbiddenError} If a teacher does not manage every target group
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationNotActivatableError} If the evaluation is not READY
 * @throws {InvalidEvaluationAssignmentWindowError} If startsAt is not before endsAt or endsAt is not in the future
 * @throws {InvalidEvaluationAssignmentGroupError} If a target group does not exist, is not a STUDENT group or is inactive
 * @throws {EvaluationAlreadyAssignedError} If a target group already has an assignment of this evaluation with an overlapping window
 */
@Injectable()
export class CreateEvaluationAssignmentsUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: CreateEvaluationAssignmentsCommand): Promise<string[]> {
    const groupIds: string[] = [...new Set(command.groupIds)];

    await this._access.assertCanManageGroups(command.actor, groupIds);

    const created: EvaluationAssignment[] = await this._transactionManager.run(
      async (transaction: unknown): Promise<EvaluationAssignment[]> => {
        await this._evaluationsRepository.acquireTransactionLock(evaluationStructureLockKey(command.evaluationId), transaction);

        const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(command.evaluationId, transaction);

        if (!evaluation) {
          throw new EvaluationNotFoundError();
        }

        const now: Date = new Date();

        const assignments: EvaluationAssignment[] = groupIds.map(
          (groupId: string): EvaluationAssignment =>
            EvaluationAssignment.create({
              evaluation: { id: evaluation.id, status: evaluation.status, title: evaluation.title, type: evaluation.type },
              groupId,
              startsAt: command.startsAt,
              endsAt: command.endsAt,
              assignedById: command.actor.id,
              now,
            }),
        );

        await this._assertAssignableGroups(groupIds, transaction);

        const existing: EvaluationAssignment[] = await this._assignmentsRepository.getByEvaluationAndGroups(evaluation.id, groupIds, transaction);

        for (const assignment of assignments) {
          if (existing.some((other: EvaluationAssignment) => assignment.overlaps(other))) {
            throw new EvaluationAlreadyAssignedError(assignment.groupId);
          }
        }

        for (const assignment of assignments) {
          await this._assignmentsRepository.save(assignment, transaction);

          await this._auditRecorder.record(
            command.actor.id,
            EVALUATION_ASSIGNMENT_CREATED_ACTION,
            EVALUATION_ASSIGNMENT_AUDIT_TARGET,
            assignment.id,
            {},
            assignment.toAuditState(),
            transaction,
          );
        }

        return assignments;
      },
    );

    // Published after the transaction resolves so group members are only notified about committed assignments
    this._eventBus.publish(created.flatMap((assignment: EvaluationAssignment): DomainEvent[] => assignment.getEvents()));

    return created.map((assignment: EvaluationAssignment) => assignment.id);
  }

  private async _assertAssignableGroups(groupIds: ReadonlyArray<string>, transaction: unknown): Promise<void> {
    const targets: EvaluationAssignmentGroupTarget[] = await this._assignmentsRepository.getGroupTargets(groupIds, transaction);

    const invalid: string[] = groupIds.filter(
      (groupId: string) => !targets.some((target: EvaluationAssignmentGroupTarget) => target.id === groupId && isAssignableGroup(target)),
    );

    if (invalid.length > 0) {
      throw new InvalidEvaluationAssignmentGroupError(invalid);
    }
  }
}
