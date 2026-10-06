/*
 * Funcionalidad: Caso de uso UpdateEvaluationUseCase
 * Descripción: Edita los datos generales de una evaluación (título, descripción enriquecida, ubicación curricular, duración, intentos, barajado, visibilidad de resultados y orden) verificando las referencias curriculares
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { UpdateEvaluationCommand } from "@/features/evaluation/application/commands/update-evaluation.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { toEvaluationDescription } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the description is not a valid rich text document
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationReferenceNotFoundError} If the module, level or lesson does not exist
 */
@Injectable()
export class UpdateEvaluationUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: UpdateEvaluationCommand): Promise<void> {
    const description: string | null | undefined =
      command.description === undefined || command.description === null ? command.description : toEvaluationDescription(command.description);

    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      references: {
        moduleId: command.moduleId ?? undefined,
        levelId: command.levelId ?? undefined,
        lessonId: command.lessonId ?? undefined,
      },
      apply: (evaluation: Evaluation): void =>
        evaluation.update(
          {
            title: command.title,
            description,
            moduleId: command.moduleId,
            levelId: command.levelId,
            lessonId: command.lessonId,
            durationMinutes: command.durationMinutes,
            maxAttempts: command.maxAttempts,
            shuffleQuestions: command.shuffleQuestions,
            showResultsImmediately: command.showResultsImmediately,
            order: command.order,
          },
          command.actor.id,
        ),
    });
  }
}
