/*
 * Funcionalidad: Comando AddEvaluationOptionCommand
 * Descripción: Intención de agregar una opción a una pregunta de selección; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class AddEvaluationOptionCommand {
  public readonly evaluationId: string;
  public readonly questionId: string;
  public readonly actor: EvaluationActor;
  public readonly content: string;
  public readonly isCorrect?: boolean;
  public readonly mediaId?: string;

  public constructor({ evaluationId, questionId, actor, content, isCorrect, mediaId }: { evaluationId: string; questionId: string; actor: EvaluationActor; content: string; isCorrect?: boolean; mediaId?: string }) {
    this.evaluationId = evaluationId;
    this.questionId = questionId;
    this.actor = actor;
    this.content = content;
    this.isCorrect = isCorrect;
    this.mediaId = mediaId;
  }
}
