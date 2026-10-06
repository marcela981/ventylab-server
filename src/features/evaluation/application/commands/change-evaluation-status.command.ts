/*
 * Funcionalidad: Comando ChangeEvaluationStatusCommand
 * Descripción: Intención de cambiar el estado de una evaluación; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";

export class ChangeEvaluationStatusCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly status: EvaluationStatusValue;

  public constructor({ evaluationId, actor, status }: { evaluationId: string; actor: EvaluationActor; status: EvaluationStatusValue }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.status = status;
  }
}
