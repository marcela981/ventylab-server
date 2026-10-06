/*
 * Funcionalidad: Comando UpdateEvaluationAssignmentCommand
 * Descripción: Intención de editar la ventana de una asignación de evaluación (inicio y fin opcionales)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class UpdateEvaluationAssignmentCommand {
  public readonly evaluationId: string;
  public readonly assignmentId: string;
  public readonly actor: EvaluationActor;
  public readonly startsAt?: Date;
  public readonly endsAt?: Date;

  public constructor({
    evaluationId,
    assignmentId,
    actor,
    startsAt,
    endsAt,
  }: {
    evaluationId: string;
    assignmentId: string;
    actor: EvaluationActor;
    startsAt?: Date;
    endsAt?: Date;
  }) {
    this.evaluationId = evaluationId;
    this.assignmentId = assignmentId;
    this.actor = actor;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
  }
}
