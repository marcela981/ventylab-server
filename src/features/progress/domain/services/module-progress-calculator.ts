/*
 * Funcionalidad: Cálculo de progreso por lección y módulo
 * Descripción: Funciones puras que derivan contadores y estado del módulo, porcentaje por pasos de una lección, mejores puntajes y vistas de progreso de lección a partir de los registros de LessonCompletion
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { computeLessonWeightedProgress } from "@/features/curriculum/domain/services/lesson-completion-rules";
import {
  type LessonCompletionSnapshot,
  type ModuleCounters,
  type ScoreWrite,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type LessonProgressView } from "@/features/progress/domain/read-models/progress-views.read-model";
import {
  COMPLETED_PROGRESS_STATUS,
  IN_PROGRESS_PROGRESS_STATUS,
  NOT_STARTED_PROGRESS_STATUS,
  type ProgressStatusValue,
} from "@/features/progress/domain/value-objects/progress-status";

export const MAX_IN_PROGRESS_FRACTION: number = 0.99;

export function computeModuleCounters(completedLessonsCount: number, totalLessons: number): ModuleCounters {
  const { percentage: progressPercentage, completed: isModuleCompleted }: LessonWeightedProgress = computeLessonWeightedProgress(completedLessonsCount, totalLessons);

  let status: ProgressStatusValue = NOT_STARTED_PROGRESS_STATUS;

  if (isModuleCompleted) {
    status = COMPLETED_PROGRESS_STATUS;
  } else if (completedLessonsCount > 0) {
    status = IN_PROGRESS_PROGRESS_STATUS;
  }

  return { status, isModuleCompleted, completedLessonsCount, totalLessons, progressPercentage };
}

export function computeStepPercentage(currentStepIndex: number, totalSteps: number, isCompleted: boolean): number {
  if (isCompleted) {
    return 100;
  }

  return totalSteps > 0 ? Math.floor(((currentStepIndex + 1) / totalSteps) * 100) : 0;
}

export function computeInProgressFraction(completion: LessonCompletionSnapshot | undefined): number {
  if (!completion || completion.isCompleted || completion.totalSteps <= 0) {
    return 0;
  }

  return Math.min(MAX_IN_PROGRESS_FRACTION, (completion.currentStepIndex + 1) / completion.totalSteps);
}

export function buildScoreWrite(score: number | undefined, currentBest: number | undefined): ScoreWrite | undefined {
  if (score === undefined) {
    return undefined;
  }

  return { best: Math.max(score, currentBest ?? 0), last: score };
}

export function toLessonProgressView(lessonId: string, completion: LessonCompletionSnapshot | undefined): LessonProgressView {
  if (!completion) {
    return { lessonId, completed: false, timeSpent: 0, completionPercentage: 0, currentStep: 0, totalSteps: 0 };
  }

  return {
    lessonId,
    completed: completion.isCompleted,
    timeSpent: completion.timeSpent,
    lastAccessed: completion.lastAccessed,
    completionPercentage: computeStepPercentage(completion.currentStepIndex, completion.totalSteps, completion.isCompleted),
    currentStep: completion.currentStepIndex + 1,
    totalSteps: completion.totalSteps,
  };
}
