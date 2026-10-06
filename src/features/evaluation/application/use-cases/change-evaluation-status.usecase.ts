/*
 * Funcionalidad: Caso de uso ChangeEvaluationStatusUseCase
 * Descripción: Cambia el estado de una evaluación mediante el editor transaccional: READY exige que la evaluación sea válida y volver a DRAFT exige que no haya intentos entregados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ChangeEvaluationStatusCommand } from "@/features/evaluation/application/commands/change-evaluation-status.command";
import { type EvaluationEditContext, EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import { DRAFT_EVALUATION_STATUS, READY_EVALUATION_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-status";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {InvalidEvaluationStatusTransitionError} If the transition is not allowed (leaving ARCHIVED)
 * @throws {EvaluationNotReadyError} If moving to READY and the evaluation fails validation
 * @throws {EvaluationHasSubmittedAttemptsError} If moving a READY evaluation back to DRAFT with submitted attempts
 */
@Injectable()
export class ChangeEvaluationStatusUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: ChangeEvaluationStatusCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      apply: async (evaluation: Evaluation, context: EvaluationEditContext): Promise<void> => {
        const returnsToDraft: boolean = evaluation.status === READY_EVALUATION_STATUS && command.status === DRAFT_EVALUATION_STATUS;
        const usage: EvaluationUsage | undefined = returnsToDraft ? await context.getUsage() : undefined;

        evaluation.changeStatus(command.status, { hasSubmittedAttempts: (usage?.submittedAttempts ?? 0) > 0 }, command.actor.id);
      },
    });
  }
}
