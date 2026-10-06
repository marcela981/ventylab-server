/*
 * Funcionalidad: Comando UpdateEvaluationOptionCommand
 * Descripción: Intención de editar una opción (texto, medio o corrección); lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class UpdateEvaluationOptionCommand {
  public readonly evaluationId: string;
  public readonly questionId: string;
  public readonly optionId: string;
  public readonly actor: EvaluationActor;
  public readonly content?: string;
  public readonly isCorrect?: boolean;
  public readonly mediaId?: string | null;

  public constructor({ evaluationId, questionId, optionId, actor, content, isCorrect, mediaId }: { evaluationId: string; questionId: string; optionId: string; actor: EvaluationActor; content?: string; isCorrect?: boolean; mediaId?: string | null }) {
    this.evaluationId = evaluationId;
    this.questionId = questionId;
    this.optionId = optionId;
    this.actor = actor;
    this.content = content;
    this.isCorrect = isCorrect;
    this.mediaId = mediaId;
  }
}
