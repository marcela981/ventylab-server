/*
 * Funcionalidad: Pruebas del constructor del resumen de progreso
 * Descripción: Verifica las estadísticas globales (lecciones y módulos; XP, nivel y racha tomados de las estadísticas de gamificación, en cero sin ellas), la disponibilidad secuencial de módulos dentro de cada nivel, el avance por páginas vistas de cada lección acotado al 99 %, las fechas tomadas del registro de la lección y la agregación por nivel ordenada con su slug
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type GamificationStats } from "@/features/progress/domain/read-models/gamification.read-model";
import { type LessonCompletionSnapshot, type OverviewModuleSource } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type OverviewLessonItem, type ProgressOverview } from "@/features/progress/domain/read-models/progress-views.read-model";
import { buildProgressOverview, XP_PER_COMPLETED_LESSON } from "@/features/progress/domain/services/progress-overview-builder";

const VISITED: Date = new Date("2026-10-11T08:00:00.000Z");
const UPDATED: Date = new Date("2026-10-11T09:00:00.000Z");

const BEGINNER: OverviewModuleSource["level"] = { id: "level-beginner", title: "Beginner", order: 2 };
const PREREQUISITES: OverviewModuleSource["level"] = { id: "level-prerequisitos", title: "Prerequisites", order: 1 };

const MODULES: OverviewModuleSource[] = [
  { id: "M1", title: "Module 1", order: 1, levelId: "level-beginner", level: BEGINNER, lessonIds: ["L1", "L2"] },
  { id: "M2", title: "Module 2", order: 2, levelId: "level-beginner", level: BEGINNER, lessonIds: ["L3"] },
  { id: "M3", title: "Module 3", order: 1, levelId: "level-prerequisitos", level: PREREQUISITES, lessonIds: ["L4"] },
  { id: "M4", title: "Loose module", order: 1, lessonIds: ["L5"] },
];

function fact(lessonId: string, moduleId: string, overrides: Partial<LessonCompletionFact> = {}): LessonCompletionFact {
  return { lessonId, moduleId, publishedPageCount: 4, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

const FACTS: LessonCompletionFact[] = [
  fact("L1", "M1", { viewedPageCount: 4 }),
  fact("L2", "M1", { hasCompletionRecord: true }),
  fact("L3", "M2", { viewedPageCount: 2 }),
  fact("L4", "M3", { viewedPageCount: 4, publishedPageCount: 4 }),
  fact("L5", "M4", { publishedPageCount: 0 }),
];

const COMPLETIONS: LessonCompletionSnapshot[] = [
  { lessonId: "L1", currentStepIndex: 0, totalSteps: 1, timeSpent: 30, lastAccessed: VISITED, isCompleted: true, updatedAt: UPDATED },
];

function lesson(overview: ProgressOverview, lessonId: string): OverviewLessonItem | undefined {
  return overview.lessons.find((item: OverviewLessonItem): boolean => item.lessonId === lessonId);
}

describe("buildProgressOverview", () => {
  it("summarizes completed lessons and modules and takes XP, level and streak from the gamification stats", () => {
    const gamification: GamificationStats = { xpTotal: 1205, level: 3, xpIntoLevel: 205, nextLevelXp: 1500, streakDays: 4, longestStreak: 6, xpToday: 10 };
    const overview: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: FACTS, completions: COMPLETIONS, gamification });

    expect(overview.stats).toEqual({
      completedLessons: 3,
      totalLessons: 5,
      modulesCompleted: 2,
      totalModules: 4,
      xpTotal: 1205,
      level: 3,
      nextLevelXp: 1500,
      streakDays: 4,
    });
  });

  it("reports level 1 with no XP and no streak without gamification stats", () => {
    const overview: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: FACTS, completions: COMPLETIONS });

    expect(overview.stats).toMatchObject({ xpTotal: 0, level: 1, nextLevelXp: 500, streakDays: 0 });
  });

  it("makes a module available only when the previous module of the same level is completed", () => {
    const withIncompleteFirst: LessonCompletionFact[] = FACTS.map((item: LessonCompletionFact): LessonCompletionFact => (item.lessonId === "L2" ? { ...item, hasCompletionRecord: false } : item));

    const unlocked: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: FACTS, completions: [] });
    const locked: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: withIncompleteFirst, completions: [] });

    expect(unlocked.modules.map((module: ProgressOverview["modules"][number]): [string, boolean, number] => [module.moduleId, module.isAvailable, module.percent])).toEqual([
      ["M1", true, 100],
      ["M2", true, 0],
      ["M3", true, 100],
      ["M4", true, 0],
    ]);
    expect(locked.modules.find((module: ProgressOverview["modules"][number]): boolean => module.moduleId === "M2")?.isAvailable).toBe(false);
  });

  it("derives lesson progress from viewed pages and dates from the lesson record", () => {
    const overview: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: FACTS, completions: COMPLETIONS });

    expect(lesson(overview, "L1")).toEqual({ lessonId: "L1", moduleId: "M1", completed: true, progress: 1, xpEarned: XP_PER_COMPLETED_LESSON, lastVisitedAt: VISITED, updatedAt: UPDATED });
    expect(lesson(overview, "L3")).toMatchObject({ completed: false, progress: 0.5, xpEarned: 0, lastVisitedAt: undefined, updatedAt: undefined });
    expect(lesson(overview, "L5")?.progress).toBe(0);
  });

  it("gives no progress to a lesson without facts", () => {
    const overview: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: [], completions: [] });

    expect(overview.lessons.every((item: OverviewLessonItem): boolean => item.progress === 0 && !item.completed)).toBe(true);
  });

  it("groups modules by level, sorted by level order, and skips modules without level", () => {
    const overview: ProgressOverview = buildProgressOverview({ modules: MODULES, facts: FACTS, completions: [] });

    expect(overview.levels).toEqual([
      {
        levelId: "level-prerequisitos",
        slug: "prerequisitos",
        title: "Prerequisites",
        order: 1,
        moduleIds: ["M3"],
        totalModules: 1,
        completedModules: 1,
        progressPercentage: 100,
        totalLessons: 1,
        completedLessons: 1,
      },
      {
        levelId: "level-beginner",
        slug: "beginner",
        title: "Beginner",
        order: 2,
        moduleIds: ["M1", "M2"],
        totalModules: 2,
        completedModules: 1,
        progressPercentage: 66,
        totalLessons: 3,
        completedLessons: 2,
      },
    ]);
  });

  it("derives the slug of an unmapped level from its id", () => {
    const custom: OverviewModuleSource = { id: "MX", title: "X", order: 1, levelId: "level-expert", level: { id: "level-expert", title: "Expert", order: 9 }, lessonIds: [] };

    const overview: ProgressOverview = buildProgressOverview({ modules: [custom], facts: [], completions: [] });

    expect(overview.levels[0].slug).toBe("expert");
  });
});
