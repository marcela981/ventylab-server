/**
 * PROGRESS QUERY SERVICE (FASE 3 - Migrated)
 * =============================================
 *
 * Uses UserProgress + LessonCompletion (unified system).
 * Legacy: LearningProgress + LessonProgress removed.
 */

import { prisma } from '../../config/prisma';
import { UserProgress, ModuleProgress, LessonProgress, UserStats } from '../../types/progress';
import { computeModuleProgress } from '../../utils/computeModuleProgress';

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) cache.delete(key);
  }
}

async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  cleanExpiredCache();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as T;
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function invalidateUserCache(userId: string) {
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(`user:${userId}`)) keysToDelete.push(key);
  }
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Obtener progreso general del usuario
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    return await getCached(`user:${userId}:progress`, async () => {
      const totalModules = await prisma.module.count({ where: { isActive: true } });

      const allLessons = await prisma.lesson.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      const totalLessons = allLessons.length;
      const lessonIds = allLessons.map(l => l.id);

      // Get completions from unified system
      const completions = await prisma.lessonCompletion.findMany({
        where: { userId, lessonId: { in: lessonIds } },
        select: { lessonId: true, isCompleted: true, updatedAt: true },
      });

      const lessonsWithProgress = completions.map(c => ({
        id: c.lessonId,
        progress: c.isCompleted ? 100 : 0,
      }));
      const { completedLessonsCount } = computeModuleProgress(lessonsWithProgress);

      // Count completed modules
      const modules = await prisma.module.findMany({
        where: { isActive: true },
        select: { id: true, lessons: { where: { isActive: true }, select: { id: true } } },
      });

      const completionMap = new Map(completions.map(c => [c.lessonId, c]));
      let completedModulesCount = 0;
      for (const mod of modules) {
        if (mod.lessons.length === 0) continue;
        const modLessonsWithProgress = mod.lessons.map(l => ({
          id: l.id,
          progress: completionMap.get(l.id)?.isCompleted ? 100 : 0,
        }));
        const { completedLessonsCount: mc, totalLessonsCount: mt } = computeModuleProgress(modLessonsWithProgress);
        if (mt > 0 && mc === mt) completedModulesCount++;
      }

      const overallProgress = totalLessons > 0
        ? Math.floor((completedLessonsCount / totalLessons) * 100)
        : 0;

      // Last activity from LessonCompletion
      const lastCompletion = await prisma.lessonCompletion.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      return {
        userId,
        totalModules,
        completedModules: completedModulesCount,
        totalLessons,
        completedLessons: completedLessonsCount,
        overallProgress,
        lastActivity: lastCompletion?.updatedAt,
      };
    });
  } catch (error) {
    console.error('Error al obtener progreso del usuario:', error);
    throw new Error('Error al consultar progreso del usuario');
  }
}

