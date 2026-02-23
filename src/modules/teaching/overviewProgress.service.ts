/**
 * Overview Progress Service
 *
 * Builds the GET /api/progress/overview response from the definitive
 * data model: Level → Module → Page → PageProgress.
 *
 * Key design decisions:
 * - Starts from CONTENT (modules + pages), not from progress records.
 *   This ensures modules and pages always appear even for new users.
 * - Uses PageProgress (not LessonProgress) as the progress source.
 * - No dependency on JSON curriculum, Lesson model, or legacy IDs.
 * - Two queries total (no N+1): modules+pages, then pageProgress.
 * - Module availability: first module per level = always available,
 *   subsequent modules require the previous module to be fully completed.
 */

import { prisma } from '../../shared/infrastructure/database';

// ── Response types ──────────────────────────────────────────────────

interface OverviewStats {
  completedLessons: number;
  totalLessons: number;
  modulesCompleted: number;
  totalModules: number;
  xpTotal: number;
  level: number;
  nextLevelXp: number;
  streakDays: number;
  calendar: string[];
}

interface ModuleSummary {
  moduleId: string;
  title: string;
  levelId: string | null;
  description: string | null;
  difficulty: string | null;
  estimatedTime: number | null;
  order: number;
  totalPages: number;
  completedPages: number;
  isAvailable: boolean;
  percentComplete: number;
}

interface PageSummary {
  pageId: string;
  moduleId: string;
  completed: boolean;
  xpEarned: number;
  lastVisitedAt: string | null;
}

export interface ProgressOverviewResponse {
  overview: OverviewStats;
  modules: ModuleSummary[];
  lessons: PageSummary[];
}

// ── Constants ───────────────────────────────────────────────────────

const XP_PER_LEVEL = 500;

// ── Main function ───────────────────────────────────────────────────

export async function getProgressOverview(
  userId: string
): Promise<ProgressOverviewResponse> {
  // ── Query 1: All active modules with their active pages ──────────
  // Ordered by level.order, then module.order so that the sequential
  // availability logic works correctly within each level.
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, moduleId: true },
      },
      level: {
        select: { id: true, title: true, order: true },
      },
    },
    orderBy: [
      { level: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  // ── Query 2: All lesson progress for this user (single query) ──────
  const allCompletions = await prisma.lessonCompletion.findMany({
    where: { userId },
  });
  const progressMap = new Map(allCompletions.map(c => [c.lessonId, c]));

  // ── Defensive log (temporary) ────────────────────────────────────
  const totalLessonsInLevel = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  console.log('[overview] Data snapshot:', {
    userId,
    modulesFound: modules.length,
    totalLessonsInLevel,
    lessonsFound: allCompletions.length,
  });

  // ── Build per-module summaries ───────────────────────────────────
  // Track the previous module's completion state per level so that
  // sequential availability works within each level independently.
  const prevCompleteByLevel = new Map<string, boolean>();

  const modulesSummary: ModuleSummary[] = modules.map((mod) => {
    const levelKey = mod.levelId ?? '__no_level__';
    const totalLessons = mod.lessons.length;
    let completedLessons = 0;

    // Calculate completed lessons considering step tracking
    mod.lessons.forEach(l => {
      const prog = progressMap.get(l.id);
      if (prog?.isCompleted) {
        completedLessons++;
      } else if (prog && prog.totalSteps > 0 && prog.currentStepIndex >= prog.totalSteps - 1) {
        completedLessons++; // Nearly complete based on steps
      }
    });

    const percentComplete = totalLessons > 0
      ? Math.floor((completedLessons / totalLessons) * 100)
      : 0;
    const isModuleComplete = totalLessons > 0 && completedLessons === totalLessons;

    // First module in this level = always available
    const isFirstInLevel = !prevCompleteByLevel.has(levelKey);
    const prevComplete = prevCompleteByLevel.get(levelKey) ?? true;
    const isAvailable = isFirstInLevel || prevComplete;

    // Update tracker for next module in this level
    prevCompleteByLevel.set(levelKey, isModuleComplete);

    return {
      moduleId: mod.id,
      id: mod.id,               // alias for frontend compatibility
      title: mod.title,
      levelId: mod.levelId,
      description: mod.description,
      difficulty: mod.difficulty,
      estimatedTime: mod.estimatedTime,
      order: mod.order,
      totalPages: totalLessons, // alias
      completedPages: completedLessons, // alias
      totalLessons,   // alias for frontend compatibility
      completedLessons, // alias for frontend compatibility
      isAvailable,
      percentComplete,
      progress: percentComplete,  // alias for frontend compatibility
      completed: isModuleComplete,
    };
  });

  // ── Build lessons array ──────────────────────────────────
  const lessons: PageSummary[] = modules.flatMap(mod =>
    mod.lessons.map(lesson => {
      const prog = progressMap.get(lesson.id);

      // Calculate continuous progress 0-1 based on step tracking
      let numericProgress = 0;
      let isCompleted = false;

      if (prog?.isCompleted) {
        numericProgress = 1;
        isCompleted = true;
      } else if (prog && prog.totalSteps > 0) {
        numericProgress = (prog.currentStepIndex + 1) / prog.totalSteps;
        // Cap at 0.99 if not explicitly completed
        numericProgress = Math.min(0.99, numericProgress);
        if (numericProgress >= 0.99) isCompleted = true;
      }

      return {
        pageId: lesson.id,         // alias
        lessonId: lesson.id,         // required by frontend
        moduleId: mod.id,
        completed: isCompleted,
        progress: numericProgress,  // numeric progress for frontend
        xpEarned: isCompleted ? 100 : 0, // mock xp since LessonCompletion doesn't store it
        lastVisitedAt: prog?.lastAccessed?.toISOString() ?? null,
        updatedAt: prog?.updatedAt?.toISOString() ?? prog?.lastAccessed?.toISOString() ?? null, // alias
      };
    })
  );

  // ── Aggregate overview stats ─────────────────────────────────────
  const totalLessons = totalLessonsInLevel;
  const completedLessonsAll = allCompletions.filter(c => c.isCompleted).length;
  const modulesCompleted = modulesSummary.filter(
    m => m.totalLessons > 0 && m.completedLessons === m.totalLessons
  ).length;
  const xpTotal = completedLessonsAll * 100;
  const level = Math.floor(xpTotal / XP_PER_LEVEL) + 1;

  return {
    overview: {
      completedLessons: completedLessonsAll,
      totalLessons,
      modulesCompleted,
      totalModules: modules.length,
      xpTotal,
      level,
      nextLevelXp: level * XP_PER_LEVEL,
      streakDays: 0,   // TODO: implement streak calculation
      calendar: [],     // TODO: implement activity calendar
    },
    modules: modulesSummary,
    lessons,
  };
}
