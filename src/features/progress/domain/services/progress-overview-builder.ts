/*
 * Funcionalidad: Construcción del resumen general de progreso
 * Descripción: Función pura que arma el resumen del panel del estudiante (estadísticas, módulos con disponibilidad secuencial por nivel, lecciones con avance por páginas vistas y progreso por nivel ponderado por lecciones) a partir de los módulos publicados, los hechos de completitud por páginas y LessonCompletion
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { computeLessonWeightedProgress, isLessonCompleted } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { type LessonCompletionSnapshot, type OverviewModuleSource } from "@/features/progress/domain/read-models/progress-records.read-model";
import {
  type OverviewLessonItem,
  type OverviewLevelItem,
  type OverviewModuleItem,
  type ProgressOverview,
} from "@/features/progress/domain/read-models/progress-views.read-model";
import { MAX_IN_PROGRESS_FRACTION } from "@/features/progress/domain/services/module-progress-calculator";

export const XP_PER_OVERVIEW_LEVEL: number = 500;
export const XP_PER_COMPLETED_LESSON: number = 100;

const NO_LEVEL_KEY: string = "__no_level__";

const LEVEL_SLUG_MAP: Readonly<Record<string, string>> = {
  "level-prerequisitos": "prerequisitos",
  "level-beginner": "beginner",
  "level-intermedio": "intermediate",
  "level-avanzado": "advanced",
};

interface LevelAccumulator {
  title: string;
  order: number;
  moduleIds: string[];
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
}

function isCompleted(lessonId: string, factByLesson: Map<string, LessonCompletionFact>): boolean {
  const fact: LessonCompletionFact | undefined = factByLesson.get(lessonId);

  return fact !== undefined && isLessonCompleted(fact);
}

function summarizeModule(module: OverviewModuleSource, factByLesson: Map<string, LessonCompletionFact>): LessonWeightedProgress {
  const completedLessons: number = module.lessonIds.filter((lessonId: string) => isCompleted(lessonId, factByLesson)).length;

  return computeLessonWeightedProgress(completedLessons, module.lessonIds.length);
}

function buildModuleItems(modules: OverviewModuleSource[], factByLesson: Map<string, LessonCompletionFact>): OverviewModuleItem[] {
  const previousCompleteByLevel: Map<string, boolean> = new Map();

  return modules.map((module: OverviewModuleSource): OverviewModuleItem => {
    const levelKey: string = module.levelId ?? NO_LEVEL_KEY;
    const summary: LessonWeightedProgress = summarizeModule(module, factByLesson);
    const isAvailable: boolean = previousCompleteByLevel.get(levelKey) ?? true;

    previousCompleteByLevel.set(levelKey, summary.completed);

    return {
      moduleId: module.id,
      title: module.title,
      levelId: module.levelId,
      description: module.description,
      difficulty: module.difficulty,
      estimatedTime: module.estimatedTime,
      order: module.order,
      lessonsTotal: summary.totalLessons,
      lessonsCompleted: summary.completedLessons,
      percent: summary.percentage,
      isAvailable,
      completed: summary.completed,
    };
  });
}

function lessonFraction(fact: LessonCompletionFact | undefined): number {
  if (!fact) {
    return 0;
  }

  if (isLessonCompleted(fact)) {
    return 1;
  }

  return fact.publishedPageCount > 0 ? Math.min(MAX_IN_PROGRESS_FRACTION, fact.viewedPageCount / fact.publishedPageCount) : 0;
}

function buildLessonItems(
  modules: OverviewModuleSource[],
  factByLesson: Map<string, LessonCompletionFact>,
  completionByLesson: Map<string, LessonCompletionSnapshot>,
): OverviewLessonItem[] {
  return modules.flatMap((module: OverviewModuleSource) =>
    module.lessonIds.map((lessonId: string): OverviewLessonItem => {
      const completion: LessonCompletionSnapshot | undefined = completionByLesson.get(lessonId);
      const completed: boolean = isCompleted(lessonId, factByLesson);

      return {
        lessonId,
        moduleId: module.id,
        completed,
        progress: lessonFraction(factByLesson.get(lessonId)),
        xpEarned: completed ? XP_PER_COMPLETED_LESSON : 0,
        lastVisitedAt: completion?.lastAccessed,
        updatedAt: completion?.updatedAt ?? completion?.lastAccessed,
      };
    }),
  );
}

function buildLevelItems(modules: OverviewModuleSource[], factByLesson: Map<string, LessonCompletionFact>): OverviewLevelItem[] {
  const levels: Map<string, LevelAccumulator> = new Map();

  for (const module of modules) {
    if (!module.levelId || !module.level) {
      continue;
    }

    const summary: LessonWeightedProgress = summarizeModule(module, factByLesson);
    const accumulator: LevelAccumulator = levels.get(module.levelId) ?? {
      title: module.level.title,
      order: module.level.order,
      moduleIds: [],
      completedModules: 0,
      totalLessons: 0,
      completedLessons: 0,
    };

    accumulator.moduleIds.push(module.id);
    accumulator.completedModules += summary.completed ? 1 : 0;
    accumulator.totalLessons += summary.totalLessons;
    accumulator.completedLessons += summary.completedLessons;

    levels.set(module.levelId, accumulator);
  }

  return Array.from(levels.entries())
    .map(([levelId, data]: [string, LevelAccumulator]): OverviewLevelItem => ({
      levelId,
      slug: LEVEL_SLUG_MAP[levelId] ?? levelId.replace(/^level-/, ""),
      title: data.title,
      order: data.order,
      moduleIds: data.moduleIds,
      totalModules: data.moduleIds.length,
      completedModules: data.completedModules,
      progressPercentage: computeLessonWeightedProgress(data.completedLessons, data.totalLessons).percentage,
      totalLessons: data.totalLessons,
      completedLessons: data.completedLessons,
    }))
    .sort((first: OverviewLevelItem, second: OverviewLevelItem) => first.order - second.order);
}

export function buildProgressOverview({
  modules,
  facts,
  completions,
}: {
  modules: OverviewModuleSource[];
  facts: LessonCompletionFact[];
  completions: LessonCompletionSnapshot[];
}): ProgressOverview {
  const factByLesson: Map<string, LessonCompletionFact> = new Map(facts.map((fact: LessonCompletionFact): [string, LessonCompletionFact] => [fact.lessonId, fact]));

  const completionByLesson: Map<string, LessonCompletionSnapshot> = new Map(
    completions.map((completion: LessonCompletionSnapshot): [string, LessonCompletionSnapshot] => [completion.lessonId, completion]),
  );

  const moduleItems: OverviewModuleItem[] = buildModuleItems(modules, factByLesson);
  const lessonItems: OverviewLessonItem[] = buildLessonItems(modules, factByLesson, completionByLesson);
  const completedLessons: number = lessonItems.filter((lesson: OverviewLessonItem) => lesson.completed).length;
  const xpTotal: number = completedLessons * XP_PER_COMPLETED_LESSON;
  const level: number = Math.floor(xpTotal / XP_PER_OVERVIEW_LEVEL) + 1;

  return {
    stats: {
      completedLessons,
      totalLessons: lessonItems.length,
      modulesCompleted: moduleItems.filter((module: OverviewModuleItem) => module.completed).length,
      totalModules: modules.length,
      xpTotal,
      level,
      nextLevelXp: level * XP_PER_OVERVIEW_LEVEL,
      streakDays: 0,
    },
    modules: moduleItems,
    lessons: lessonItems,
    levels: buildLevelItems(modules, factByLesson),
  };
}
