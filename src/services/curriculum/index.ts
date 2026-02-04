/**
 * Curriculum Service
 * Provides functions to retrieve modules based on the explicit curriculum data
 * Ensures consistent ordering and proper isolation of prerequisitos level
 */

import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants';
import {
  CURRICULUM_LEVELS,
  CurriculumLevel,
  CurriculumModule,
  BEGINNER_MODULES,
  PREREQUISITOS_MODULES,
  getModulesForLevel,
  getModuleIdsForLevel,
  getBeginnerModules,
  getBeginnerModuleIds,
  isBeginnerModule,
  isPrerequisitosModule,
  getBeginnerModuleOrder,
  getNextBeginnerModule,
  getPreviousBeginnerModule,
  levelAffectsUnlocking,
  levelHasAutoNavigation,
  CURRICULUM_CONFIG,
} from '../../config/curriculumData';

export interface CurriculumModuleWithProgress extends CurriculumModule {
  dbModule?: any;
  progress?: {
    completed: boolean;
    completionPercentage: number;
    timeSpent: number;
  };
  isLocked: boolean;
  lessonCount: number;
}

export interface CurriculumLevelResponse {
  level: CurriculumLevel;
  modules: CurriculumModuleWithProgress[];
  totalModules: number;
  completedModules: number;
  levelProgress: number;
}

/**
 * Get beginner modules with database data and user progress
 * Returns exactly 6 modules in the explicit order defined in curriculumData
 */
