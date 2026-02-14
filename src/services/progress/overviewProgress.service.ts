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

import { prisma } from '../../config/prisma';

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
      pages: {
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

  // ── Query 2: All page progress for this user (single query) ──────
  const allPageProgress = await prisma.pageProgress.findMany({
    where: { userId },
  });
  const progressMap = new Map(allPageProgress.map(p => [p.pageId, p]));

  // ── Defensive log (temporary) ────────────────────────────────────
  const totalPagesInLevel = modules.reduce((sum, m) => sum + m.pages.length, 0);
  console.log('[overview] Data snapshot:', {
    userId,
    modulesFound: modules.length,
    totalPagesInLevel,
    pagesFound: allPageProgress.length,
  });

  // ── Build per-module summaries ───────────────────────────────────
  // Track the previous module's completion state per level so that
  // sequential availability works within each level independently.
  const prevCompleteByLevel = new Map<string, boolean>();

  const modulesSummary: ModuleSummary[] = modules.map((mod) => {
    const levelKey = mod.levelId ?? '__no_level__';
    const totalPages = mod.pages.length;
    const completedPages = mod.pages.filter(
      p => progressMap.get(p.id)?.completed === true
    ).length;
    const percentComplete = totalPages > 0
      ? Math.floor((completedPages / totalPages) * 100)
      : 0;
    const isModuleComplete = totalPages > 0 && completedPages === totalPages;

    // First module in this level = always available
    const isFirstInLevel = !prevCompleteByLevel.has(levelKey);
    const prevComplete = prevCompleteByLevel.get(levelKey) ?? true;
    const isAvailable = isFirstInLevel || prevComplete;

    // Update tracker for next module in this level
    prevCompleteByLevel.set(levelKey, isModuleComplete);

    return {
      moduleId: mod.id,
      title: mod.title,
      levelId: mod.levelId,
      description: mod.description,
      difficulty: mod.difficulty,
      estimatedTime: mod.estimatedTime,
      order: mod.order,
      totalPages,
      completedPages,
      isAvailable,
      percentComplete,
    };
  });

  // ── Build lessons (pages) array ──────────────────────────────────
  const lessons: PageSummary[] = modules.flatMap(mod =>
    mod.pages.map(page => {
      const prog = progressMap.get(page.id);
      return {
        pageId: page.id,
        moduleId: mod.id,
        completed: prog?.completed ?? false,
        xpEarned: prog?.xpEarned ?? 0,
        lastVisitedAt: prog?.lastVisitedAt?.toISOString() ?? null,
      };
    })
  );

  // ── Aggregate overview stats ─────────────────────────────────────
  const totalLessons = totalPagesInLevel;
  const completedLessons = allPageProgress.filter(p => p.completed).length;
  const modulesCompleted = modulesSummary.filter(
    m => m.totalPages > 0 && m.completedPages === m.totalPages
  ).length;
  const xpTotal = allPageProgress.reduce((sum, p) => sum + p.xpEarned, 0);
  const level = Math.floor(xpTotal / XP_PER_LEVEL) + 1;

  return {
    overview: {
      completedLessons,
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
