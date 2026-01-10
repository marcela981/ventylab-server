import { prisma } from '../../config/prisma';
import { UserProgress, ModuleProgress, LessonProgress, UserStats } from '../../types/progress';

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
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    return await getCached(`user:${userId}:progress`, async () => {
      // Obtener todos los módulos activos
      const totalModules = await prisma.module.count({
        where: { isActive: true },
      });

      // Obtener todos los módulos con progreso completado
      const modulesWithProgress = await prisma.progress.findMany({
        where: {
          userId,
          moduleId: { not: null },
          completed: true,
        },
        select: {
          moduleId: true,
        },
        distinct: ['moduleId'],
      });

      const completedModules = modulesWithProgress.length;

      // Obtener todas las lecciones activas
      const totalLessons = await prisma.lesson.count({
        where: { isActive: true },
      });

      // Obtener lecciones completadas
      const completedLessons = await prisma.progress.count({
        where: {
          userId,
          lessonId: { not: null },
          completed: true,
        },
      });

      // Calcular progreso general
      const overallProgress = totalLessons > 0
        ? (completedLessons / totalLessons) * 100
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
        completedModules,
        totalLessons,
        completedLessons,
        overallProgress: Math.round(overallProgress * 100) / 100,
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

      const totalLessons = module.lessons.length;

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

      // Construir array de progreso de lecciones
      const lessons: LessonProgress[] = module.lessons.map(lesson => {
        const progressRecord = progressMap.get(lesson.id);
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completed: progressRecord?.completed || false,
          progress: progressRecord?.progress || 0,
          lastAccessed: progressRecord?.updatedAt,
          completedAt: progressRecord?.completed ? progressRecord.updatedAt : undefined,
        };
      });

      const completedLessons = lessons.filter(l => l.completed).length;
      const progress = totalLessons > 0
        ? (completedLessons / totalLessons) * 100
        : 0;

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        totalLessons,
        completedLessons,
        progress: Math.round(progress * 100) / 100,
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
    // No usar caché para progreso de lección individual (cambia frecuentemente)
    const progressRecord = await prisma.progress.findFirst({
      where: {
        userId,
        lessonId,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
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

    return {
      lessonId: progressRecord.lesson!.id,
      lessonTitle: progressRecord.lesson!.title,
      completed: progressRecord.completed,
      progress: progressRecord.progress,
      lastAccessed: progressRecord.updatedAt,
      completedAt: progressRecord.completed ? progressRecord.updatedAt : undefined,
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
 */
async function calculateTotalXP(userId: string): Promise<number> {
  // XP por lección completada
  const xpPerLesson = 50;
  // XP por módulo completado
  const xpPerModule = 200;
  // XP por quiz pasado
  const xpPerQuiz = 100;

  const [completedLessons, completedModules, passedQuizzes, achievements] = await Promise.all([
    prisma.progress.count({
      where: {
        userId,
        lessonId: { not: null },
        completed: true,
      },
    }),
    prisma.progress.count({
      where: {
        userId,
        moduleId: { not: null },
        completed: true,
      },
      distinct: ['moduleId'],
    }),
    prisma.quizAttempt.count({
      where: {
        userId,
        passed: true,
      },
    }),
    prisma.achievement.findMany({
      where: { userId },
      select: { id: true },
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

