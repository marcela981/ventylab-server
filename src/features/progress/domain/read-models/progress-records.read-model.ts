/*
 * Funcionalidad: Registros de progreso
 * Descripción: Define las interfaces de lectura y escritura sobre UserProgress y LessonCompletion, y las fuentes de contenido (lecciones, módulos, niveles, prerrequisitos) que consultan los casos de uso de progreso
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ProgressStatusValue } from "@/features/progress/domain/value-objects/progress-status";

export interface LessonCompletionSnapshot {
  readonly lessonId: string;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
  readonly isCompleted: boolean;
  readonly completedAt?: Date;
  readonly bestQuizScore?: number;
  readonly updatedAt: Date;
}

export interface ModuleProgressSnapshot {
  readonly moduleId: string;
  readonly status: ProgressStatusValue;
  readonly isModuleCompleted: boolean;
  readonly completedLessonsCount: number;
  readonly totalLessons: number;
  readonly progressPercentage: number;
  readonly timeSpent: number;
  readonly lastAccessedAt: Date;
  readonly completedAt?: Date;
}

export interface ScoreWrite {
  readonly best: number;
  readonly last: number;
}

export interface LessonCompletionWrite {
  readonly userId: string;
  readonly lessonId: string;
  readonly currentStepIndex?: number;
  readonly totalSteps?: number;
  readonly timeSpentDelta: number;
  readonly isCompleted: boolean;
  readonly stampCompletedAt: boolean;
  readonly quizScore?: ScoreWrite;
}

export interface ModuleAccessWrite {
  readonly userId: string;
  readonly moduleId: string;
  readonly lessonId: string;
  readonly timeSpentDelta: number;
  readonly markInProgress: boolean;
}

export interface ModuleCountersRefresh {
  readonly userId: string;
  readonly moduleId: string;
  readonly lastAccessedLessonId?: string;
  readonly timeSpentDelta?: number;
}

export interface ModuleCounters {
  readonly status: ProgressStatusValue;
  readonly isModuleCompleted: boolean;
  readonly completedLessonsCount: number;
  readonly totalLessons: number;
  readonly progressPercentage: number;
}

export interface LessonReference {
  readonly moduleId: string;
  readonly lessonId: string;
}

export interface LessonGate {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly order: number;
  readonly moduleIsActive: boolean;
}

export interface ModuleLessonSource {
  readonly id: string;
  readonly moduleId: string;
}

export interface OverviewModuleSource {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly levelId?: string;
  readonly level?: { readonly id: string; readonly title: string; readonly order: number };
  readonly lessonIds: string[];
}