export async function getBeginnerCurriculumModules(
  userId?: string
): Promise<CurriculumLevelResponse> {
  try {
    const beginnerModuleIds = getBeginnerModuleIds();

    // Fetch database modules that match our curriculum IDs
    const dbModules = await prisma.module.findMany({
      where: {
        id: { in: beginnerModuleIds },
        isActive: true,
      },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    // Create a map for quick lookup
    const dbModuleMap = new Map(dbModules.map((m) => [m.id, m]));

    // Fetch user progress from LearningProgress if userId provided
    let progressMap = new Map<string, { completedAt: Date | null; timeSpent: number }>();
    if (userId) {
      const progressRecords = await prisma.learningProgress.findMany({
        where: {
          userId,
          moduleId: { in: beginnerModuleIds },
        },
        select: { moduleId: true, completedAt: true, timeSpent: true },
      });
      progressMap = new Map(progressRecords.map((p) => [p.moduleId, p]));
    }

    // Build modules in explicit order from curriculum data
    const modules: CurriculumModuleWithProgress[] = BEGINNER_MODULES.map(
      (currModule, index) => {
        const dbModule = dbModuleMap.get(currModule.id);
        const progress = progressMap.get(currModule.id);

        let isLocked = false;
        if (index > 0 && userId) {
          const previousModuleId = BEGINNER_MODULES[index - 1].id;
          const previousProgress = progressMap.get(previousModuleId);
          isLocked = previousProgress?.completedAt == null;
        }

        return {
          ...currModule,
          dbModule,
          progress: progress
            ? {
                completed: progress.completedAt != null,
                completionPercentage: progress.completedAt != null ? 100 : 0,
                timeSpent: progress.timeSpent || 0,
              }
            : undefined,
          isLocked,
          lessonCount: dbModule?._count?.lessons || 0,
        };
      }
    );

    const completedModules = modules.filter(
      (m) => m.progress?.completed
    ).length;
    const levelProgress =
      modules.length > 0
        ? Math.round((completedModules / modules.length) * 100)
        : 0;

    return {
      level: CURRICULUM_LEVELS.BEGINNER,
      modules,
      totalModules: modules.length,
      completedModules,
      levelProgress,
    };
  } catch (error) {
    console.error('Error in getBeginnerCurriculumModules:', error);
    throw new AppError(
      'Error al obtener los módulos del nivel principiante',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Get prerequisitos modules (optional level)
 * These modules do NOT affect beginner unlocking or navigation
 */
export async function getPrerequisitosModules(
  userId?: string
): Promise<CurriculumLevelResponse> {
  try {
    const prereqModuleIds = getModuleIdsForLevel(CURRICULUM_LEVELS.PREREQUISITOS);

    // Fetch database modules
    const dbModules = await prisma.module.findMany({
      where: {
        id: { in: prereqModuleIds },
        isActive: true,
      },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    const dbModuleMap = new Map(dbModules.map((m) => [m.id, m]));

    let progressMap = new Map<string, { completedAt: Date | null; timeSpent: number }>();
    if (userId) {
      const progressRecords = await prisma.learningProgress.findMany({
        where: {
          userId,
          moduleId: { in: prereqModuleIds },
        },
        select: { moduleId: true, completedAt: true, timeSpent: true },
      });
      progressMap = new Map(progressRecords.map((p) => [p.moduleId, p]));
    }

    const modules: CurriculumModuleWithProgress[] = PREREQUISITOS_MODULES.map(
      (currModule) => {
        const dbModule = dbModuleMap.get(currModule.id);
        const progress = progressMap.get(currModule.id);

        return {
          ...currModule,
          dbModule,
          progress: progress
            ? {
                completed: progress.completedAt != null,
                completionPercentage: progress.completedAt != null ? 100 : 0,
                timeSpent: progress.timeSpent || 0,
              }
            : undefined,
          isLocked: false,
          lessonCount: dbModule?._count?.lessons || 0,
        };
      }
    );

    const completedModules = modules.filter(
      (m) => m.progress?.completed
    ).length;
    const levelProgress =
      modules.length > 0
        ? Math.round((completedModules / modules.length) * 100)
        : 0;

    return {
      level: CURRICULUM_LEVELS.PREREQUISITOS,
      modules,
      totalModules: modules.length,
      completedModules,
      levelProgress,
    };
  } catch (error) {
    console.error('Error in getPrerequisitosModules:', error);
    throw new AppError(
      'Error al obtener los módulos de prerequisitos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Get modules for a specific curriculum level
 */
export async function getCurriculumModulesByLevel(
  level: CurriculumLevel,
  userId?: string
): Promise<CurriculumLevelResponse> {
  switch (level) {
    case CURRICULUM_LEVELS.BEGINNER:
      return getBeginnerCurriculumModules(userId);
    case CURRICULUM_LEVELS.PREREQUISITOS:
      return getPrerequisitosModules(userId);
    default:
      // For intermediate/advanced, fall back to database query with order
      return getDatabaseModulesByLevel(level, userId);
  }
}

/**
 * Fallback for levels not explicitly defined in curriculum data
 */
async function getDatabaseModulesByLevel(
  level: CurriculumLevel,
  userId?: string
): Promise<CurriculumLevelResponse> {
  try {
    const dbModules = await prisma.module.findMany({
      where: {
        difficulty: level,
        isActive: true,
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    let progressMap = new Map<string, { completedAt: Date | null; timeSpent: number }>();
    if (userId && dbModules.length > 0) {
      const moduleIds = dbModules.map((m) => m.id);
      const progressRecords = await prisma.learningProgress.findMany({
        where: {
          userId,
          moduleId: { in: moduleIds },
        },
        select: { moduleId: true, completedAt: true, timeSpent: true },
      });
      progressMap = new Map(progressRecords.map((p) => [p.moduleId, p]));
    }

    const modules: CurriculumModuleWithProgress[] = dbModules.map(
      (dbModule, index) => {
        const progress = progressMap.get(dbModule.id);

        let isLocked = false;
        if (index > 0 && userId) {
          const previousModuleId = dbModules[index - 1].id;
          const previousProgress = progressMap.get(previousModuleId);
          isLocked = previousProgress?.completedAt == null;
        }

        return {
          id: dbModule.id,
          order: dbModule.order,
          title: dbModule.title,
          description: dbModule.description || undefined,
          dbModule,
          progress: progress
            ? {
                completed: progress.completedAt != null,
                completionPercentage: progress.completedAt != null ? 100 : 0,
                timeSpent: progress.timeSpent || 0,
              }
            : undefined,
          isLocked,
          lessonCount: dbModule._count?.lessons || 0,
        };
      }
    );

    const completedModules = modules.filter(
      (m) => m.progress?.completed
    ).length;
    const levelProgress =
      modules.length > 0
        ? Math.round((completedModules / modules.length) * 100)
        : 0;

    return {
      level,
      modules,
      totalModules: modules.length,
      completedModules,
      levelProgress,
    };
  } catch (error) {
    console.error('Error in getDatabaseModulesByLevel:', error);
    throw new AppError(
      'Error al obtener los módulos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Check if a module is unlocked for a user
 * IMPORTANT: Prerequisitos completion does NOT affect beginner unlocking
 */
export async function isModuleUnlocked(
  userId: string,
  moduleId: string
): Promise<boolean> {
  // Prerequisitos modules are always unlocked
  if (isPrerequisitosModule(moduleId)) {
    return true;
  }

  // Check if it's a beginner module
  if (isBeginnerModule(moduleId)) {
    const moduleOrder = getBeginnerModuleOrder(moduleId);

    // First module is always unlocked
    if (moduleOrder === 1) {
      return true;
    }

    // Check if previous beginner module is completed
    const previousModule = getPreviousBeginnerModule(moduleId);
    if (!previousModule) {
      return true; // No previous module means unlocked
    }

    const previousProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId: previousModule.id },
      },
      select: { completedAt: true },
    });

    return previousProgress?.completedAt != null;
  }

  // For other levels, check database prerequisites
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
    },
  });

  if (!module) {
    return false;
  }

  // If no prerequisites, it's unlocked
  if (module.prerequisites.length === 0) {
    return true;
  }

  // Check all prerequisites are completed
  // Skip prerequisitos level modules in this check
  const relevantPrereqs = module.prerequisites.filter(
    (p) => !isPrerequisitosModule(p.prerequisiteId)
  );

  if (relevantPrereqs.length === 0) {
    return true;
  }

  const prereqIds = relevantPrereqs.map((p) => p.prerequisiteId);
  const completedPrereqs = await prisma.learningProgress.count({
    where: {
      userId,
      moduleId: { in: prereqIds },
      completedAt: { not: null },
    },
  });

  return completedPrereqs === prereqIds.length;
}

/**
 * Get the next module to navigate to after completing current module
 * IMPORTANT: Never auto-navigate into prerequisitos
 */
export async function getNextModuleForNavigation(
  userId: string,
  currentModuleId: string
): Promise<CurriculumModule | null> {
  // If current module is prerequisitos, don't auto-navigate anywhere
  if (isPrerequisitosModule(currentModuleId)) {
    return null; // No auto-navigation from prerequisitos
  }

  // If current module is beginner, get next beginner module
  if (isBeginnerModule(currentModuleId)) {
    return getNextBeginnerModule(currentModuleId);
  }

  // For other levels, query database for next module
  const currentModule = await prisma.module.findUnique({
    where: { id: currentModuleId },
  });

  if (!currentModule) {
    return null;
  }

  const nextModule = await prisma.module.findFirst({
    where: {
      difficulty: currentModule.difficulty,
      order: { gt: currentModule.order },
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });

  if (!nextModule) {
    return null;
  }

  return {
    id: nextModule.id,
    order: nextModule.order,
    title: nextModule.title,
    description: nextModule.description || undefined,
  };
}

/**
 * Validate that a module belongs to the expected level
 */
export function validateModuleLevel(
  moduleId: string,
  expectedLevel: CurriculumLevel
): boolean {
  const levelModuleIds = getModuleIdsForLevel(expectedLevel);
  return levelModuleIds.includes(moduleId);
}

/**
 * Get curriculum configuration for a level
 */
export function getLevelConfig(level: CurriculumLevel) {
  return CURRICULUM_CONFIG[level];
}

export default {
  getBeginnerCurriculumModules,
  getPrerequisitosModules,
  getCurriculumModulesByLevel,
  isModuleUnlocked,
  getNextModuleForNavigation,
  validateModuleLevel,
  getLevelConfig,
  // Re-export utility functions from curriculumData
  isBeginnerModule,
  isPrerequisitosModule,
  getBeginnerModuleOrder,
  levelAffectsUnlocking,
  levelHasAutoNavigation,
};
