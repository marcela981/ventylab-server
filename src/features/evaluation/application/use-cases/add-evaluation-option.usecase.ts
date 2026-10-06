/*
 * Funcionalidad: Caso de uso AddEvaluationOptionUseCase
 * Descripción: Agrega al final de una pregunta de selección una opción con medio verificado; es un cambio estructural que se bloquea con intentos entregados; devuelve su id
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AddEvaluationOptionCommand } from "@/features/evaluation/application/commands/add-evaluation-option.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationMediaNotFoundError} If the referenced media does not exist
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {EvaluationOptionsNotAllowedError} If the question is not a choice question
 * @throws {EvaluationHasSubmittedAttemptsError} If the evaluation already has submitted attempts
 * @throws {EvaluationNotReadyError} If the evaluation is READY and the change makes it invalid
 */
@Injectable()
export class AddEvaluationOptionUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: AddEvaluationOptionCommand): Promise<string> {
    return await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      mediaIds: command.mediaId ? [command.mediaId] : [],
      apply: (evaluation: Evaluation): string =>
        evaluation.addOption(command.questionId, { content: command.content, isCorrect: command.isCorrect, mediaId: command.mediaId }, command.actor.id),
    });
  }
}
