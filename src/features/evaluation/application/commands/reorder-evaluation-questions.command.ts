/*
 * Funcionalidad: Comando ReorderEvaluationQuestionsCommand
 * Descripción: Intención de reordenar por lotes las preguntas (y moverlas entre escenarios); lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type QuestionReorderItem } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class ReorderEvaluationQuestionsCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly items: QuestionReorderItem[];

  public constructor({ evaluationId, actor, items }: { evaluationId: string; actor: EvaluationActor; items: QuestionReorderItem[] }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.items = items;
  }
}
