/*
 * Funcionalidad: Comando RegenerateGradeFeedbackCommand
 * Descripción: Intención de un docente o administrador de regenerar la retroalimentación de un intento calificado; idioma activo del solicitante
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class RegenerateGradeFeedbackCommand {
  public readonly attemptId: string;
  public readonly actor: EvaluationActor;
  public readonly language?: LanguageValue;

  public constructor({ attemptId, actor, language }: { attemptId: string; actor: EvaluationActor; language?: LanguageValue }) {
    this.attemptId = attemptId;
    this.actor = actor;
    this.language = language;
  }
}
