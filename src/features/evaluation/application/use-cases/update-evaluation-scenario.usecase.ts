/*
 * Funcionalidad: Caso de uso UpdateEvaluationScenarioUseCase
 * Descripción: Edita el contenido Tiptap o los medios de un escenario de una evaluación (cambio no estructural)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { UpdateEvaluationScenarioCommand } from "@/features/evaluation/application/commands/update-evaluation-scenario.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationRichTextDocument, toEvaluationRichText } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the content is not a valid rich text document
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If a referenced media does not exist
 * @throws {EvaluationScenarioNotFoundError} If the scenario does not belong to the evaluation
 */
@Injectable()
export class UpdateEvaluationScenarioUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: UpdateEvaluationScenarioCommand): Promise<void> {
    const content: EvaluationRichTextDocument | undefined = command.content === undefined ? undefined : toEvaluationRichText(command.content);

    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: command.mediaIds,
      apply: (evaluation: Evaluation): void =>
        evaluation.updateScenario(command.scenarioId, { content, mediaIds: command.mediaIds }, command.actor.id),
    });
  }
}
