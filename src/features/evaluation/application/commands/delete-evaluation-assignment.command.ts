/*
 * Funcionalidad: Comando DeleteEvaluationAssignmentCommand
 * Descripción: Intención de borrar una asignación de evaluación identificada por evaluación y asignación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class DeleteEvaluationAssignmentCommand {
  public readonly evaluationId: string;
  public readonly assignmentId: string;
  public readonly actor: EvaluationActor;

  public constructor({ evaluationId, assignmentId, actor }: { evaluationId: string; assignmentId: string; actor: EvaluationActor }) {
    this.evaluationId = evaluationId;
    this.assignmentId = assignmentId;
    this.actor = actor;
  }
}
