import { prisma } from '../../config/prisma';
import { UserProgress, ModuleProgress, LessonProgress, UserStats } from '../../types/progress';
import { computeModuleProgress } from '../../utils/computeModuleProgress';

// Caché en memoria para datos que no cambian frecuentemente
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpiar caché expirado
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Obtener datos del caché o ejecutar función
 */
async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  cleanExpiredCache();
  
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Invalidar caché para un usuario
 */
export function invalidateUserCache(userId: string) {
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(`user:${userId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Obtener progreso general del usuario
 * Incluye porcentaje completado y módulos terminados
 *
 * Uses computeModuleProgress logic: lesson completed when progress === 100
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    return await getCached(`user:${userId}:progress`, async () => {
      // Obtener todos los módulos activos
      const totalModules = await prisma.module.count({
        where: { isActive: true },
      });

      // Obtener todas las lecciones activas
      const allLessons = await prisma.lesson.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      const totalLessons = allLessons.length;
      const lessonIds = allLessons.map(l => l.id);

      // Obtener progreso de todas las lecciones del usuario
      const allLessonProgress = lessonIds.length > 0
        ? await prisma.progress.findMany({
            where: {
              userId,
              lessonId: { in: lessonIds },
            },
            select: {
              lessonId: true,
              progress: true,
              completionPercentage: true,
            },
          })
        : [];

      // Count lessons where progress === 100 (using computeModuleProgress logic)
      const lessonsWithProgress = allLessonProgress.map(p => ({
        id: p.lessonId,
        progress: p.completionPercentage ?? p.progress ?? 0,
      }));
      const { completedLessonsCount } = computeModuleProgress(lessonsWithProgress);

      // Count completed modules (where all lessons have progress === 100)
      const modules = await prisma.module.findMany({
        where: { isActive: true },
        select: {
          id: true,
          lessons: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      let completedModulesCount = 0;
      for (const mod of modules) {
        if (mod.lessons.length === 0) continue;

        const modLessonProgress = allLessonProgress.filter(p =>
          mod.lessons.some(l => l.id === p.lessonId)
        );

        const modLessonsWithProgress = mod.lessons.map(l => {
          const record = modLessonProgress.find(p => p.lessonId === l.id);
          return {
            id: l.id,
            progress: record?.completionPercentage ?? record?.progress ?? 0,
          };
        });

        const { completedLessonsCount: modCompleted, totalLessonsCount } =
          computeModuleProgress(modLessonsWithProgress);

        if (totalLessonsCount > 0 && modCompleted === totalLessonsCount) {
          completedModulesCount++;
        }
      }

      // Calcular progreso general usando floor
      const overallProgress = totalLessons > 0
        ? Math.floor((completedLessonsCount / totalLessons) * 100)
        : 0;

      // Obtener última actividad
      const lastActivity = await prisma.progress.findFirst({
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
        lastActivity: lastActivity?.updatedAt,
      };
    });
  } catch (error) {
    console.error('Error al obtener progreso del usuario:', error);
    throw new Error('Error al consultar progreso del usuario');
  }
}

/**
 * Obtener progreso de un módulo específico
 *
 * Uses computeModuleProgress: lesson completed when progress === 100
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgress> {
  try {
    return await getCached(`user:${userId}:module:${moduleId}`, async () => {
      // Obtener información del módulo
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: {
          id: true,
          title: true,
          lessons: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              order: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!module) {
        throw new Error('Módulo no encontrado');
      }

      // Obtener progreso de cada lección
      const progressRecords = await prisma.progress.findMany({
        where: {
          userId,
          moduleId,
          lessonId: { not: null },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Crear mapa de progreso por lección
      const progressMap = new Map(
        progressRecords.map(p => [p.lessonId!, p])
      );

      // Build lessons with progress for computeModuleProgress
      const lessonsWithProgress = module.lessons.map(lesson => {
        const record = progressMap.get(lesson.id);
        // Use completionPercentage (0-100), fall back to progress field
        const progressValue = record?.completionPercentage ?? record?.progress ?? 0;
        return {
          id: lesson.id,
          progress: progressValue,
        };
      });

      // Use computeModuleProgress as single source of truth
      const { completedLessonsCount, totalLessonsCount, progressPercentage } =
        computeModuleProgress(lessonsWithProgress);

      // Construir array de progreso de lecciones for response
      const lessons: LessonProgress[] = module.lessons.map(lesson => {
        const progressRecord = progressMap.get(lesson.id);
        const progressValue = progressRecord?.completionPercentage ?? progressRecord?.progress ?? 0;
        // A lesson is completed when progress === 100
        const isCompleted = progressValue === 100;
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completed: isCompleted,
          progress: progressValue,
          lastAccessed: progressRecord?.updatedAt,
          completedAt: isCompleted ? progressRecord?.updatedAt : undefined,
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
    // Use unique constraint to ensure we get the correct record (only one per user+lesson)
    // No usar caché para progreso de lección individual (cambia frecuentemente)
    const progressRecord = await prisma.progress.findUnique({
      where: {
        progress_user_lesson_unique: {
          userId,
          lessonId
        }
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!progressRecord) {
      // Verificar que la lección existe
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, title: true },
      });

      if (!lesson) {
        return null;
      }

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        completed: false,
        progress: 0,
      };
    }

    // Use completionPercentage if available, fall back to progress field
    const progressValue = progressRecord.completionPercentage ?? progressRecord.progress ?? 0;
    // A lesson is completed when progress === 100 (using computeModuleProgress logic)
    const isCompleted = progressValue === 100 || progressRecord.completed;

    return {
      lessonId: progressRecord.lesson!.id,
      lessonTitle: progressRecord.lesson!.title,
      completed: isCompleted,
      progress: progressValue,
      lastAccessed: progressRecord.updatedAt,
      completedAt: isCompleted ? progressRecord.completedAt ?? progressRecord.updatedAt : undefined,
    };
  } catch (error) {
    console.error('Error al obtener progreso de la lección:', error);
    throw error;
  }
}

/**
 * Calcular estadísticas del usuario
 * Incluye tiempo total de estudio, racha de días, XP acumulado
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    return await getCached(`user:${userId}:stats`, async () => {
      // Obtener todos los registros de progreso del usuario
      const allProgress = await prisma.progress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'asc' },
        select: {
          updatedAt: true,
          createdAt: true,
        },
      });

      // Calcular tiempo total de estudio (estimado)
      // Asumimos 30 minutos por sesión de estudio
      const estimatedMinutesPerSession = 30;
      const totalStudyTime = allProgress.length * estimatedMinutesPerSession;

      // Calcular racha actual
      const currentStreak = calculateCurrentStreak(allProgress);

      // Calcular racha más larga
      const longestStreak = calculateLongestStreak(allProgress);

      // Obtener XP total (esto requeriría un campo XP en User o calcularlo)
      // Por ahora, calculamos XP basado en progreso
      const totalXP = await calculateTotalXP(userId);

      // Obtener nivel (se calculará en otro servicio)
      const { calculateLevel } = await import('./levelCalculation.service');
      const levelInfo = await calculateLevel(totalXP);

      // Obtener última actividad
      const lastActivity = allProgress.length > 0
        ? allProgress[allProgress.length - 1].updatedAt
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

/**
 * Calcular racha actual (días consecutivos)
 */
function calculateCurrentStreak(progress: Array<{ updatedAt: Date }>): number {
  if (progress.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Obtener fechas únicas ordenadas
  const dates = new Set(
    progress.map(p => {
      const date = new Date(p.updatedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const sortedDates = Array.from(dates).sort((a, b) => b - a);

  // Verificar si hay actividad hoy
  if (sortedDates[0] === today.getTime()) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    // Verificar si hubo actividad ayer
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (sortedDates[0] === yesterday.getTime()) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 2);
    } else {
      return 0; // No hay racha activa
    }
  }

  // Continuar contando días consecutivos hacia atrás
  while (sortedDates.includes(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calcular racha más larga
 */
function calculateLongestStreak(progress: Array<{ updatedAt: Date }>): number {
  if (progress.length === 0) return 0;

  const dates = new Set(
    progress.map(p => {
      const date = new Date(p.updatedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const sortedDates = Array.from(dates).sort((a, b) => a - b);

  if (sortedDates.length === 0) return 0;
  if (sortedDates.length === 1) return 1;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Calcular XP total del usuario
 * Esto es una estimación basada en progreso y logros
 *
 * Uses computeModuleProgress logic: lesson completed when progress === 100
 */
async function calculateTotalXP(userId: string): Promise<number> {
  // XP por lección completada
  const xpPerLesson = 50;
  // XP por módulo completado
  const xpPerModule = 200;
  // XP por quiz pasado
  const xpPerQuiz = 100;

  // Get all lesson progress records
  const allLessonProgress = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: { not: null },
    },
    select: {
      lessonId: true,
      progress: true,
      completionPercentage: true,
    },
  });

  // Count lessons with progress === 100
  const lessonsWithProgress = allLessonProgress.map(p => ({
    id: p.lessonId,
    progress: p.completionPercentage ?? p.progress ?? 0,
  }));
  const { completedLessonsCount: completedLessons } = computeModuleProgress(lessonsWithProgress);

  // Count completed modules (where all lessons have progress === 100)
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    select: {
      id: true,
      lessons: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  let completedModules = 0;
  for (const mod of modules) {
    if (mod.lessons.length === 0) continue;

    const modLessonProgress = allLessonProgress.filter(p =>
      mod.lessons.some(l => l.id === p.lessonId)
    );

    const modLessonsWithProgress = mod.lessons.map(l => {
      const record = modLessonProgress.find(p => p.lessonId === l.id);
      return {
        id: l.id,
        progress: record?.completionPercentage ?? record?.progress ?? 0,
      };
    });

    const { completedLessonsCount, totalLessonsCount } =
      computeModuleProgress(modLessonsWithProgress);

    if (totalLessonsCount > 0 && completedLessonsCount === totalLessonsCount) {
      completedModules++;
    }
  }

  const [passedQuizzes] = await Promise.all([
    prisma.quizAttempt.count({
      where: {
        userId,
        passed: true,
      },
    }),
  ]);

  // XP de logros (se calculará desde el servicio de logros)
  const { getAchievementXP } = await import('./achievements.service');
  const achievementXP = await getAchievementXP(userId);

  const totalXP =
    completedLessons * xpPerLesson +
    completedModules * xpPerModule +
    passedQuizzes * xpPerQuiz +
    achievementXP;

  return totalXP;
}

export default {
  getUserProgress,
  getModuleProgress,
  getLessonProgress,
  getUserStats,
  invalidateUserCache,
};

