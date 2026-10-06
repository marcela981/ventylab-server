/*
 * Funcionalidad: Comando RemoveEvaluationScenarioCommand
 * Descripción: Intención de quitar un escenario de una evaluación; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class RemoveEvaluationScenarioCommand {
  public readonly evaluationId: string;
  public readonly scenarioId: string;
  public readonly actor: EvaluationActor;

  public constructor({ evaluationId, scenarioId, actor }: { evaluationId: string; scenarioId: string; actor: EvaluationActor }) {
    this.evaluationId = evaluationId;
    this.scenarioId = scenarioId;
    this.actor = actor;
  }
}
