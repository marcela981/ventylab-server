/**
 * Level Prerequisite Service
 * Business logic for level-to-level prerequisite management
 *
 * DESIGN DECISIONS:
 * - Circular dependencies detected using DFS algorithm (same as modules)
 * - Prevents self-referencing prerequisites
 * - Prevents deleting levels that are prerequisites for other active levels
 * - All mutations logged to audit trail (fail-soft)
 *
 * PREREQUISITE RULES:
 * - Level unlocked if ALL prerequisite levels are completed (AND logic)
 * - No prerequisites = unlocked by default
 * - NEVER lock levels already completed by student (progress safety)
 *
 * FUTURE EXTENSIONS:
 * - OR logic support for branching paths (check unlockType field)
 * - Role-specific roadmaps (filter by roleRequirement)
 * - Time-based unlocks (validFrom/validUntil fields)
 */

import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants';
import { logChange } from '../changelog';

// ============================================
// Type Definitions
// ============================================

export interface LevelWithPrerequisites {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  prerequisites: Array<{
    id: string;
    prerequisiteLevel: {
      id: string;
      title: string;
      order: number;
      isActive: boolean;
    };
  }>;
  dependentLevels: Array<{
    id: string;
    level: {
      id: string;
      title: string;
      order: number;
    };
  }>;
  _count: {
    modules: number;
  };
}

export interface CanDeleteResult {
  canDelete: boolean;
  reason?: string;
  dependentLevels?: string[];
  hasStudentProgress?: boolean;
}

// ============================================
// Circular Dependency Detection (DFS)
// ============================================

/**
 * Check for circular dependencies using Depth-First Search
 * Same algorithm pattern as hasCircularDependency in modules service
 *
 * @param levelId - Level that would have the prerequisite added
 * @param prerequisiteLevelId - Prerequisite being added
 * @param visited - Set of visited level IDs (for recursion tracking)
 * @returns True if circular dependency would be created
 */
export const hasCircularDependency = async (
  levelId: string,
  prerequisiteLevelId: string,
  visited: Set<string> = new Set()
): Promise<boolean> => {
  // If we've already visited this node in current path, it's circular
  if (visited.has(prerequisiteLevelId)) {
    return true;
  }

  visited.add(prerequisiteLevelId);

  // Get prerequisites of the prerequisite level
  const prerequisites = await prisma.levelPrerequisite.findMany({
    where: { levelId: prerequisiteLevelId },
    select: { prerequisiteLevelId: true },
  });

  for (const prereq of prerequisites) {
    // Direct cycle: prerequisite's prerequisite is the original level
    if (prereq.prerequisiteLevelId === levelId) {
      return true;
    }

    // Recursive check for deeper cycles
    const hasCircular = await hasCircularDependency(
      levelId,
      prereq.prerequisiteLevelId,
      visited
    );

    if (hasCircular) {
      return true;
    }
  }

  return false;
};

// ============================================
// Prerequisite Management Functions
// ============================================

/**
 * Add a prerequisite to a level
 *
 * VALIDATION:
 * 1. Both levels must exist
 * 2. Cannot add itself as prerequisite
 * 3. Cannot create circular dependencies
 * 4. Cannot duplicate existing prerequisites
 *
 * @param levelId - Level to add prerequisite to
 * @param prerequisiteLevelId - Level that must be completed first
 * @param userId - User making the change (for audit trail)
 * @returns Updated level with all prerequisites
 */
