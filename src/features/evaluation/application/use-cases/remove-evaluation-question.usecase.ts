/*
 * Funcionalidad: Caso de uso RemoveEvaluationQuestionUseCase
 * Descripción: Quita una pregunta (con sus opciones) de una evaluación; es un cambio estructural que se bloquea con intentos entregados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { RemoveEvaluationQuestionCommand } from "@/features/evaluation/application/commands/remove-evaluation-question.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {EvaluationHasSubmittedAttemptsError} If the evaluation already has submitted attempts
 * @throws {EvaluationNotReadyError} If the evaluation is READY and the change makes it invalid
 */
@Injectable()
export class RemoveEvaluationQuestionUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: RemoveEvaluationQuestionCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      apply: (evaluation: Evaluation): void => evaluation.removeQuestion(command.questionId, command.actor.id),
    });
  }
}
