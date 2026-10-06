/*
 * Funcionalidad: Caso de uso ReorderEvaluationQuestionsUseCase
 * Descripción: Reordena por lotes las preguntas de una evaluación y opcionalmente las mueve entre escenarios; el repositorio lo aplica con una sola sentencia SQL dentro de la transacción; no es un cambio estructural
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ReorderEvaluationQuestionsCommand } from "@/features/evaluation/application/commands/reorder-evaluation-questions.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {InvalidEvaluationReorderError} If the batch is empty, repeats ids or names questions or scenarios outside the evaluation
 */
@Injectable()
export class ReorderEvaluationQuestionsUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: ReorderEvaluationQuestionsCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      apply: (evaluation: Evaluation): void => evaluation.reorderQuestions(command.items, command.actor.id),
    });
  }
}
