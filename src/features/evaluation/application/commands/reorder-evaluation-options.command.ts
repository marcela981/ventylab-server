/*
 * Funcionalidad: Comando ReorderEvaluationOptionsCommand
 * Descripción: Intención de reordenar por lotes las opciones de una pregunta; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderEntry } from "@/features/evaluation/domain/entities/evaluation-items";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class ReorderEvaluationOptionsCommand {
  public readonly evaluationId: string;
  public readonly questionId: string;
  public readonly actor: EvaluationActor;
  public readonly items: OrderEntry[];

  public constructor({ evaluationId, questionId, actor, items }: { evaluationId: string; questionId: string; actor: EvaluationActor; items: OrderEntry[] }) {
    this.evaluationId = evaluationId;
    this.questionId = questionId;
    this.actor = actor;
    this.items = items;
  }
}
