/*
 * Funcionalidad: Comando GradeEvaluationAnswerCommand
 * Descripción: Datos de la calificación manual de una pregunta de un intento por parte de un profesor o administrador (puntaje manual y comentario opcional, obligatorio al sobrescribir)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class GradeEvaluationAnswerCommand {
  public readonly attemptId: string;
  public readonly questionId: string;
  public readonly manualScore: number;
  public readonly comment?: string;
  public readonly actor: EvaluationActor;

  public constructor({
    attemptId,
    questionId,
    manualScore,
    comment,
    actor,
  }: {
    attemptId: string;
    questionId: string;
    manualScore: number;
    comment?: string;
    actor: EvaluationActor;
  }) {
    this.attemptId = attemptId;
    this.questionId = questionId;
    this.manualScore = manualScore;
    this.comment = comment;
    this.actor = actor;
  }
}
