/**
 * LEARNING PROGRESS SERVICE (FASE 3 - Migrated)
 * ===============================================
 *
 * Provides module/lesson progress queries using the unified system:
 * UserProgress (module-level) + LessonCompletion (lesson+step level).
 *
 * These functions are called by progress.controller.ts for the existing
 * REST endpoints. The API surface is UNCHANGED.
 */

import { prisma } from '../../shared/infrastructure/database';
import { ProgressStatus } from '@prisma/client';

interface LessonProgressResponse {
  lessonId: string;
  completed: boolean;
  timeSpent: number;
  lastAccessed: Date | null;
  completionPercentage: number;
  currentStep: number;  // 1-based
  totalSteps: number;
}

interface ModuleProgressResponse {
  moduleId: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  isModuleCompleted: boolean;
  timeSpent: number;
  score: number | null;
  lessons: LessonProgressResponse[];
  completedAt: Date | null;
}

// ============================================
// PUBLIC API (same signatures as before)
// ============================================

/**
 * Update or create progress for a specific lesson.
 * NEVER downgrades isCompleted from true to false.
 */
export async function updateLessonProgress(input: {
  userId: string;
  moduleId: string;
  lessonId: string;
  completed?: boolean;
  timeSpent?: number;
}): Promise<LessonProgressResponse> {
  const { userId, moduleId, lessonId, completed = false, timeSpent = 0 } = input;

  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { isCompleted: true },
  });

  const finalCompleted = existing?.isCompleted === true ? true : completed;

  const completion = await prisma.lessonCompletion.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      isCompleted: finalCompleted,
      timeSpent: { increment: timeSpent },
      lastAccessed: new Date(),
      completedAt: finalCompleted ? new Date() : undefined,
    },
    create: {
      userId,
      lessonId,
      isCompleted: finalCompleted,
      timeSpent,
      lastAccessed: new Date(),
      completedAt: finalCompleted ? new Date() : null,
    },
  });

  // Update UserProgress time
  await prisma.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {
      timeSpent: { increment: timeSpent },
      lastAccessedLessonId: lessonId,
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      moduleId,
      status: ProgressStatus.IN_PROGRESS,
      timeSpent,
      lastAccessedLessonId: lessonId,
      lastAccessedAt: new Date(),
    },
  });

  // Recalculate and persist UserProgress with accurate counts after every completion
  if (finalCompleted) {
    try {
      await recalculateAndSaveUserProgress(userId, moduleId);
    } catch (e: any) {
      console.warn('[updateLessonProgress] recalculate failed (non-fatal):', e?.message);
    }
  }

  const completionPct = completion.isCompleted
    ? 100
    : completion.totalSteps > 0
      ? Math.floor(((completion.currentStepIndex + 1) / completion.totalSteps) * 100)
      : 0;

  return {
    lessonId: completion.lessonId,
    completed: completion.isCompleted,
    timeSpent: completion.timeSpent,
    lastAccessed: completion.lastAccessed,
    completionPercentage: completionPct,
    currentStep: completion.currentStepIndex + 1,
    totalSteps: completion.totalSteps,
  };
}

/**
 * Mark a lesson as completed.
 */
export async function markLessonComplete(
  userId: string,
  moduleId: string,
  lessonId: string,
  timeSpent: number = 0
): Promise<LessonProgressResponse> {
  return updateLessonProgress({ userId, moduleId, lessonId, completed: true, timeSpent });
}

/**
 * Get progress for a specific lesson.
 */
export async function getLessonProgress(
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonProgressResponse | null> {
  // Ensure UserProgress exists
  await prisma.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {},
    create: { userId, moduleId, status: ProgressStatus.NOT_STARTED },
  });

  const completion = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (!completion) {
    return { lessonId, completed: false, timeSpent: 0, lastAccessed: null, completionPercentage: 0, currentStep: 0, totalSteps: 0 };
  }

  const completionPct = completion.isCompleted
    ? 100
    : completion.totalSteps > 0
      ? Math.floor(((completion.currentStepIndex + 1) / completion.totalSteps) * 100)
      : 0;

  return {
    lessonId: completion.lessonId,
    completed: completion.isCompleted,
    timeSpent: completion.timeSpent,
    lastAccessed: completion.lastAccessed,
    completionPercentage: completionPct,
    currentStep: completion.currentStepIndex + 1,  // 1-based for frontend
    totalSteps: completion.totalSteps,
  };
}

