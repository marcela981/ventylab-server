/*
 * Funcionalidad: Errores de dominio de lecciones
 * Descripción: Define los errores LessonNotFoundError, InactiveModuleLessonCreationError, InvalidLessonContentError, LessonOrderAlreadyTakenError, InvalidLessonReorderError que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class LessonNotFoundError extends DomainError {
  public constructor() {
    super("Lesson not found", "lessons.lesson_not_found");
  }
}

export class InactiveModuleLessonCreationError extends DomainError {
  public constructor() {
    super("Lessons cannot be added to an inactive module", "lessons.inactive_module_lesson_creation");
  }
}

export class InvalidLessonContentError extends DomainError {
  public constructor() {
    super("Lesson content must have a type field and a non-empty sections array", "lessons.invalid_lesson_content");
  }
}

export class LessonOrderAlreadyTakenError extends DomainError {
  public constructor(order: number) {
    super(`Another lesson of the module already has order ${order}`, "lessons.lesson_order_already_taken");
  }
}

export class InvalidLessonReorderError extends DomainError {
  public constructor() {
    super("The lesson list must contain every lesson of the module exactly once", "lessons.invalid_lesson_reorder");
  }
}