export const addLevelPrerequisite = async (
  levelId: string,
  prerequisiteLevelId: string,
  userId?: string
): Promise<LevelWithPrerequisites> => {
  try {
    // 1. Validate both levels exist
    const [level, prerequisite] = await Promise.all([
      prisma.level.findUnique({ where: { id: levelId } }),
      prisma.level.findUnique({ where: { id: prerequisiteLevelId } }),
    ]);

    if (!level) {
      throw new AppError(
        'Nivel no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel especificado no existe']
      );
    }

    if (!prerequisite) {
      throw new AppError(
        'Nivel prerequisito no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel prerequisito especificado no existe']
      );
    }

    // 2. Cannot add itself as prerequisite
    if (levelId === prerequisiteLevelId) {
      throw new AppError(
        'Un nivel no puede ser prerequisito de sí mismo',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_SELF_PREREQUISITE,
        true,
        ['Selecciona un nivel diferente como prerequisito']
      );
    }

    // 3. Check for circular dependencies
    const hasCircular = await hasCircularDependency(levelId, prerequisiteLevelId);

    if (hasCircular) {
      throw new AppError(
        'No se puede agregar este prerequisito',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_CIRCULAR_DEPENDENCY,
        true,
        [
          'Agregar este prerequisito crearía una dependencia circular',
          'Revisa la cadena de prerequisitos para evitar ciclos',
        ]
      );
    }

    // 4. Check if prerequisite already exists
    const existingPrereq = await prisma.levelPrerequisite.findFirst({
      where: { levelId, prerequisiteLevelId },
    });

    if (existingPrereq) {
      throw new AppError(
        'Este prerequisito ya existe',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DUPLICATE_LEVEL_PREREQUISITE,
        true,
        ['El nivel ya tiene este prerequisito configurado']
      );
    }

    // 5. Create the prerequisite relationship
    await prisma.levelPrerequisite.create({
      data: { levelId, prerequisiteLevelId },
    });

    // 6. Log the change (fail-soft - errors here won't block the operation)
    if (userId) {
      try {
        await logChange({
          entityType: 'Level',
          entityId: levelId,
          action: 'update',
          changedBy: userId,
          diff: {
            prerequisites: {
              before: null,
              after: { added: prerequisiteLevelId, title: prerequisite.title },
            },
          },
        });
      } catch (logError) {
        console.error('Failed to log prerequisite addition:', logError);
      }
    }

    // 7. Return updated level with prerequisites
    return await getLevelWithPrerequisites(levelId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in addLevelPrerequisite:', error);
    throw new AppError(
      'Error al agregar prerequisito de nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Remove a prerequisite from a level
 *
 * @param levelId - Level to remove prerequisite from
 * @param prerequisiteLevelId - Prerequisite level ID to remove
 * @param userId - User making the change (for audit trail)
 * @returns Confirmation message
 */
export const removeLevelPrerequisite = async (
  levelId: string,
  prerequisiteLevelId: string,
  userId?: string
): Promise<string> => {
  try {
    // Find the prerequisite relationship
    const prerequisite = await prisma.levelPrerequisite.findFirst({
      where: { levelId, prerequisiteLevelId },
      include: {
        prerequisiteLevel: {
          select: { title: true },
        },
      },
    });

    if (!prerequisite) {
      throw new AppError(
        'Relación de prerequisito no encontrada',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_PREREQUISITE_NOT_FOUND,
        true,
        ['Este prerequisito no está configurado para el nivel']
      );
    }

    // Delete the relationship
    await prisma.levelPrerequisite.delete({
      where: { id: prerequisite.id },
    });

    // Log the change (fail-soft)
    if (userId) {
      try {
        await logChange({
          entityType: 'Level',
          entityId: levelId,
          action: 'update',
          changedBy: userId,
          diff: {
            prerequisites: {
              before: { removed: prerequisiteLevelId, title: prerequisite.prerequisiteLevel.title },
              after: null,
            },
          },
        });
      } catch (logError) {
        console.error('Failed to log prerequisite removal:', logError);
      }
    }

    return 'Prerequisito de nivel eliminado exitosamente';
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in removeLevelPrerequisite:', error);
    throw new AppError(
      'Error al eliminar prerequisito de nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get level with full prerequisite information
 *
 * @param levelId - Level ID to fetch
 * @returns Level with prerequisites and dependent levels
 */
export const getLevelWithPrerequisites = async (
  levelId: string
): Promise<LevelWithPrerequisites> => {
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      modules: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
      prerequisites: {
        include: {
          prerequisiteLevel: {
            select: {
              id: true,
              title: true,
              order: true,
              isActive: true,
            },
          },
        },
      },
      dependentLevels: {
        include: {
          level: {
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
        },
      },
      _count: {
        select: { modules: true },
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

  return level as LevelWithPrerequisites;
};

/**
 * Check if a level can be safely deleted
 *
 * DELETION RULES:
 * 1. Cannot delete if level is prerequisite for other ACTIVE levels
 * 2. Cannot hard-delete if students have progress (soft delete only)
 *
 * @param levelId - Level ID to check
 * @returns Object with canDelete status and reason if blocked
 */
export const canDeleteLevel = async (levelId: string): Promise<CanDeleteResult> => {
  // 1. Check if level is prerequisite for other active levels
  const dependentLevels = await prisma.levelPrerequisite.findMany({
    where: {
      prerequisiteLevelId: levelId,
      level: { isActive: true },
    },
    include: {
      level: {
        select: { title: true },
      },
    },
  });

  if (dependentLevels.length > 0) {
    return {
      canDelete: false,
      reason: 'Este nivel es prerequisito de otros niveles activos',
      dependentLevels: dependentLevels.map((d) => d.level.title),
    };
  }

  // 2. Check for student progress in this level's modules
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      modules: {
        select: { id: true },
      },
    },
  });

  if (level && level.modules.length > 0) {
    const moduleIds = level.modules.map((m) => m.id);
    const progressCount = await prisma.learningProgress.count({
      where: {
        moduleId: { in: moduleIds },
      },
    });

    if (progressCount > 0) {
      return {
        canDelete: false,
        reason: 'Hay estudiantes con progreso en este nivel. Use desactivación en lugar de eliminación.',
        hasStudentProgress: true,
      };
    }
  }

  return { canDelete: true };
};

/**
 * Get all prerequisites for a level (flat list)
 *
 * @param levelId - Level ID
 * @returns Array of prerequisite level info
 */
export const getLevelPrerequisites = async (levelId: string) => {
  const prerequisites = await prisma.levelPrerequisite.findMany({
    where: { levelId },
    include: {
      prerequisiteLevel: {
        select: {
          id: true,
          title: true,
          order: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      prerequisiteLevel: {
        order: 'asc',
      },
    },
  });

  return prerequisites.map((p) => p.prerequisiteLevel);
};

/**
 * Get all levels that depend on this level (reverse lookup)
 *
 * @param levelId - Level ID
 * @returns Array of dependent level info
 */
export const getDependentLevels = async (levelId: string) => {
  const dependents = await prisma.levelPrerequisite.findMany({
    where: { prerequisiteLevelId: levelId },
    include: {
      level: {
        select: {
          id: true,
          title: true,
          order: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      level: {
        order: 'asc',
      },
    },
  });

  return dependents.map((d) => d.level);
};

export default {
  addLevelPrerequisite,
  removeLevelPrerequisite,
  getLevelWithPrerequisites,
  canDeleteLevel,
  hasCircularDependency,
  getLevelPrerequisites,
  getDependentLevels,
};