/**
 * Get complete module progress with all lessons.
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResponse> {
  // Ensure UserProgress exists
  const userProgress = await prisma.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {},
    create: { userId, moduleId, status: ProgressStatus.NOT_STARTED },
  });

  // Get all active lessons
  const allModuleLessons = await prisma.lesson.findMany({
    where: { moduleId, isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  // Get all lesson completions
  const lessonIds = allModuleLessons.map(l => l.id);
  const completions = await prisma.lessonCompletion.findMany({
    where: { userId, lessonId: { in: lessonIds } },
  });
  const completionMap = new Map(completions.map(c => [c.lessonId, c]));

  const lessons: LessonProgressResponse[] = allModuleLessons.map(lesson => {
    const c = completionMap.get(lesson.id);
    const pct = c?.isCompleted
      ? 100
      : (c && c.totalSteps > 0 ? Math.floor(((c.currentStepIndex + 1) / c.totalSteps) * 100) : 0);
    return {
      lessonId: lesson.id,
      completed: c?.isCompleted ?? false,
      timeSpent: c?.timeSpent ?? 0,
      lastAccessed: c?.lastAccessed ?? null,
      completionPercentage: pct,
      currentStep: c ? c.currentStepIndex + 1 : 0,
      totalSteps: c?.totalSteps ?? 0,
    };
  });

  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const completionPercentage = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  const isModuleCompleted = completionPercentage >= 100;

  return {
    moduleId,
    totalLessons,
    completedLessons,
    completionPercentage,
    isModuleCompleted,
    timeSpent: userProgress.timeSpent,
    score: null,  // Not tracked in UserProgress (evaluation system handles scores)
    lessons,
    completedAt: userProgress.completedAt,
  };
}

/**
 * Get overview of all modules for a user.
 * Returns { overview, modules, lessons } for the frontend ProgressSource.
 */
export async function getUserProgressOverview(userId: string) {
  // 1. Fetch all UserProgress with module metadata
  const allProgress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      module: { select: { id: true, title: true, order: true } },
    },
    orderBy: { module: { order: 'asc' } },
  });

  // 2. Count active Pages per module for accurate totalLessons
  const pageCounts = await prisma.page.groupBy({
    by: ['moduleId'],
    where: { isActive: true },
    _count: { id: true },
  });
  const pageCountMap = new Map(pageCounts.map(p => [p.moduleId, p._count.id]));

  // 3. Build DB lessonId → frontend legacyJsonId mapping
  const pages = await prisma.page.findMany({
    where: { isActive: true, legacyLessonId: { not: null } },
    select: { legacyLessonId: true, legacyJsonId: true },
  });
  const lessonIdToFrontendId = new Map<string, string>();
  for (const page of pages) {
    if (page.legacyLessonId && page.legacyJsonId) {
      lessonIdToFrontendId.set(page.legacyLessonId, page.legacyJsonId);
    }
  }

  // 4. Fetch all LessonCompletions for this user (across all modules)
  const allCompletions = await prisma.lessonCompletion.findMany({
    where: { userId },
    select: {
      lessonId: true,
      isCompleted: true,
      currentStepIndex: true,
      totalSteps: true,
      lastAccessed: true,
      updatedAt: true,
      lesson: { select: { moduleId: true } },
    },
  });

  // Group completions by moduleId
  const completionsByModule = new Map<string, typeof allCompletions>();
  for (const c of allCompletions) {
    const mid = c.lesson.moduleId;
    if (!completionsByModule.has(mid)) completionsByModule.set(mid, []);
    completionsByModule.get(mid)!.push(c);
  }

  // 5. Build per-module summaries
  const modules = allProgress.map(progress => {
    const moduleCompletions = completionsByModule.get(progress.moduleId) ?? [];
    const totalFromPages = pageCountMap.get(progress.moduleId) ?? 0;
    const totalLessons = totalFromPages > 0 ? totalFromPages : progress.totalLessons;
    const completedCount = moduleCompletions.filter(c => c.isCompleted).length;

    const lastAccessed = moduleCompletions.reduce((latest, c) => {
      if (!c.lastAccessed) return latest;
      if (!latest || c.lastAccessed > latest) return c.lastAccessed;
      return latest;
    }, null as Date | null);

    return {
      moduleId: progress.moduleId,
      moduleTitle: progress.module.title,
      completedLessons: completedCount,
      totalLessons,
      timeSpent: progress.timeSpent,
      completedAt: progress.completedAt,
      lastAccessed,
    };
  });

  // 6. Build lesson-level array with frontend-compatible IDs
  const lessons: Array<{ lessonId: string; progress: number; updatedAt: string }> = [];
  for (const c of allCompletions) {
    const frontendId = lessonIdToFrontendId.get(c.lessonId) || c.lessonId;
    const progressValue = c.isCompleted
      ? 1
      : (c.totalSteps > 0 ? (c.currentStepIndex + 1) / c.totalSteps : 0);
    lessons.push({
      lessonId: frontendId,
      progress: Math.min(1, progressValue),
      updatedAt: (c.updatedAt ?? c.lastAccessed ?? new Date()).toISOString(),
    });
  }

  // 7. Aggregate overview stats
  const totalCompletedLessons = modules.reduce((s, m) => s + m.completedLessons, 0);
  const totalLessonsAll = modules.reduce((s, m) => s + m.totalLessons, 0);
  const modulesCompleted = modules.filter(
    m => m.totalLessons > 0 && m.completedLessons >= m.totalLessons
  ).length;

  return {
    overview: {
      completedLessons: totalCompletedLessons,
      totalLessons: totalLessonsAll,
      modulesCompleted,
      totalModules: modules.length,
      xpTotal: totalCompletedLessons * 100,
      level: Math.floor(totalCompletedLessons / 5) + 1,
      nextLevelXp: (Math.floor(totalCompletedLessons / 5) + 1) * 500,
      streakDays: 0,
      calendar: [],
    },
    modules,
    lessons,
  };
}

