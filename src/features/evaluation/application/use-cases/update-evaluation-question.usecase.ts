/*
 * Funcionalidad: Caso de uso UpdateEvaluationQuestionUseCase
 * Descripción: Edita una pregunta de una evaluación; enunciado, explicación, medios y escenario son cambios no estructurales, mientras tipo, puntos, rúbrica y caso clínico son estructurales y se bloquean con intentos entregados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { UpdateEvaluationQuestionCommand } from "@/features/evaluation/application/commands/update-evaluation-question.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationRichTextDocument, toEvaluationRichText } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the prompt is not a valid rich text document
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If a referenced media does not exist
 * @throws {EvaluationReferenceNotFoundError} If the clinical case does not exist
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {EvaluationScenarioNotFoundError} If the scenario does not belong to the evaluation
 * @throws {EvaluationOptionsNotAllowedError} If changing to a non-choice type while the question has options
 * @throws {EvaluationHasSubmittedAttemptsError} If a structural field changes after attempts were submitted
 * @throws {EvaluationNotReadyError} If the evaluation is READY and the change makes it invalid
 */
@Injectable()
export class UpdateEvaluationQuestionUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: UpdateEvaluationQuestionCommand): Promise<void> {
    const prompt: EvaluationRichTextDocument | undefined = command.prompt === undefined ? undefined : toEvaluationRichText(command.prompt);

    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: command.mediaIds,
      references: { clinicalCaseId: command.clinicalCaseId ?? undefined },
      apply: (evaluation: Evaluation): void =>
        evaluation.updateQuestion(
          command.questionId,
          {
            type: command.type,
            prompt,
            points: command.points,
            explanation: command.explanation,
            scenarioId: command.scenarioId,
            mediaIds: command.mediaIds,
            clinicalCaseId: command.clinicalCaseId,
            rubric: command.rubric,
          },
          command.actor.id,
        ),
    });
  }
}
