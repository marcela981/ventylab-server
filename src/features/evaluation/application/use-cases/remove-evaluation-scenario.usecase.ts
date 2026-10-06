/*
 * Funcionalidad: Caso de uso RemoveEvaluationScenarioUseCase
 * Descripción: Quita un escenario de una evaluación y desvincula sus preguntas, que permanecen en la evaluación (cambio no estructural)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { RemoveEvaluationScenarioCommand } from "@/features/evaluation/application/commands/remove-evaluation-scenario.command";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 * @throws {EvaluationScenarioNotFoundError} If the scenario does not belong to the evaluation
 */
@Injectable()
export class RemoveEvaluationScenarioUseCase {
  public constructor(private readonly _editor: EvaluationEditor) {}

  public async execute(command: RemoveEvaluationScenarioCommand): Promise<void> {
    await this._editor.edit({
      evaluationId: command.evaluationId,
      actor: command.actor,
      apply: (evaluation: Evaluation): void => evaluation.removeScenario(command.scenarioId, command.actor.id),
    });
  }
}
