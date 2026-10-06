/*
 * Funcionalidad: Comando ReorderEvaluationScenariosCommand
 * Descripción: Intención de reordenar por lotes los escenarios; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderEntry } from "@/features/evaluation/domain/entities/evaluation-items";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class ReorderEvaluationScenariosCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly items: OrderEntry[];

  public constructor({ evaluationId, actor, items }: { evaluationId: string; actor: EvaluationActor; items: OrderEntry[] }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.items = items;
  }
}
