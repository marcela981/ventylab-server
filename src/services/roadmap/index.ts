/**
 * Roadmap Resolution Service
 * Centralized service for level unlock status determination
 *
 * DESIGN DECISIONS:
 * - Uses 5-minute TTL caching (same pattern as progressQuery.service.ts)
 * - NEVER locks levels already completed by student (progress safety)
 * - AND logic: ALL prerequisites must be completed to unlock
 * - Fail-soft: Returns unlocked status if resolution fails
 *
 * PREREQUISITE RULES:
 * - Level unlocked if ALL prerequisite levels are completed (AND logic)
 * - No prerequisites = unlocked by default
 * - Completed levels are ALWAYS accessible (progress safety)
 *
 * FUTURE EXTENSIONS:
 * - OR logic support for branching paths (check unlockType field)
 * - Role-specific roadmaps (filter by roleRequirement)
 * - Experimental curricula (filter by experimentGroup)
 * - Time-based unlocks (check validFrom/validUntil)
 * - Minimum score requirements (check minimumScore)
 */

import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants';

// ============================================
// Type Definitions
// ============================================

export interface PrerequisiteStatus {
  levelId: string;
  levelTitle: string;
  isCompleted: boolean;
  completionPercentage: number;
  completedAt?: Date | null;
}

export interface LevelUnlockStatus {
  isLocked: boolean;
  unlockedAt?: Date | null;
  completedAt?: Date | null;
  prerequisites: PrerequisiteStatus[];
  lockReason?: string;
}

export interface LevelCompletionStatus {
  isCompleted: boolean;
  completionPercentage: number;
  completedAt?: Date | null;
  unlockedAt?: Date | null;
  completedModules: number;
  totalModules: number;
}

export interface LevelRoadmapNode {
  levelId: string;
  levelTitle: string;
  levelDescription: string | null;
  order: number;
  isActive: boolean;
  unlockStatus: LevelUnlockStatus;
  moduleCount: number;
  completedModules: number;
  levelProgress: number;
}

// ============================================
// Cache Implementation (5-minute TTL)
// Same pattern as progressQuery.service.ts
// ============================================

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Get cached value or fetch and cache
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
 * Invalidate cache for a specific user and optionally specific level
 * Call this when prerequisites change or progress is updated
 */
export function invalidateLevelCache(userId?: string, levelId?: string): void {
  if (!userId) {
    // Clear entire cache if no userId specified
    cache.clear();
    return;
  }

  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(`user:${userId}`)) {
      if (!levelId || key.includes(levelId) || key.includes('roadmap')) {
        keysToDelete.push(key);
      }
    }
  }
  keysToDelete.forEach((key) => cache.delete(key));
}

/**
 * Clear all roadmap cache entries
 * Call this when prerequisite relationships change (affects all users)
 */
export function invalidateAllRoadmapCache(): void {
  cache.clear();
}

// ============================================
// Level Completion Check
// ============================================

/**
 * Check if a level is completed for a user
 * A level is completed when ALL its active modules are completed
 *
 * @param userId - User ID
 * @param levelId - Level ID
 * @returns Completion status with details
 */
export async function checkLevelCompletion(
  userId: string,
  levelId: string
): Promise<LevelCompletionStatus> {
  // Get level with active modules
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      modules: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!level || level.modules.length === 0) {
    return {
      isCompleted: false,
      completionPercentage: 0,
      completedModules: 0,
      totalModules: 0,
    };
  }

  const moduleIds = level.modules.map((m) => m.id);

  // Get module-level progress from LearningProgress
  const progressRecords = await prisma.learningProgress.findMany({
    where: {
      userId,
      moduleId: { in: moduleIds },
    },
    select: {
      moduleId: true,
      completedAt: true,
      createdAt: true,
    },
  });

  // Count completed modules (completedAt != null)
  const completedModules = progressRecords.filter((p) => p.completedAt != null).length;
  const totalModules = level.modules.length;
  const completionPercentage = totalModules > 0
    ? Math.floor((completedModules / totalModules) * 100)
    : 0;

  const isCompleted = completedModules === totalModules && totalModules > 0;

  const unlockedAt = progressRecords.length > 0
    ? new Date(Math.min(...progressRecords.map((p) => p.createdAt.getTime())))
    : null;

  const completedAt = isCompleted && progressRecords.some((p) => p.completedAt != null)
    ? new Date(
        Math.max(
          ...progressRecords
            .filter((p) => p.completedAt != null)
            .map((p) => (p.completedAt as Date).getTime())
        )
      )
    : null;

  return {
    isCompleted,
    completionPercentage,
    completedAt,
    unlockedAt,
    completedModules,
    totalModules,
  };
}

// ============================================
// Main Resolution Functions
// ============================================

/**
 * Get level unlock status for a specific user and level
 * This is the PRIMARY function for checking if a level is accessible
 *
 * CRITICAL: Always checks completion FIRST to ensure progress safety
 * - A completed level is NEVER locked, regardless of prerequisite changes
 *
 * @param userId - User ID
 * @param levelId - Level ID to check
 * @returns LevelUnlockStatus with detailed prerequisite information
 */
