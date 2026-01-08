import { prisma } from '../../config/prisma';
import { AchievementCondition, AchievementDefinition, UnlockedAchievement } from '../../types/progress';
import { invalidateUserCache } from './progressQuery.service';

/**
 * Definiciones de logros disponibles
 * Estos se pueden mover a la base de datos en el futuro
 */
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_lesson',
    title: 'Primer Paso',
    description: 'Completa tu primera lección',
    icon: '🎯',
    condition: { type: 'lessons_completed', value: 1 },
    xpReward: 50,
  },
  {
    id: 'ten_lessons',
    title: 'Aprendiz Dedicado',
    description: 'Completa 10 lecciones',
    icon: '📚',
    condition: { type: 'lessons_completed', value: 10 },
    xpReward: 200,
  },
  {
    id: 'fifty_lessons',
    title: 'Estudiante Avanzado',
    description: 'Completa 50 lecciones',
    icon: '🏆',
    condition: { type: 'lessons_completed', value: 50 },
    xpReward: 500,
  },
  {
    id: 'first_module',
    title: 'Módulo Completado',
    description: 'Completa tu primer módulo',
    icon: '✅',
    condition: { type: 'modules_completed', value: 1 },
    xpReward: 300,
  },
  {
    id: 'perfect_quiz',
    title: 'Puntuación Perfecta',
    description: 'Obtén 100% en un quiz',
    icon: '💯',
    condition: { type: 'perfect_score', value: 1 },
    xpReward: 150,
  },
  {
    id: 'quiz_master',
    title: 'Maestro de Quizzes',
    description: 'Pasa 10 quizzes',
    icon: '🧠',
    condition: { type: 'quizzes_passed', value: 10 },
    xpReward: 400,
  },
  {
    id: 'week_streak',
    title: 'Racha Semanal',
    description: 'Estudia 7 días consecutivos',
    icon: '🔥',
    condition: { type: 'streak_days', value: 7 },
    xpReward: 250,
  },
  {
    id: 'month_streak',
    title: 'Racha Mensual',
    description: 'Estudia 30 días consecutivos',
    icon: '⭐',
    condition: { type: 'streak_days', value: 30 },
    xpReward: 1000,
  },
  {
    id: 'level_10',
    title: 'Nivel 10',
    description: 'Alcanza el nivel 10',
    icon: '🎖️',
    condition: { type: 'xp_reached', value: 5000 },
    xpReward: 500,
  },
  {
    id: 'level_25',
    title: 'Nivel 25',
    description: 'Alcanza el nivel 25',
    icon: '🌟',
    condition: { type: 'xp_reached', value: 31250 },
    xpReward: 1000,
  },
];

/**
 * Verificar si el usuario cumple condiciones para un logro
 */
export async function checkAchievementCondition(
  userId: string,
  condition: AchievementCondition
): Promise<boolean> {
  try {
    switch (condition.type) {
      case 'lessons_completed': {
        const count = await prisma.progress.count({
          where: {
            userId,
            lessonId: { not: null },
            completed: true,
          },
        });
        return count >= condition.value;
      }

      case 'modules_completed': {
        const modules = await prisma.progress.findMany({
          where: {
            userId,
            moduleId: { not: null },
            completed: true,
          },
          distinct: ['moduleId'],
        });
        return modules.length >= condition.value;
      }

      case 'quizzes_passed': {
        const count = await prisma.quizAttempt.count({
          where: {
            userId,
            passed: true,
          },
        });
        return count >= condition.value;
      }

      case 'perfect_score': {
        const count = await prisma.quizAttempt.count({
          where: {
            userId,
            score: 100,
          },
        });
        return count >= condition.value;
      }

      case 'streak_days': {
        const { getUserStats } = await import('./progressQuery.service');
        const stats = await getUserStats(userId);
        return stats.currentStreak >= condition.value;
      }

      case 'xp_reached': {
        const { getUserStats } = await import('./progressQuery.service');
        const stats = await getUserStats(userId);
        return stats.totalXP >= condition.value;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Error al verificar condición de logro:', error);
    return false;
  }
}

/**
 * Desbloquear logro y notificar al usuario
 */
export async function unlockAchievement(
  userId: string,
  achievementDef: AchievementDefinition
): Promise<UnlockedAchievement | null> {
  try {
    // Verificar si el logro ya está desbloqueado
    const existing = await prisma.achievement.findFirst({
      where: {
        userId,
        title: achievementDef.title,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        title: existing.title,
        description: existing.description || undefined,
        icon: achievementDef.icon,
        unlockedAt: existing.unlockedAt,
        xpReward: achievementDef.xpReward,
      };
    }

    // Usar transacción para crear logro y actualizar XP
    const result = await prisma.$transaction(async (tx) => {
      // Crear logro
      const achievement = await tx.achievement.create({
        data: {
          userId,
          title: achievementDef.title,
          description: achievementDef.description,
          icon: achievementDef.icon,
        },
      });

      return achievement;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    // Actualizar XP del usuario
    const { updateUserXP } = await import('./progressUpdate.service');
    await updateUserXP(userId, achievementDef.xpReward);

    // Invalidar caché
    invalidateUserCache(userId);

    // Log de logro desbloqueado
    console.log(`[${new Date().toISOString()}] Usuario ${userId} desbloqueó logro: ${achievementDef.title}`);

    return {
      id: result.id,
      title: result.title,
      description: result.description || undefined,
      icon: achievementDef.icon,
      unlockedAt: result.unlockedAt,
      xpReward: achievementDef.xpReward,
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      // Conflicto de concurrencia, intentar nuevamente
      return await unlockAchievement(userId, achievementDef);
    }

    console.error('Error al desbloquear logro:', error);
    return null;
  }
}

/**
 * Verificar y desbloquear logros cuando se cumplan condiciones
 */
export async function checkAndUnlockAchievements(
  userId: string,
  triggerCondition?: AchievementCondition
): Promise<UnlockedAchievement[]> {
  try {
    const unlocked: UnlockedAchievement[] = [];

    // Obtener logros ya desbloqueados
    const unlockedAchievements = await prisma.achievement.findMany({
      where: { userId },
      select: { title: true },
    });

    const unlockedTitles = new Set(unlockedAchievements.map(a => a.title));

    // Verificar cada definición de logro
    for (const achievementDef of ACHIEVEMENT_DEFINITIONS) {
      // Si ya está desbloqueado, saltar
      if (unlockedTitles.has(achievementDef.title)) {
        continue;
      }

      // Si hay una condición trigger, solo verificar logros relacionados
      if (triggerCondition) {
        const isRelated = 
          achievementDef.condition.type === triggerCondition.type ||
          (triggerCondition.type === 'lessons_completed' && achievementDef.condition.type === 'lessons_completed') ||
          (triggerCondition.type === 'modules_completed' && achievementDef.condition.type === 'modules_completed') ||
          (triggerCondition.type === 'quizzes_passed' && achievementDef.condition.type === 'quizzes_passed');

        if (!isRelated) {
          continue;
        }
      }

      // Verificar si cumple la condición
      const meetsCondition = await checkAchievementCondition(userId, achievementDef.condition);

      if (meetsCondition) {
        const unlockedAchievement = await unlockAchievement(userId, achievementDef);
        if (unlockedAchievement) {
          unlocked.push(unlockedAchievement);
        }
      }
    }

    return unlocked;
  } catch (error) {
    console.error('Error al verificar y desbloquear logros:', error);
    return [];
  }
}

/**
 * Obtener todos los logros del usuario
 */
export async function getUserAchievements(userId: string): Promise<UnlockedAchievement[]> {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });

    // Mapear a UnlockedAchievement con XP reward
    return achievements.map(achievement => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.title === achievement.title);
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description || undefined,
        icon: achievement.icon || undefined,
        unlockedAt: achievement.unlockedAt,
        xpReward: def?.xpReward || 0,
      };
    });
  } catch (error) {
    console.error('Error al obtener logros del usuario:', error);
    return [];
  }
}

