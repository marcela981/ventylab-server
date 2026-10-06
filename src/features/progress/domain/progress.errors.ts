/*
 * Funcionalidad: Errores de dominio de progreso
 * Descripción: Define los errores de dominio de la feature de progreso (acceso secuencial a lecciones y puntajes requeridos de quiz y caso clínico)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class LessonAccessDeniedError extends DomainError {
  public constructor() {
    super("Cannot access this lesson yet", "progress.lesson_access_denied");
  }
}

export class QuizScoreRequiredError extends DomainError {
  public constructor() {
    super("Quiz score is required for this lesson", "progress.quiz_score_required");
  }
}