export async function getLevelUnlockStatus(
  userId: string,
  levelId: string
): Promise<LevelUnlockStatus> {
  const cacheKey = `user:${userId}:level:${levelId}:status`;

  return getCached(cacheKey, async () => {
    try {
      // 1. CRITICAL: First check if user has already completed this level
      // This ensures we NEVER lock a completed level (progress safety)
      const userLevelCompletion = await checkLevelCompletion(userId, levelId);

      if (userLevelCompletion.isCompleted) {
        // NEVER lock completed levels - return unlocked immediately
        return {
          isLocked: false,
          completedAt: userLevelCompletion.completedAt,
          unlockedAt: userLevelCompletion.unlockedAt,
          prerequisites: [],
          lockReason: undefined,
        };
      }

      // 2. Get level with prerequisites
      const level = await prisma.level.findUnique({
        where: { id: levelId },
        include: {
          prerequisites: {
            include: {
              prerequisiteLevel: {
                select: {
                  id: true,
                  title: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!level) {
        throw new AppError(
          'Nivel no encontrado',
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.LEVEL_NOT_FOUND
        );
      }

      // 3. No prerequisites = always unlocked
      if (level.prerequisites.length === 0) {
        return {
          isLocked: false,
          unlockedAt: level.createdAt,
          prerequisites: [],
        };
      }

      // 4. Check all prerequisites (AND logic)
      const prerequisiteStatuses: PrerequisiteStatus[] = [];
      let allCompleted = true;
      const missingPrereqs: string[] = [];

      for (const prereq of level.prerequisites) {
        // Skip inactive prerequisite levels (they don't block progression)
        if (!prereq.prerequisiteLevel.isActive) {
          continue;
        }

        const prereqCompletion = await checkLevelCompletion(
          userId,
          prereq.prerequisiteLevelId
        );

        const status: PrerequisiteStatus = {
          levelId: prereq.prerequisiteLevelId,
          levelTitle: prereq.prerequisiteLevel.title,
          isCompleted: prereqCompletion.isCompleted,
          completionPercentage: prereqCompletion.completionPercentage,
          completedAt: prereqCompletion.completedAt,
        };

        prerequisiteStatuses.push(status);

        if (!prereqCompletion.isCompleted) {
          allCompleted = false;
          missingPrereqs.push(prereq.prerequisiteLevel.title);
        }
      }

      // 5. Build lock reason if locked
      const lockReason = allCompleted
        ? undefined
        : `Completa los siguientes niveles: ${missingPrereqs.join(', ')}`;

      return {
        isLocked: !allCompleted,
        prerequisites: prerequisiteStatuses,
        lockReason,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[Roadmap] Error in getLevelUnlockStatus:', error);
      // Fail-soft: return unlocked if resolution fails (better UX than blocking)
      return {
        isLocked: false,
        prerequisites: [],
        lockReason: undefined,
      };
    }
  });
}

/**
 * Get full roadmap with unlock status for all levels
 * Used by dashboard and progress overview screens
 *
 * @param userId - User ID
 * @returns Array of levels with unlock status and progress
 */
export async function getUserRoadmap(userId: string): Promise<LevelRoadmapNode[]> {
  const cacheKey = `user:${userId}:roadmap`;

  return getCached(cacheKey, async () => {
    // Get all active levels ordered
    const levels = await prisma.level.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: { modules: true },
        },
      },
    });

    const roadmap: LevelRoadmapNode[] = [];

    for (const level of levels) {
      const unlockStatus = await getLevelUnlockStatus(userId, level.id);
      const completion = await checkLevelCompletion(userId, level.id);

      roadmap.push({
        levelId: level.id,
        levelTitle: level.title,
        levelDescription: level.description,
        order: level.order,
        isActive: level.isActive,
        unlockStatus,
        moduleCount: level._count.modules,
        completedModules: completion.completedModules,
        levelProgress: completion.completionPercentage,
      });
    }

    return roadmap;
  });
}

/**
 * Check if a specific level is unlocked for a user
 * Convenience function for simple unlock checks
 *
 * @param userId - User ID
 * @param levelId - Level ID
 * @returns Boolean indicating if level is unlocked
 */
export async function isLevelUnlocked(
  userId: string,
  levelId: string
): Promise<boolean> {
  const status = await getLevelUnlockStatus(userId, levelId);
  return !status.isLocked;
}

/**
 * Get the next unlocked level for a user
 * Useful for "continue learning" functionality
 *
 * @param userId - User ID
 * @returns Next incomplete unlocked level or null if all completed
 */
export async function getNextUnlockedLevel(
  userId: string
): Promise<LevelRoadmapNode | null> {
  const roadmap = await getUserRoadmap(userId);

  // Find first level that is unlocked but not completed
  const nextLevel = roadmap.find(
    (level) => !level.unlockStatus.isLocked && level.levelProgress < 100
  );

  return nextLevel || null;
}

/**
 * Get prerequisite chain for a level
 * Useful for showing "complete X to unlock Y" UI
 *
 * @param levelId - Level ID
 * @returns Array of prerequisite levels in order
 */
export async function getPrerequisiteChain(levelId: string): Promise<
  Array<{
    id: string;
    title: string;
    order: number;
  }>
> {
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      prerequisites: {
        include: {
          prerequisiteLevel: {
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!level) {
    return [];
  }

  return level.prerequisites
    .map((p) => p.prerequisiteLevel)
    .sort((a, b) => a.order - b.order);
}

export default {
  getLevelUnlockStatus,
  getUserRoadmap,
  checkLevelCompletion,
  isLevelUnlocked,
  getNextUnlockedLevel,
  getPrerequisiteChain,
  invalidateLevelCache,
  invalidateAllRoadmapCache,
};
