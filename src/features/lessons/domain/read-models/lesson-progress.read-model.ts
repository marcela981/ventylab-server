/*
 * Funcionalidad: Modelos de lectura de lecciones
 * Descripción: Define las interfaces LessonCompletionRecord, ModuleProgressRecord, LessonCompletionResult que devuelven las consultas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LessonCompletionRecord {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
  readonly isCompleted: boolean;
  readonly completedAt?: Date;
  readonly updatedAt: Date;
}

export interface ModuleProgressRecord {
  readonly id: string;
  readonly userId: string;
  readonly moduleId: string;
  readonly status: string;
  readonly isModuleCompleted: boolean;
  readonly completedLessonsCount: number;
  readonly totalLessons: number;
  readonly progressPercentage: number;
  readonly timeSpent: number;
  readonly lastAccessedLessonId?: string;
  readonly lastAccessedAt: Date;
  readonly completedAt?: Date;
}

export interface LessonCompletionResult {
  readonly lessonProgress: LessonCompletionRecord;
  readonly moduleCompleted: boolean;
  readonly moduleProgress: ModuleProgressRecord;
}