/**
 * Obtener progreso de un módulo específico
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgress> {
  try {
    return await getCached(`user:${userId}:module:${moduleId}`, async () => {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: {
          id: true,
          title: true,
          lessons: {
            where: { isActive: true },
            select: { id: true, title: true, order: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!module) throw new Error('Módulo no encontrado');

      const lessonIds = module.lessons.map(l => l.id);
      const completions = await prisma.lessonCompletion.findMany({
        where: { userId, lessonId: { in: lessonIds } },
      });
      const completionMap = new Map(completions.map(c => [c.lessonId, c]));

      const lessonsWithProgress = module.lessons.map(lesson => ({
        id: lesson.id,
        progress: completionMap.get(lesson.id)?.isCompleted ? 100 : 0,
      }));

      const { completedLessonsCount, totalLessonsCount, progressPercentage } =
        computeModuleProgress(lessonsWithProgress);

      const lessons: LessonProgress[] = module.lessons.map(lesson => {
        const c = completionMap.get(lesson.id);
        const isCompleted = c?.isCompleted ?? false;
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completed: isCompleted,
          progress: isCompleted ? 100 : 0,
          lastAccessed: c?.lastAccessed ?? c?.updatedAt,
          completedAt: isCompleted ? (c?.completedAt ?? c?.updatedAt ?? undefined) : undefined,
        };
      });

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount,
        progress: progressPercentage,
        lessons,
      };
    });
  } catch (error) {
    console.error('Error al obtener progreso del módulo:', error);
    throw error;
  }
}

/**
 * Obtener progreso de una lección específica
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true, moduleId: true },
    });

    if (!lesson) return null;

    const completion = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!completion) {
      return { lessonId: lesson.id, lessonTitle: lesson.title, completed: false, progress: 0 };
    }

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      completed: completion.isCompleted,
      progress: completion.isCompleted ? 100 : 0,
      lastAccessed: completion.lastAccessed ?? completion.updatedAt,
      completedAt: completion.isCompleted ? (completion.completedAt ?? completion.updatedAt ?? undefined) : undefined,
    };
  } catch (error) {
    console.error('Error al obtener progreso de la lección:', error);
    throw error;
  }
}

/**
 * Calcular estadísticas del usuario
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    return await getCached(`user:${userId}:stats`, async () => {
      // Get all lesson completions for this user
      const allCompletions = await prisma.lessonCompletion.findMany({
        where: { userId },
        orderBy: { updatedAt: 'asc' },
        select: { updatedAt: true, createdAt: true },
      });

      // Estimated study time
      const estimatedMinutesPerSession = 30;
      const totalStudyTime = allCompletions.length * estimatedMinutesPerSession;

      const currentStreak = calculateCurrentStreak(allCompletions);
      const longestStreak = calculateLongestStreak(allCompletions);
      const totalXP = await calculateTotalXP(userId);

      const { calculateLevel } = await import('./levelCalculation.service');
      const levelInfo = await calculateLevel(totalXP);

      const lastActivity = allCompletions.length > 0
        ? allCompletions[allCompletions.length - 1].updatedAt
        : undefined;

      return {
        totalStudyTime,
        currentStreak,
        longestStreak,
        totalXP,
        level: levelInfo.level,
        xpToNextLevel: levelInfo.xpToNext,
        lastActivityDate: lastActivity,
      };
    });
  } catch (error) {
    console.error('Error al calcular estadísticas del usuario:', error);
    throw error;
  }
}

// ============================================
// HELPERS
// ============================================

function calculateCurrentStreak(progress: Array<{ updatedAt: Date }>): number {
  if (progress.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = new Set(
    progress.map(p => {
      const d = new Date(p.updatedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const sortedDates = Array.from(dates).sort((a, b) => b - a);

  let streak = 0;
  let currentDate = new Date(today);

  if (sortedDates[0] === today.getTime()) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (sortedDates[0] === yesterday.getTime()) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 2);
    } else {
      return 0;
    }
  }

  while (sortedDates.includes(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

function calculateLongestStreak(progress: Array<{ updatedAt: Date }>): number {
  if (progress.length === 0) return 0;

  const dates = new Set(
    progress.map(p => {
      const d = new Date(p.updatedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const sortedDates = Array.from(dates).sort((a, b) => a - b);
  if (sortedDates.length <= 1) return sortedDates.length;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

async function calculateTotalXP(userId: string): Promise<number> {
  const xpPerLesson = 50;
  const xpPerModule = 200;
  const xpPerQuiz = 100;

  const completions = await prisma.lessonCompletion.findMany({
    where: { userId },
    select: { lessonId: true, isCompleted: true, lesson: { select: { moduleId: true } } },
  });

  const completedLessons = completions.filter(c => c.isCompleted).length;

  // Count completed modules via UserProgress
  const completedModules = await prisma.userProgress.count({
    where: { userId, isModuleCompleted: true },
  });

  const passedQuizzes = await prisma.quizAttempt.count({
    where: { userId, passed: true },
  });

  const { getAchievementXP } = await import('./achievements.service');
  const achievementXP = await getAchievementXP(userId);

  return (
    completedLessons * xpPerLesson +
    completedModules * xpPerModule +
    passedQuizzes * xpPerQuiz +
    achievementXP
  );
}

export default {
  getUserProgress,
  getModuleProgress,
  getLessonProgress,
  getUserStats,
  invalidateUserCache,
};
