/*
 * Funcionalidad: Caso de uso AddEvaluationQuestionUseCase
 * Descripción: Agrega al final de una evaluación una pregunta con enunciado Tiptap saneado y sus opciones, verificando medios y caso clínico; es un cambio estructural; devuelve su id
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AddEvaluationQuestionCommand } from "@/features/evaluation/application/commands/add-evaluation-question.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation, type NewEvaluationOption } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationRichTextDocument, toEvaluationRichText } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the prompt is not a valid rich text document
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If a referenced media does not exist
 * @throws {EvaluationReferenceNotFoundError} If the clinical case does not exist
 * @throws {EvaluationScenarioNotFoundError} If the scenario does not belong to the evaluation
 * @throws {EvaluationOptionsNotAllowedError} If options are given for a non-choice question
 * @throws {EvaluationHasSubmittedAttemptsError} If the evaluation already has submitted attempts
 * @throws {EvaluationNotReadyError} If the evaluation is READY and the change makes it invalid
 */
@Injectable()
export class AddEvaluationQuestionUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: AddEvaluationQuestionCommand): Promise<string> {
    const prompt: EvaluationRichTextDocument = toEvaluationRichText(command.prompt);
    const options: NewEvaluationOption[] = command.options ?? [];
    const optionMediaIds: string[] = options.flatMap((option: NewEvaluationOption) => (option.mediaId ? [option.mediaId] : []));

    return await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: [...(command.mediaIds ?? []), ...optionMediaIds],
      references: { clinicalCaseId: command.clinicalCaseId },
      apply: (evaluation: Evaluation): string =>
        evaluation.addQuestion(
          {
            type: command.type,
            prompt,
            points: command.points,
            explanation: command.explanation,
            scenarioId: command.scenarioId,
            mediaIds: command.mediaIds,
            clinicalCaseId: command.clinicalCaseId,
            rubric: command.rubric,
            options,
          },
          command.actor.id,
        ),
    });
  }
}
