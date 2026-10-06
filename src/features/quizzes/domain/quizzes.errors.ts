/*
 * Funcionalidad: Errores de la feature de quizzes
 * Descripción: Errores de dominio de quizzes (no encontrado, inactivo, intento ya registrado) con sus claves i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class QuizNotFoundError extends DomainError {
  public constructor() {
    super("Quiz not found", "quizzes.quiz_not_found");
  }
}

export class QuizInactiveError extends DomainError {
  public constructor() {
    super("Quiz is inactive", "quizzes.quiz_inactive");
  }
}

export class QuizAlreadyAttemptedError extends DomainError {
  public constructor() {
    super("Quiz already completed", "quizzes.quiz_already_attempted");
  }
}
