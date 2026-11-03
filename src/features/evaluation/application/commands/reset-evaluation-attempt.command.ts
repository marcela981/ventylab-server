/*
 * Funcionalidad: Comando ResetEvaluationAttemptCommand
 * Descripción: Datos para que un profesor o administrador conceda a un estudiante un intento adicional de una evaluación (reinicio no destructivo) con el motivo obligatorio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class ResetEvaluationAttemptCommand {
  public readonly userId: string;
  public readonly evaluationId: string;
  public readonly reason: string;
  public readonly actor: EvaluationActor;

  public constructor({ userId, evaluationId, reason, actor }: { userId: string; evaluationId: string; reason: string; actor: EvaluationActor }) {
    this.userId = userId;
    this.evaluationId = evaluationId;
    this.reason = reason;
    this.actor = actor;
  }
}
