/*
 * Funcionalidad: Errores de dominio de pasos (tarjetas)
 * Descripción: Define los errores StepNotFoundError, InactiveLessonStepCreationError, StepOrderAlreadyTakenError, InvalidStepReorderError que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class StepNotFoundError extends DomainError {
  public constructor() {
    super("Step not found", "steps.step_not_found");
  }
}

export class InactiveLessonStepCreationError extends DomainError {
  public constructor() {
    super("Steps cannot be added to an inactive lesson", "steps.inactive_lesson_step_creation");
  }
}

export class StepOrderAlreadyTakenError extends DomainError {
  public constructor(order: number) {
    super(`Another step of the lesson already has order ${order}`, "steps.step_order_already_taken");
  }
}

export class InvalidStepReorderError extends DomainError {
  public constructor() {
    super("One or more steps do not exist or do not belong to the lesson", "steps.invalid_step_reorder");
  }
}
