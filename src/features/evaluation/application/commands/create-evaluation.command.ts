/*
 * Funcionalidad: Comando CreateEvaluationCommand
 * Descripción: Intención de crear una evaluación en borrador; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationDescriptionInput } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export class CreateEvaluationCommand {
  public readonly actor: EvaluationActor;
  public readonly type: EvaluationTypeValue;
  public readonly title: string;
  public readonly description?: EvaluationDescriptionInput;
  public readonly moduleId?: string;
  public readonly levelId?: string;
  public readonly lessonId?: string;
  public readonly durationMinutes?: number;
  public readonly maxAttempts?: number;
  public readonly shuffleQuestions?: boolean;
  public readonly showResultsImmediately?: boolean;

  public constructor({ actor, type, title, description, moduleId, levelId, lessonId, durationMinutes, maxAttempts, shuffleQuestions, showResultsImmediately }: { actor: EvaluationActor; type: EvaluationTypeValue; title: string; description?: EvaluationDescriptionInput; moduleId?: string; levelId?: string; lessonId?: string; durationMinutes?: number; maxAttempts?: number; shuffleQuestions?: boolean; showResultsImmediately?: boolean }) {
    this.actor = actor;
    this.type = type;
    this.title = title;
    this.description = description;
    this.moduleId = moduleId;
    this.levelId = levelId;
    this.lessonId = lessonId;
    this.durationMinutes = durationMinutes;
    this.maxAttempts = maxAttempts;
    this.shuffleQuestions = shuffleQuestions;
    this.showResultsImmediately = showResultsImmediately;
  }
}
