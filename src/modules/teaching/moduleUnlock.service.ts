/**
 * MODULE UNLOCK SERVICE
 * =====================
 *
 * Determines which modules a user can access based on:
 * 1. Level gating (LevelPrerequisite system)
 * 2. Module prerequisites (ModulePrerequisite system)
 * 3. Active status filtering
 *
 * All unlock logic lives server-side.
 * Frontend is read-only regarding progression.
 *
 * QUERY STRATEGY:
 * - canAccessModule: 2 queries max (single module check)
 * - getUnlockedModules: 3 queries total (batch, no N+1)
 */

import { prisma } from '../../shared/infrastructure/database';
import { ProgressStatus } from '@prisma/client';

// ============================================
// PUBLIC API
// ============================================

/**
 * Check if a user can access a specific module.
 *
 * Validates (in order):
 * 1. Module exists and isActive
 * 2. Module's level is accessible (all prerequisite levels fully completed)
 * 3. All direct module prerequisites are completed
 *
 * @param userId - The user ID to check access for
 * @param moduleId - The module ID to check
 * @returns true if the user can access the module
 */
export async function canAccessModule(
  userId: string,
  moduleId: string
): Promise<boolean> {
  // Single deep query: module + level prerequisites + module prerequisites
  const module = await prisma.module.findFirst({
    where: { id: moduleId, isActive: true },
    include: {
      level: {
        include: {
          prerequisites: {
            include: {
              prerequisiteLevel: {
                include: {
                  modules: {
                    where: { isActive: true },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
      prerequisites: {
        select: { prerequisiteId: true },
      },
    },
  });

  if (!module) return false;

  // 1. Level gating: ALL modules in prerequisite levels must be COMPLETED
  if (module.level && module.level.prerequisites.length > 0) {
    const prereqModuleIds: string[] = [];

    for (const lp of module.level.prerequisites) {
      for (const m of lp.prerequisiteLevel.modules) {
        prereqModuleIds.push(m.id);
      }
    }

    if (prereqModuleIds.length > 0) {
      const completedCount = await prisma.userProgress.count({
        where: {
          userId,
          moduleId: { in: prereqModuleIds },
          status: ProgressStatus.COMPLETED,
        },
      });

      if (completedCount < prereqModuleIds.length) return false;
    }
  }

  // 2. Module prerequisite gating
  if (module.prerequisites.length === 0) return true;

  const prerequisiteIds = module.prerequisites.map(p => p.prerequisiteId);

  const completedPrereqs = await prisma.userProgress.count({
    where: {
      userId,
      moduleId: { in: prerequisiteIds },
      status: ProgressStatus.COMPLETED,
    },
  });

  return completedPrereqs === prerequisiteIds.length;
}

/**
 * Get all unlocked module IDs for a user.
 *
 * Optimized: 3 batch queries + in-memory resolution.
 * No N+1 queries regardless of module/level count.
 *
 * @param userId - The user ID
 * @returns Array of module IDs the user can access
 */
export async function getUnlockedModules(userId: string): Promise<string[]> {
  // Query 1: All active modules with level info and prerequisites
  const allModules = await prisma.module.findMany({
    where: { isActive: true },
    include: {
      level: true,
      prerequisites: {
        select: { prerequisiteId: true },
      },
    },
    orderBy: [
      { level: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  // Query 2: All COMPLETED UserProgress records for this user
  const completedProgress = await prisma.userProgress.findMany({
    where: { userId, status: ProgressStatus.COMPLETED },
    select: { moduleId: true },
  });
  const completedSet = new Set(completedProgress.map(p => p.moduleId));

  // Query 3: All level prerequisites (for level gating)
  const levelPrereqs = await prisma.levelPrerequisite.findMany({
    select: { levelId: true, prerequisiteLevelId: true },
  });

  // --- In-memory resolution (zero additional queries) ---

  // Build: levelId -> prerequisiteLevelId[]
  const levelPrereqMap = new Map<string, string[]>();
  for (const lp of levelPrereqs) {
    if (!levelPrereqMap.has(lp.levelId)) {
      levelPrereqMap.set(lp.levelId, []);
    }
    levelPrereqMap.get(lp.levelId)!.push(lp.prerequisiteLevelId);
  }

  // Build: levelId -> moduleId[]
  const levelModulesMap = new Map<string, string[]>();
  for (const m of allModules) {
    if (m.levelId) {
      if (!levelModulesMap.has(m.levelId)) {
        levelModulesMap.set(m.levelId, []);
      }
      levelModulesMap.get(m.levelId)!.push(m.id);
    }
  }

  // Resolve: is every module in a given level completed?
  const levelCompleted = new Map<string, boolean>();
  for (const [levelId, moduleIds] of levelModulesMap) {
    levelCompleted.set(
      levelId,
      moduleIds.every(id => completedSet.has(id))
    );
  }

  // Memoized level accessibility check
  const levelAccessCache = new Map<string, boolean>();
  const isLevelAccessible = (levelId: string): boolean => {
    if (levelAccessCache.has(levelId)) return levelAccessCache.get(levelId)!;

    const prereqs = levelPrereqMap.get(levelId) ?? [];
    const accessible = prereqs.length === 0 ||
      prereqs.every(pid => levelCompleted.get(pid) === true);

    levelAccessCache.set(levelId, accessible);
    return accessible;
  };

  // Filter: level accessible + all module prerequisites completed
  return allModules
    .filter(m => {
      // Level gate
      if (m.levelId && !isLevelAccessible(m.levelId)) return false;

      // Module prerequisite gate
      return m.prerequisites.every(p => completedSet.has(p.prerequisiteId));
    })
    .map(m => m.id);
}