/**
 * Obtener logros disponibles (bloqueados)
 */
export async function getAvailableAchievements(userId: string): Promise<AchievementDefinition[]> {
  try {
    // Obtener logros desbloqueados
    const unlockedAchievements = await prisma.achievement.findMany({
      where: { userId },
      select: { title: true },
    });

    const unlockedTitles = new Set(unlockedAchievements.map(a => a.title));

    // Filtrar logros no desbloqueados
    const available: AchievementDefinition[] = [];

    for (const achievementDef of ACHIEVEMENT_DEFINITIONS) {
      if (!unlockedTitles.has(achievementDef.title)) {
        // Verificar progreso hacia el logro
        const progress = await getAchievementProgress(userId, achievementDef.condition);
        available.push({
          ...achievementDef,
          // Agregar información de progreso si es necesario
        } as any);
      }
    }

    return available;
  } catch (error) {
    console.error('Error al obtener logros disponibles:', error);
    return [];
  }
}

/**
 * Obtener progreso hacia un logro específico
 */
async function getAchievementProgress(
  userId: string,
  condition: AchievementCondition
): Promise<number> {
  try {
    let current = 0;
    let target = condition.value;

    switch (condition.type) {
      case 'lessons_completed': {
        current = await prisma.progress.count({
          where: {
            userId,
            lessonId: { not: null },
            completed: true,
          },
        });
        break;
      }

      case 'modules_completed': {
        const modules = await prisma.progress.findMany({
          where: {
            userId,
            moduleId: { not: null },
            completed: true,
          },
          distinct: ['moduleId'],
        });
        current = modules.length;
        break;
      }

      case 'quizzes_passed': {
        current = await prisma.quizAttempt.count({
          where: {
            userId,
            passed: true,
          },
        });
        break;
      }

      case 'perfect_score': {
        current = await prisma.quizAttempt.count({
          where: {
            userId,
            score: 100,
          },
        });
        break;
      }

      case 'streak_days': {
        const { getUserStats } = await import('./progressQuery.service');
        const stats = await getUserStats(userId);
        current = stats.currentStreak;
        break;
      }

      case 'xp_reached': {
        const { getUserStats } = await import('./progressQuery.service');
        const stats = await getUserStats(userId);
        current = stats.totalXP;
        break;
      }
    }

    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Obtener XP total de logros del usuario
 */
export async function getAchievementXP(userId: string): Promise<number> {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      select: { title: true },
    });

    let totalXP = 0;
    for (const achievement of achievements) {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.title === achievement.title);
      if (def) {
        totalXP += def.xpReward;
      }
    }

    return totalXP;
  } catch (error) {
    return 0;
  }
}

export default {
  checkAchievementCondition,
  unlockAchievement,
  checkAndUnlockAchievements,
  getUserAchievements,
  getAvailableAchievements,
  getAchievementXP,
};

