/*
 * Funcionalidad: Comando RemoveEvaluationQuestionCommand
 * Descripción: Intención de quitar una pregunta de una evaluación; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class RemoveEvaluationQuestionCommand {
  public readonly evaluationId: string;
  public readonly questionId: string;
  public readonly actor: EvaluationActor;

  public constructor({ evaluationId, questionId, actor }: { evaluationId: string; questionId: string; actor: EvaluationActor }) {
    this.evaluationId = evaluationId;
    this.questionId = questionId;
    this.actor = actor;
  }
}
