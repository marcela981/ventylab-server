/*
 * Funcionalidad: Comando UpdateEvaluationScenarioCommand
 * Descripción: Intención de editar el contenido o los medios de un escenario; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class UpdateEvaluationScenarioCommand {
  public readonly evaluationId: string;
  public readonly scenarioId: string;
  public readonly actor: EvaluationActor;
  public readonly content?: unknown;
  public readonly mediaIds?: string[];

  public constructor({ evaluationId, scenarioId, actor, content, mediaIds }: { evaluationId: string; scenarioId: string; actor: EvaluationActor; content?: unknown; mediaIds?: string[] }) {
    this.evaluationId = evaluationId;
    this.scenarioId = scenarioId;
    this.actor = actor;
    this.content = content;
    this.mediaIds = mediaIds;
  }
}