/**
 * Get next lesson in sequence within a module.
 */
export async function getNextLesson(
  _userId: string,
  moduleId: string,
  currentLessonId: string
): Promise<string | null> {
  const allLessons = await prisma.lesson.findMany({
    where: { moduleId, isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
  return allLessons[currentIndex + 1].id;
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Recalculate module progress from LessonCompletion and persist to UserProgress.
 * Called after every lesson completion (partial or full).
 * Non-fatal: errors are logged and swallowed so they don't break the main flow.
 */
async function recalculateAndSaveUserProgress(
  userId: string,
  moduleId: string,
): Promise<void> {
  const totalLessons = await prisma.lesson.count({
    where: { moduleId, isActive: true },
  });

  if (totalLessons === 0) return;

  const completedLessonsCount = await prisma.lessonCompletion.count({
    where: {
      userId,
      isCompleted: true,
      lesson: { moduleId },
    },
  });

  const progressPercentage = Math.round((completedLessonsCount / totalLessons) * 100);
  const isCompleted = completedLessonsCount >= totalLessons;
  const status = isCompleted
    ? ProgressStatus.COMPLETED
    : completedLessonsCount > 0
      ? ProgressStatus.IN_PROGRESS
      : ProgressStatus.NOT_STARTED;

  await prisma.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      status,
      isModuleCompleted: isCompleted,
      completedAt: isCompleted ? new Date() : null,
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      moduleId,
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      status,
      isModuleCompleted: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  console.log(
    `[recalculateAndSaveUserProgress] userId=${userId} moduleId=${moduleId} ` +
    `completed=${completedLessonsCount}/${totalLessons} (${progressPercentage}%)`
  );
}

async function checkAndUpdateModuleCompletion(
  userId: string,
  moduleId: string
): Promise<void> {
  const activeLessons = await prisma.lesson.findMany({
    where: { moduleId, isActive: true },
    select: { id: true },
  });

  if (activeLessons.length === 0) return;

  const lessonIds = activeLessons.map(l => l.id);
  const completedCount = await prisma.lessonCompletion.count({
    where: { userId, lessonId: { in: lessonIds }, isCompleted: true },
  });

  if (completedCount !== lessonIds.length) return;

  await prisma.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {
      status: ProgressStatus.COMPLETED,
      isModuleCompleted: true,
      completedLessonsCount: completedCount,
      totalLessons: lessonIds.length,
      progressPercentage: 100,
      completedAt: new Date(),
    },
    create: {
      userId,
      moduleId,
      status: ProgressStatus.COMPLETED,
      isModuleCompleted: true,
      completedLessonsCount: completedCount,
      totalLessons: lessonIds.length,
      progressPercentage: 100,
      completedAt: new Date(),
    },
  });
}
