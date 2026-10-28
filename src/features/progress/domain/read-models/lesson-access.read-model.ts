/*
 * Funcionalidad: Modelo de lectura del acceso secuencial a lecciones
 * Descripción: Define la secuencia de una lección dentro de su módulo (lecciones publicadas anteriores en orden), los motivos de bloqueo (módulo bloqueado o lección anterior incompleta) y la decisión de acceso con la lista de lecciones que faltan por completar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type LessonAccessReason = "module_locked" | "previous_lesson_incomplete";

export const MODULE_LOCKED_REASON: LessonAccessReason = "module_locked";
export const PREVIOUS_LESSON_INCOMPLETE_REASON: LessonAccessReason = "previous_lesson_incomplete";

export const LESSON_ACCESS_REASON_VALUES: readonly LessonAccessReason[] = [MODULE_LOCKED_REASON, PREVIOUS_LESSON_INCOMPLETE_REASON] as const;

export interface SequenceLesson {
  readonly lessonId: string;
  readonly title: string;
}

export interface LessonSequence {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly previousLessons: SequenceLesson[];
}

export interface LessonAccessDecision {
  readonly allowed: boolean;
  readonly reason?: LessonAccessReason;
  readonly missing: SequenceLesson[];
}
