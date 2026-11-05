/*
 * Funcionalidad: Comando PublishEvaluationGradesCommand
 * Descripción: Datos de la publicación masiva de notas de una evaluación (opcionalmente de un grupo) en el alcance del profesor o administrador que la solicita, con el alcance de la liberación (solo la nota, o la nota con las respuestas y la retroalimentación IA; v1.1, ajustes C1)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type ResultsReleaseScopeValue } from "@/features/evaluation/domain/value-objects/results-release-scope";

export class PublishEvaluationGradesCommand {
  public readonly evaluationId: string;
  public readonly groupId?: string;
  public readonly actor: EvaluationActor;
  public readonly releaseScope: ResultsReleaseScopeValue;

  public constructor({ evaluationId, groupId, actor, releaseScope }: { evaluationId: string; groupId?: string; actor: EvaluationActor; releaseScope: ResultsReleaseScopeValue }) {
    this.evaluationId = evaluationId;
    this.groupId = groupId;
    this.actor = actor;
    this.releaseScope = releaseScope;
  }
}
