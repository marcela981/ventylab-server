/*
 * Funcionalidad: Caso de uso CloseEvaluationAssignmentUseCase
 * Descripción: Cierra anticipadamente una asignación UPCOMING o ACTIVE del grupo que el ejecutor gestiona (endsAt = ahora) bajo el candado de la evaluación y audita el cierre
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
import { CloseEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/close-evaluation-assignment.command";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { loadManagedEvaluationAssignment } from "@/features/evaluation/application/services/managed-evaluation-assignment";
import { EVALUATION_ASSIGNMENT_AUDIT_TARGET, type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";

export const EVALUATION_ASSIGNMENT_CLOSED_ACTION: string = "evaluation_assignment_closed";

/**
 * @throws {EvaluationAssignmentNotFoundError} If the assignment does not exist or belongs to another evaluation
 * @throws {EvaluationAssignmentForbiddenError} If a teacher does not manage the assignment group
 * @throws {EvaluationAssignmentClosedError} If the assignment is already closed
 */
@Injectable()
export class CloseEvaluationAssignmentUseCase {
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

  public async execute(command: CloseEvaluationAssignmentCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const assignment: EvaluationAssignment = await loadManagedEvaluationAssignment(
        { evaluationsRepository: this._evaluationsRepository, assignmentsRepository: this._assignmentsRepository, access: this._access },
        command,
        transaction,
      );

      const before: Record<string, unknown> = assignment.toAuditState();

      assignment.close(new Date());

      await this._assignmentsRepository.save(assignment, transaction);

      await this._auditRecorder.record(
        command.actor.id,
        EVALUATION_ASSIGNMENT_CLOSED_ACTION,
        EVALUATION_ASSIGNMENT_AUDIT_TARGET,
        assignment.id,
        before,
        assignment.toAuditState(),
        transaction,
      );
    });
  }
}
