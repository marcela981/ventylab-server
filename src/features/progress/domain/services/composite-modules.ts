/*
 * Funcionalidad: Módulos compuestos del currículo
 * Descripción: Define los módulos de presentación que agrupan varios módulos de la base de datos y calcula su progreso agregado a partir de UserProgress y del avance por pasos de cada lección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonCompletionSnapshot,
  type ModuleLessonSource,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type ModuleProgressSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import { MAX_IN_PROGRESS_FRACTION } from "@/features/progress/domain/services/module-progress-calculator";

export const COMPOSITE_MODULES: Readonly<Record<string, readonly string[]>> = {
  "module-01-fundamentals": [
    "module-01-inversion-fisiologica",
    "module-02-ecuacion-movimiento",
    "module-03-variables-fase",
    "module-04-modos-ventilatorios",
    "module-05-monitorizacion-grafica",
    "module-06-efectos-sistemicos",
  ],
  "respiratory-physiology": [
    "module-01-inversion-fisiologica",
    "module-02-ecuacion-movimiento",
    "module-03-variables-fase",
  ],
};

export function getCompositeSubModuleIds(moduleId: string): string[] | undefined {
  const subModuleIds: readonly string[] | undefined = COMPOSITE_MODULES[moduleId];

  return subModuleIds && subModuleIds.length > 0 ? [...subModuleIds] : undefined;
}

function computeLessonPercentage(completion: LessonCompletionSnapshot | undefined): number {
  if (!completion) {
    return 0;
  }

  if (completion.isCompleted) {
    return 100;
  }

  return completion.totalSteps > 0 ? Math.min(MAX_IN_PROGRESS_FRACTION * 100, ((completion.currentStepIndex + 1) / completion.totalSteps) * 100) : 0;
}

export function computeCompositeModuleSummary({
  moduleId,
  subModuleIds,
  progresses,
  lessons,
  completions,
}: {
  moduleId: string;
  subModuleIds: string[];
  progresses: ModuleProgressSnapshot[];
  lessons: ModuleLessonSource[];
  completions: LessonCompletionSnapshot[];
}): ModuleProgressSummary {
  const totalLessons: number = subModuleIds.length;
  const completedLessons: number = progresses.filter((progress: ModuleProgressSnapshot) => progress.isModuleCompleted).length;
  const completionByLesson: Map<string, LessonCompletionSnapshot> = new Map(
    completions.map((completion: LessonCompletionSnapshot): [string, LessonCompletionSnapshot] => [completion.lessonId, completion]),
  );

  let totalPercentage: number = 0;

  for (const subModuleId of subModuleIds) {
    const stored: ModuleProgressSnapshot | undefined = progresses.find((progress: ModuleProgressSnapshot) => progress.moduleId === subModuleId);

    if (stored?.isModuleCompleted) {
      totalPercentage += 100;

      continue;
    }

    const subLessons: ModuleLessonSource[] = lessons.filter((lesson: ModuleLessonSource) => lesson.moduleId === subModuleId);

    if (subLessons.length === 0) {
      totalPercentage += stored?.progressPercentage ?? 0;

      continue;
    }

    const lessonPercentageSum: number = subLessons.reduce(
      (sum: number, lesson: ModuleLessonSource) => sum + computeLessonPercentage(completionByLesson.get(lesson.id)),
      0,
    );

    totalPercentage += lessonPercentageSum / subLessons.length;
  }

  const isModuleCompleted: boolean = totalLessons > 0 && completedLessons === totalLessons;

  return {
    moduleId,
    totalLessons,
    completedLessons,
    completionPercentage: totalLessons > 0 ? Math.round(totalPercentage / totalLessons) : 0,
    isModuleCompleted,
    timeSpent: progresses.reduce((sum: number, progress: ModuleProgressSnapshot) => sum + progress.timeSpent, 0),
    completedAt: isModuleCompleted ? progresses.find((progress: ModuleProgressSnapshot) => progress.completedAt)?.completedAt : undefined,
    lessons: [],
    source: "composite_aggregate",
  };
}
