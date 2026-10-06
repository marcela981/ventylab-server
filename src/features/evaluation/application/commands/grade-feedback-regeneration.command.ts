/*
 * Funcionalidad: Comando RegenerateGradeFeedbackCommand
 * Descripción: Intención de un docente o administrador de regenerar la retroalimentación de un intento calificado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class RegenerateGradeFeedbackCommand {
  public readonly attemptId: string;
  public readonly actor: EvaluationActor;

  public constructor({ attemptId, actor }: { attemptId: string; actor: EvaluationActor }) {
    this.attemptId = attemptId;
    this.actor = actor;
  }
}
