/*
 * Funcionalidad: Comando AddEvaluationScenarioCommand
 * Descripción: Intención de agregar un escenario a una evaluación; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class AddEvaluationScenarioCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly content: unknown;
  public readonly mediaIds?: string[];

  public constructor({ evaluationId, actor, content, mediaIds }: { evaluationId: string; actor: EvaluationActor; content: unknown; mediaIds?: string[] }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.content = content;
    this.mediaIds = mediaIds;
  }
}
