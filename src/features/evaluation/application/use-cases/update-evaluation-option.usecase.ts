/*
 * Funcionalidad: Caso de uso UpdateEvaluationOptionUseCase
 * Descripción: Edita una opción de una pregunta; texto y medio son cambios no estructurales, mientras cambiar si es correcta es estructural y se bloquea con intentos entregados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { UpdateEvaluationOptionCommand } from "@/features/evaluation/application/commands/update-evaluation-option.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If the referenced media does not exist
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {EvaluationQuestionOptionNotFoundError} If the option does not belong to the question
 * @throws {EvaluationHasSubmittedAttemptsError} If the correct answer changes after attempts were submitted
 * @throws {EvaluationNotReadyError} If the evaluation is READY and the change makes it invalid
 */
@Injectable()
export class UpdateEvaluationOptionUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: UpdateEvaluationOptionCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: command.mediaId ? [command.mediaId] : [],
      apply: (evaluation: Evaluation): void =>
        evaluation.updateOption(
          command.questionId,
          command.optionId,
          { content: command.content, isCorrect: command.isCorrect, mediaId: command.mediaId },
          command.actor.id,
        ),
    });
  }
}
