/*
 * Funcionalidad: Errores de dominio de progreso
 * Descripción: Define los errores de dominio de la feature de progreso (acceso secuencial a lecciones y puntajes requeridos de quiz y caso clínico). v1.2: LessonLockedError (403 progress.lesson_locked) con el motivo y las lecciones faltantes en details
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";
import { type LessonAccessDecision, type LessonAccessReason, type SequenceLesson } from "@/features/progress/domain/read-models/lesson-access.read-model";

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

export class LessonLockedError extends DomainError {
  public readonly reason: LessonAccessReason | null;
  public readonly missing: readonly SequenceLesson[];

  public constructor(decision: LessonAccessDecision) {
    super("The lesson is locked until its module is unlocked and the previous lessons are completed", "progress.lesson_locked");
    this.reason = decision.reason ?? null;
    this.missing = decision.missing;
  }

  public get details(): { reason: LessonAccessReason | null; missing: { lessonId: string; title: string }[] } {
    return { reason: this.reason, missing: this.missing.map((lesson: SequenceLesson) => ({ lessonId: lesson.lessonId, title: lesson.title })) };
  }
}
