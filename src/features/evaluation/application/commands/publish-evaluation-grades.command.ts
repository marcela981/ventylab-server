/*
 * Funcionalidad: Comando PublishEvaluationGradesCommand
 * Descripción: Datos de la publicación masiva de notas de una evaluación (opcionalmente de un grupo) en el alcance del profesor o administrador que la solicita
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class PublishEvaluationGradesCommand {
  public readonly evaluationId: string;
  public readonly groupId?: string;
  public readonly actor: EvaluationActor;

  public constructor({ evaluationId, groupId, actor }: { evaluationId: string; groupId?: string; actor: EvaluationActor }) {
    this.evaluationId = evaluationId;
    this.groupId = groupId;
    this.actor = actor;
  }
}
