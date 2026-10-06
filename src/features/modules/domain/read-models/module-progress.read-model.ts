/*
 * Funcionalidad: Modelos de lectura de módulos
 * Descripción: Define las interfaces ModuleLessonProgress, ModuleProgressView, ModuleResumeSnapshot, ModuleResumeState que devuelven las consultas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface ModuleLessonProgress {
  readonly lesson: { readonly id: string; readonly title: string; readonly order: number; readonly estimatedTime?: number };
  readonly completed: boolean;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
}

export interface ModuleProgressView {
  readonly progress: { readonly id: string; readonly completedAt?: Date; readonly timeSpent: number };
  readonly module: { readonly id: string; readonly title: string; readonly estimatedTime?: number };
  readonly statistics: {
    readonly totalLessons: number;
    readonly completedLessons: number;
    readonly completionPercentage: number;
    readonly remainingLessons: number;
  };
  readonly lessonProgress: ModuleLessonProgress[];
}

export interface ModuleResumeSnapshot {
  readonly moduleId: string;
  readonly moduleTitle: string;
  readonly lessons: { readonly id: string; readonly title: string; readonly order: number; readonly activeStepCount: number }[];
  readonly completions: { readonly lessonId: string; readonly isCompleted: boolean; readonly currentStepIndex: number; readonly totalSteps: number }[];
  readonly lastAccessedAt?: Date;
}

export interface ModuleResumeState {
  readonly moduleId: string;
  readonly moduleName: string;
  readonly currentLessonId: string;
  readonly currentLessonTitle: string;
  readonly currentLessonOrder: number;
  readonly currentStepIndex: number;
  readonly totalStepsInLesson: number;
  readonly moduleProgress: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly isModuleComplete: boolean;
  readonly lastAccessedAt?: Date;
}
