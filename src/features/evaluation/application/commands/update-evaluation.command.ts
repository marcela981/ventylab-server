/*
 * Funcionalidad: Comando UpdateEvaluationCommand
 * Descripción: Intención de editar los datos generales de una evaluación (campos omitidos no cambian; null limpia); lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationDescriptionInput } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

export class UpdateEvaluationCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly title?: string;
  public readonly description?: EvaluationDescriptionInput | null;
  public readonly moduleId?: string | null;
  public readonly levelId?: string | null;
  public readonly lessonId?: string | null;
  public readonly durationMinutes?: number | null;
  public readonly maxAttempts?: number;
  public readonly shuffleQuestions?: boolean;
  public readonly showResultsImmediately?: boolean;
  public readonly order?: number;

  public constructor({ evaluationId, actor, title, description, moduleId, levelId, lessonId, durationMinutes, maxAttempts, shuffleQuestions, showResultsImmediately, order }: { evaluationId: string; actor: EvaluationActor; title?: string; description?: EvaluationDescriptionInput | null; moduleId?: string | null; levelId?: string | null; lessonId?: string | null; durationMinutes?: number | null; maxAttempts?: number; shuffleQuestions?: boolean; showResultsImmediately?: boolean; order?: number }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.title = title;
    this.description = description;
    this.moduleId = moduleId;
    this.levelId = levelId;
    this.lessonId = lessonId;
    this.durationMinutes = durationMinutes;
    this.maxAttempts = maxAttempts;
    this.shuffleQuestions = shuffleQuestions;
    this.showResultsImmediately = showResultsImmediately;
    this.order = order;
  }
}
