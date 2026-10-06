/*
 * Funcionalidad: Caso de uso UpdateEvaluationAssignmentUseCase
 * Descripción: Edita la ventana de una asignación del grupo que el ejecutor gestiona bajo el candado de la evaluación: UPCOMING admite mover inicio y fin, ACTIVE solo el fin (no antes de ahora), CLOSED es inmutable; rechaza solapamientos con otras asignaciones del grupo y audita el cambio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { UpdateEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/update-evaluation-assignment.command";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { loadManagedEvaluationAssignment } from "@/features/evaluation/application/services/managed-evaluation-assignment";
import { EVALUATION_ASSIGNMENT_AUDIT_TARGET, type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { EvaluationAlreadyAssignedError } from "@/features/evaluation/domain/evaluation.errors";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";

export const EVALUATION_ASSIGNMENT_WINDOW_CHANGED_ACTION: string = "evaluation_assignment_window_changed";

/**
 * @throws {EvaluationAssignmentNotFoundError} If the assignment does not exist or belongs to another evaluation
 * @throws {EvaluationAssignmentForbiddenError} If a teacher does not manage the assignment group
 * @throws {EvaluationAssignmentClosedError} If the assignment is already closed
 * @throws {InvalidEvaluationAssignmentWindowError} If the start of an active assignment moves, startsAt is not before endsAt or endsAt is not in the future
 * @throws {EvaluationAlreadyAssignedError} If the new window overlaps another assignment of the same group
 */
@Injectable()
export class UpdateEvaluationAssignmentUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: UpdateEvaluationAssignmentCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const assignment: EvaluationAssignment = await loadManagedEvaluationAssignment(
        { evaluationsRepository: this._evaluationsRepository, assignmentsRepository: this._assignmentsRepository, access: this._access },
        command,
        transaction,
      );

      const before: Record<string, unknown> = assignment.toAuditState();

      assignment.reschedule({ startsAt: command.startsAt, endsAt: command.endsAt }, new Date());

      const siblings: EvaluationAssignment[] = await this._assignmentsRepository.getByEvaluationAndGroups(
        assignment.evaluationId,
        [assignment.groupId],
        transaction,
      );

      if (siblings.some((other: EvaluationAssignment) => assignment.overlaps(other))) {
        throw new EvaluationAlreadyAssignedError(assignment.groupId);
      }

      await this._assignmentsRepository.save(assignment, transaction);

      await this._auditRecorder.record(
        command.actor.id,
        EVALUATION_ASSIGNMENT_WINDOW_CHANGED_ACTION,
        EVALUATION_ASSIGNMENT_AUDIT_TARGET,
        assignment.id,
        before,
        assignment.toAuditState(),
        transaction,
      );
    });
  }
}
