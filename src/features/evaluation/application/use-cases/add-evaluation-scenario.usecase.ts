/*
 * Funcionalidad: Caso de uso AddEvaluationScenarioUseCase
 * Descripción: Agrega al final de una evaluación un escenario con contenido Tiptap saneado y medios verificados; devuelve su id
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AddEvaluationScenarioCommand } from "@/features/evaluation/application/commands/add-evaluation-scenario.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationRichTextDocument, toEvaluationRichText } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the content is not a valid rich text document
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If a referenced media does not exist
 */
@Injectable()
export class AddEvaluationScenarioUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: AddEvaluationScenarioCommand): Promise<string> {
    const content: EvaluationRichTextDocument = toEvaluationRichText(command.content);

    return await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: command.mediaIds,
      apply: (evaluation: Evaluation): string => evaluation.addScenario({ content, mediaIds: command.mediaIds }, command.actor.id),
    });
  }
}
