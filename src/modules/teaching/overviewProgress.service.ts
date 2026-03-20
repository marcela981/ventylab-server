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
  totalLessons: number;
  completedLessons: number;
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

// Maps DB level IDs → frontend-compatible slugs (matches curriculumData.levels[].id).
const LEVEL_SLUG_MAP: Record<string, string> = {
  'level-prerequisitos': 'prerequisitos',
  'level-beginner':      'beginner',
  'level-intermedio':    'intermediate',
  'level-avanzado':      'advanced',
};

interface LevelSummary {
  levelId: string;   // DB Level.id (e.g., 'level-beginner')
  slug: string;      // frontend-compatible key (e.g., 'beginner') — matches curriculumData.levels[].id
  title: string;
  order: number;
  modules: string[];          // moduleId[]
  totalModules: number;       // count of modules (cards) in this level
  completedModules: number;   // count of fully completed modules
  progressPercentage: number; // average of UserProgress.progressPercentage for all modules
  totalLessons: number;       // sum of all lessons across all modules in this level
  completedLessons: number;   // sum of completed lessons across all modules
}

export interface ProgressOverviewResponse {
  overview: OverviewStats;
  modules: ModuleSummary[];
  lessons: PageSummary[];
  levels: LevelSummary[];
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

  // ── Query 2: All lesson completions for this user (single query) ───
  const allCompletions = await prisma.lessonCompletion.findMany({
    where: { userId },
  });
  const progressMap = new Map(allCompletions.map(c => [c.lessonId, c]));

  // ── Query 3: UserProgress records — authoritative module percentages ─
  // calculateAndSaveModuleProgress writes progressPercentage here after
  // every LessonCompletion write (Fix Común 3). We read it back so the
  // overview is always consistent with the stored module state.
  const userProgressRecords = await prisma.userProgress.findMany({
    where: { userId },
    select: { moduleId: true, progressPercentage: true, status: true },
  });
  const userProgressMap = new Map(userProgressRecords.map(p => [p.moduleId, p]));

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

    // Count only lessons with isCompleted=true — consistent with calculateAndSaveModuleProgress.
    const completedLessons = mod.lessons.filter(l => progressMap.get(l.id)?.isCompleted === true).length;

    // Use stored UserProgress.progressPercentage as the authoritative value.
    // Falls back to a direct count only for brand-new users (no UserProgress row yet).
    const storedProgress = userProgressMap.get(mod.id);
    const percentComplete = storedProgress
      ? storedProgress.progressPercentage
      : totalLessons > 0
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
  // NOTE: lessonId is set to lesson.moduleId (the DB Module.id) because in the
  // current content structure every module has exactly one lesson, and the frontend
  // curriculum uses the Module.id as the lesson identifier (e.g. "module-01-inversion-fisiologica").
  // This ensures LearningProgressContext can match the key when building its lessonProgressMap.
  const lessons: PageSummary[] = modules.flatMap(mod =>
    mod.lessons.map(lesson => {
      const prog = progressMap.get(lesson.id); // internal lookup still uses DB lesson ID

      // Calculate continuous progress 0-1 based on step tracking
      let numericProgress = 0;
      let isCompleted = false;

      if (prog?.isCompleted) {
        numericProgress = 1;
        isCompleted = true;
      } else if (prog && prog.totalSteps > 0) {
        numericProgress = (prog.currentStepIndex + 1) / prog.totalSteps;
        numericProgress = Math.min(0.99, numericProgress);
      }

      return {
        pageId: lesson.id,           // canonical DB lesson ID (for internal reference)
        lessonId: lesson.moduleId,   // frontend-compatible ID (Module.id = curriculum lessonId)
        dbLessonId: lesson.id,       // explicit DB ID alias
        moduleId: mod.id,
        completed: isCompleted,
        progress: numericProgress,
        xpEarned: isCompleted ? 100 : 0,
        lastVisitedAt: prog?.lastAccessed?.toISOString() ?? null,
        updatedAt: prog?.updatedAt?.toISOString() ?? prog?.lastAccessed?.toISOString() ?? null,
      };
    })
  );

  // ── Build hierarchical level progress ────────────────────────────
  // Group modules by levelId:
  //   progressPercentage = average of UserProgress.progressPercentage across all modules
  //   totalLessons / completedLessons = sums across all modules
  const levelMap = new Map<string, {
    title: string;
    order: number;
    moduleIds: string[];
    totalPct: number;
    completedModules: number;
    totalLessons: number;
    completedLessons: number;
  }>();

  for (const mod of modules) {
    if (!mod.levelId || !mod.level) continue;
    const existing = levelMap.get(mod.levelId);
    // Use persisted UserProgress.progressPercentage (0 if module never accessed).
    const modProgress = userProgressMap.get(mod.id);
    const pct = modProgress?.progressPercentage ?? 0;
    const isModCompleted = modProgress?.status === 'COMPLETED';
    // Count lessons from LessonCompletion.isCompleted (consistent with updateModuleProgress).
    const modCompletedLessons = mod.lessons.filter(l => progressMap.get(l.id)?.isCompleted === true).length;
    const modTotalLessons = mod.lessons.length;

    if (existing) {
      existing.moduleIds.push(mod.id);
      existing.totalPct += pct;
      if (isModCompleted) existing.completedModules += 1;
      existing.totalLessons += modTotalLessons;
      existing.completedLessons += modCompletedLessons;
    } else {
      levelMap.set(mod.levelId, {
        title: mod.level.title,
        order: mod.level.order,
        moduleIds: [mod.id],
        totalPct: pct,
        completedModules: isModCompleted ? 1 : 0,
        totalLessons: modTotalLessons,
        completedLessons: modCompletedLessons,
      });
    }
  }

  const levels: LevelSummary[] = Array.from(levelMap.entries())
    .map(([levelId, data]) => ({
      levelId,
      slug: LEVEL_SLUG_MAP[levelId] ?? levelId.replace(/^level-/, ''),
      title: data.title,
      order: data.order,
      modules: data.moduleIds,
      totalModules: data.moduleIds.length,
      completedModules: data.completedModules,
      // Strict average: sum of all module progressPercentage / total module count.
      // Example: 4 modules, only 1st at 100% → (100+0+0+0)/4 = 25%
      progressPercentage: data.moduleIds.length > 0
        ? Math.round(data.totalPct / data.moduleIds.length)
        : 0,
      totalLessons: data.totalLessons,
      completedLessons: data.completedLessons,
    }))
    .sort((a, b) => a.order - b.order);

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
    levels,
  };
}
