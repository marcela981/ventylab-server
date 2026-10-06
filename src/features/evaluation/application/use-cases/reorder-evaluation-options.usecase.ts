/*
 * Funcionalidad: Caso de uso ReorderEvaluationOptionsUseCase
 * Descripción: Reordena por lotes las opciones de una pregunta; el repositorio lo aplica con una sola sentencia SQL dentro de la transacción; no es un cambio estructural
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ReorderEvaluationOptionsCommand } from "@/features/evaluation/application/commands/reorder-evaluation-options.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {InvalidEvaluationReorderError} If the batch is empty, repeats ids or names options outside the question
 */
@Injectable()
export class ReorderEvaluationOptionsUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: ReorderEvaluationOptionsCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      apply: (evaluation: Evaluation): void => evaluation.reorderOptions(command.questionId, command.items, command.actor.id),
    });
  }
}
