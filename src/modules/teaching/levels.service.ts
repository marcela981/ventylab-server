/**
 * Level Service
 * Business logic for level-related operations
 * Handles CRUD operations for curriculum levels
 *
 * DESIGN DECISIONS:
 * - Levels are soft-deleted (isActive = false) to preserve student progress
 * - Order conflicts are validated to ensure consistent ordering
 * - Deletion checks for associated modules and student progress
 * - Deletion checks for prerequisite dependencies (cannot delete if other levels depend on it)
 * - All mutations are logged to the audit trail (fail-soft)
 *
 * PREREQUISITE INTEGRATION:
 * - deleteLevel checks if level is prerequisite for other active levels
 * - Use canDeleteLevel() from levelPrerequisites service for validation
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import { HTTP_STATUS, ERROR_CODES, PAGINATION } from '../../config/constants';
import { getColorForDifficulty } from '../../config/levelColors';
import { logChange, getDiff } from './changelog.service';
import { canDeleteLevel as canDeleteLevelPrereq } from './levelPrerequisites.service';
import { DEFAULT_LEVEL_TRACK, type LevelTrackId } from '../../config/levelTrack';

// ============================================
// Type Definitions
// ============================================

interface GetAllLevelsParams {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

interface GetAllLevelsResult {
  levels: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateLevelData {
  title: string;
  /** @default mecanica */
  track?: LevelTrackId;
  description?: string;
  order?: number;
}

interface UpdateLevelData {
  title?: string;
  track?: LevelTrackId;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================
// Service Functions
// ============================================

/**
 * Get all levels with pagination
 *
 * @param params - Filter and pagination parameters
 * @returns Levels with pagination metadata
 */
export const getAllLevels = async (
  params: GetAllLevelsParams
): Promise<GetAllLevelsResult> => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      includeInactive = false,
    } = params;

    const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const [levelsRaw, total] = await Promise.all([
      prisma.level.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              modules: true,
            },
          },
          modules: {
            take: 1,
            orderBy: { order: 'asc' },
            select: { difficulty: true },
          },
        },
      }),
      prisma.level.count({ where }),
    ]);

    const levels = levelsRaw.map((level) => {
      const firstModule = level.modules?.[0];
      const difficulty = firstModule?.difficulty ?? null;
      const color = getColorForDifficulty(difficulty);
      const { modules: _modules, ...levelRest } = level;
      return { ...levelRest, color };
    });

    return {
      levels,
      pagination: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  } catch (error) {
    console.error('Error in getAllLevels:', error);
    throw new AppError(
      'Error al obtener los niveles',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// ── Slug mapping: DB level IDs → frontend-compatible keys ───────────────────
// DB uses 'level-beginner', frontend uses 'beginner'. This map normalises them.
const LEVEL_SLUG_MAP: Record<string, string> = {
  // mecanica
  'level-prerequisitos':   'prerequisitos',
  'level-beginner':        'beginner',
  'level-intermedio':      'intermediate',
  'level-avanzado':        'advanced',
  // ventylab — keep DB ids as slugs (already unique with ventylab- prefix)
  'ventylab-principiante': 'ventylab-principiante',
  'ventylab-intermedio':   'ventylab-intermedio',
  'ventylab-avanzado':     'ventylab-avanzado',
};

// Hardcoded emojis for each level slug (DB has no emoji column).
const LEVEL_EMOJIS: Record<string, string> = {
  prerequisitos:          '🔬',
  beginner:               '🌱',
  intermediate:           '⚡',
  advanced:               '🎯',
  'ventylab-principiante': '💡',
  'ventylab-intermedio':   '🖥️',
  'ventylab-avanzado':     '🚀',
};

export interface LevelCurriculumModule {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimatedTime: number | null;
  order: number;
  progressPercentage: number;  // 0–100 from UserProgress (0 if no record)
  isCompleted: boolean;
  lessonCount: number;
}

export interface LevelCurriculumItem {
  id: string;         // slug ('beginner') — frontend-compatible key for LevelStepper
  dbId: string;       // actual DB Level.id ('level-beginner')
  track: string;
  title: string;
  description: string | null;
  color: string;
  emoji: string;
  order: number;
  modules: LevelCurriculumModule[];
  totalModules: number;
  completedModules: number;
  progressPercentage: number; // strict average: sum(module.pct) / totalModules
  isCompleted: boolean;       // true when ALL modules are COMPLETED
  isUnlocked: boolean;        // true when all prerequisite levels are completed (or no prerequisites)
}

/**
 * Get all active levels with their modules and user progress.
 * Uses DB Module.levelId grouping — the totalModules count is the source of truth.
 * progressPercentage = strict average of UserProgress.progressPercentage for the level.
 *
 * GET /api/levels/curriculum?track=mecanica|ventylab
 */
export const getLevelsCurriculum = async (
  userId?: string,
  track?: LevelTrackId
): Promise<LevelCurriculumItem[]> => {
  try {
    const levelsWithModules = await prisma.level.findMany({
      where: { isActive: true, ...(track ? { track } : {}) },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedTime: true,
            order: true,
            _count: { select: { lessons: { where: { isActive: true } } } },
          },
        },
      },
    });

    const allLevelIds = levelsWithModules.map(l => l.id);
    const allModuleIds = levelsWithModules.flatMap(l => l.modules.map(m => m.id));

    // Fetch UserProgress and LevelPrerequisites in parallel
    const [progressRecords, prereqRecords] = await Promise.all([
      userId && allModuleIds.length > 0
        ? prisma.userProgress.findMany({
            where: { userId, moduleId: { in: allModuleIds } },
            select: { moduleId: true, progressPercentage: true, status: true },
          })
        : Promise.resolve([]),
      prisma.levelPrerequisite.findMany({
        where: { levelId: { in: allLevelIds } },
        select: { levelId: true, prerequisiteLevelId: true },
      }),
    ]);

    // moduleId → { progressPercentage, isCompleted }
    const progressMap = new Map<string, number>();
    const moduleCompletedMap = new Map<string, boolean>();
    for (const r of progressRecords) {
      progressMap.set(r.moduleId, r.progressPercentage);
      moduleCompletedMap.set(r.moduleId, r.status === 'COMPLETED');
    }

    // levelId → prerequisiteLevelIds[]
    const prereqsByLevel = new Map<string, string[]>();
    for (const p of prereqRecords) {
      const existing = prereqsByLevel.get(p.levelId) ?? [];
      existing.push(p.prerequisiteLevelId);
      prereqsByLevel.set(p.levelId, existing);
    }

    // levelId → moduleIds[] (for completion checks)
    const levelModuleIds = new Map<string, string[]>();
    for (const level of levelsWithModules) {
      levelModuleIds.set(level.id, level.modules.map(m => m.id));
    }

    // A level is "completed" when ALL its modules are COMPLETED
    const isLevelCompleted = (levelId: string): boolean => {
      const mIds = levelModuleIds.get(levelId) ?? [];
      if (mIds.length === 0) return false;
      return mIds.every(mId => moduleCompletedMap.get(mId) === true);
    };

    // A level is "unlocked" when it has no prerequisites OR all prerequisites are completed
    const isLevelUnlocked = (levelId: string): boolean => {
      const prereqs = prereqsByLevel.get(levelId) ?? [];
      if (prereqs.length === 0) return true;
      return prereqs.every(prereqId => isLevelCompleted(prereqId));
    };

    return levelsWithModules.map(level => {
      const slug = LEVEL_SLUG_MAP[level.id] ?? level.id.replace(/^level-/, '');
      const color = getColorForDifficulty(slug);
      const emoji = LEVEL_EMOJIS[slug] ?? '📚';

      const modules: LevelCurriculumModule[] = level.modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        difficulty: mod.difficulty,
        estimatedTime: mod.estimatedTime,
        order: mod.order,
        progressPercentage: progressMap.get(mod.id) ?? 0,
        isCompleted: moduleCompletedMap.get(mod.id) ?? false,
        lessonCount: (mod as any)._count?.lessons ?? 0,
      }));

      const totalModules = modules.length;
      const completedModules = modules.filter(m => m.isCompleted).length;
      const progressPercentage = totalModules > 0
        ? Math.round(modules.reduce((sum, m) => sum + m.progressPercentage, 0) / totalModules)
        : 0;
      const levelCompleted = isLevelCompleted(level.id);

      return {
        id: slug,
        dbId: level.id,
        track: level.track,
        title: level.title,
        description: level.description,
        color,
        emoji,
        order: level.order,
        modules,
        totalModules,
        completedModules,
        progressPercentage,
        isCompleted: levelCompleted,
        isUnlocked: isLevelUnlocked(level.id),
      };
    });
  } catch (error) {
    console.error('Error in getLevelsCurriculum:', error);
    throw new AppError(
      'Error al obtener el currículo de niveles',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get a single level by ID
 *
 * @param levelId - Level ID
 * @returns Level with modules
 */
export const getLevelById = async (levelId: string): Promise<any> => {
  try {
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedTime: true,
            order: true,
            thumbnail: true,
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    if (!level) {
      throw new AppError(
        'Nivel no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel solicitado no existe o ha sido eliminado']
      );
    }

    const firstModule = level.modules?.[0];
    const color = getColorForDifficulty(firstModule?.difficulty ?? null);
    return { ...level, color };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getLevelById:', error);
    throw new AppError(
      'Error al obtener el nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Create a new level
 *
 * @param data - Level creation data
 * @param userId - ID of the user creating the level (for audit trail)
 * @returns Created level
 */
export const createLevel = async (
  data: CreateLevelData,
  userId?: string
): Promise<any> => {
  try {
    const { title, description, order, track: trackInput } = data;
    const track = trackInput ?? DEFAULT_LEVEL_TRACK;

    // Validate that no level with same title exists
    const existingLevel = await prisma.level.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive',
        },
      },
    });

    if (existingLevel) {
      throw new AppError(
        'Ya existe un nivel con este título',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DUPLICATE_LEVEL_TITLE,
        true,
        ['Por favor, elige un título diferente para el nivel']
      );
    }

    // If order is specified, check for conflicts
    if (order !== undefined) {
      const conflictingLevel = await prisma.level.findFirst({
        where: { order },
      });

      if (conflictingLevel) {
        throw new AppError(
          'Ya existe un nivel con ese orden',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_ORDER,
          true,
          [`El nivel "${conflictingLevel.title}" ya tiene el orden ${order}`]
        );
      }
    }

    // Determine order if not specified
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrder = await prisma.level.aggregate({
        _max: { order: true },
      });
      finalOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const level = await prisma.level.create({
      data: {
        title,
        track,
        description,
        order: finalOrder,
        // Audit fields
        lastModifiedBy: userId,
        lastModifiedAt: userId ? new Date() : undefined,
      },
      include: {
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    // Log the change (fail-soft - won't block if logging fails)
    if (userId) {
      await logChange({
        entityType: 'Level',
        entityId: level.id,
        action: 'create',
        changedBy: userId,
      });
    }

    return level;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in createLevel:', error);
    throw new AppError(
      'Error al crear el nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update an existing level
 *
 * @param levelId - Level ID
 * @param data - Update data
 * @param userId - ID of the user making the update (for audit trail)
 * @returns Updated level
 */
export const updateLevel = async (
  levelId: string,
  data: UpdateLevelData,
  userId?: string
): Promise<any> => {
  try {
    // Validate level exists and get current state for diff
    const existingLevel = await prisma.level.findUnique({
      where: { id: levelId },
    });

    if (!existingLevel) {
      throw new AppError(
        'Nivel no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel que intentas actualizar no existe']
      );
    }

    // If updating title, check for duplicates
    if (data.title && data.title !== existingLevel.title) {
      const duplicateTitle = await prisma.level.findFirst({
        where: {
          title: {
            equals: data.title,
            mode: 'insensitive',
          },
          id: { not: levelId },
        },
      });

      if (duplicateTitle) {
        throw new AppError(
          'Ya existe un nivel con este título',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_LEVEL_TITLE,
          true,
          ['Por favor, elige un título diferente para el nivel']
        );
      }
    }

    // If updating order, check for conflicts
    if (data.order !== undefined && data.order !== existingLevel.order) {
      const conflictingLevel = await prisma.level.findFirst({
        where: {
          order: data.order,
          id: { not: levelId },
        },
      });

      if (conflictingLevel) {
        throw new AppError(
          'Ya existe un nivel con ese orden',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_ORDER,
          true,
          [`El nivel "${conflictingLevel.title}" ya tiene el orden ${data.order}`]
        );
      }
    }

    const updatedLevel = await prisma.level.update({
      where: { id: levelId },
      data: {
        ...data,
        // Audit fields
        lastModifiedBy: userId,
        lastModifiedAt: userId ? new Date() : undefined,
      },
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
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    // Calculate and log diff (fail-soft)
    if (userId) {
      const diff = getDiff(existingLevel, updatedLevel, [
        'title',
        'description',
        'order',
        'isActive',
      ]);
      await logChange({
        entityType: 'Level',
        entityId: levelId,
        action: 'update',
        changedBy: userId,
        diff,
      });
    }

    return updatedLevel;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in updateLevel:', error);
    throw new AppError(
      'Error al actualizar el nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete a level (soft delete)
 *
 * DATA SAFETY:
 * - Prevents deletion if the level has active modules
 * - Prevents deletion if level is prerequisite for other active levels
 * - Performs soft delete (isActive = false) to preserve references
 * - Student progress is NOT affected by soft deletion
 *
 * @param levelId - Level ID
 * @param forceDeactivate - If true, deactivates level even with modules
 * @param userId - ID of the user making the deletion (for audit trail)
 * @returns Confirmation message
 */
export const deleteLevel = async (
  levelId: string,
  forceDeactivate: boolean = false,
  userId?: string
): Promise<string> => {
  try {
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        modules: {
          where: { isActive: true },
        },
      },
    });

    if (!level) {
      throw new AppError(
        'Nivel no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel que intentas eliminar no existe']
      );
    }

    // Check if level is prerequisite for other active levels
    // This check CANNOT be bypassed with forceDeactivate to protect student progress
    const prereqCheck = await canDeleteLevelPrereq(levelId);
    if (!prereqCheck.canDelete && prereqCheck.dependentLevels) {
      throw new AppError(
        'No se puede eliminar un nivel que es prerequisito de otros niveles',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_IS_PREREQUISITE,
        true,
        [
          prereqCheck.reason || 'Este nivel es prerequisito de otros niveles activos',
          `Niveles dependientes: ${prereqCheck.dependentLevels.join(', ')}`,
          'Elimina los prerequisitos de esos niveles primero',
        ]
      );
    }

    // Warn about student progress but don't block (soft delete preserves progress)
    if (!prereqCheck.canDelete && prereqCheck.hasStudentProgress && !forceDeactivate) {
      throw new AppError(
        'Este nivel tiene progreso de estudiantes',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_HAS_STUDENT_PROGRESS,
        true,
        [
          'Hay estudiantes con progreso en este nivel',
          'Usa forceDeactivate=true para desactivar de todas formas',
          'El progreso de los estudiantes se preservará',
        ]
      );
    }

    // Check if level has active modules
    if (level.modules.length > 0 && !forceDeactivate) {
      throw new AppError(
        'No se puede eliminar un nivel con módulos activos',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_HAS_MODULES,
        true,
        [
          `Este nivel tiene ${level.modules.length} módulos activos asociados`,
          'Elimina o desactiva los módulos primero, o usa forceDeactivate=true',
        ]
      );
    }

    // Soft delete by setting isActive to false
    await prisma.level.update({
      where: { id: levelId },
      data: {
        isActive: false,
        // Audit fields
        lastModifiedBy: userId,
        lastModifiedAt: userId ? new Date() : undefined,
      },
    });

    // Log the deletion (fail-soft)
    if (userId) {
      await logChange({
        entityType: 'Level',
        entityId: levelId,
        action: 'delete',
        changedBy: userId,
        diff: { isActive: { before: true, after: false } },
      });
    }

    return `Nivel "${level.title}" desactivado exitosamente`;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in deleteLevel:', error);
    throw new AppError(
      'Error al eliminar el nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get all modules for a level
 *
 * @param levelId - Level ID
 * @param includeInactive - Whether to include inactive modules
 * @returns Array of modules
 */
export const getLevelModules = async (
  levelId: string,
  includeInactive: boolean = false
): Promise<any[]> => {
  try {
    // Validate level exists
    const level = await prisma.level.findUnique({
      where: { id: levelId },
    });

    if (!level) {
      throw new AppError(
        'Nivel no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['El nivel especificado no existe']
      );
    }

    const where: any = { levelId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const modules = await prisma.module.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return modules.map((m) => ({
      ...m,
      levelColor: getColorForDifficulty(m.difficulty),
    }));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getLevelModules:', error);
    throw new AppError(
      'Error al obtener los módulos del nivel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Reorder levels
 * Updates the order of multiple levels in a single transaction
 *
 * @param levelIds - Array of level IDs in the desired order
 * @param userId - ID of the user making the reorder (for audit trail)
 * @returns Updated levels
 */
export const reorderLevels = async (
  levelIds: string[],
  userId?: string
): Promise<any[]> => {
  try {
    // Validate all levels exist and capture current order for diff
    const existingLevels = await prisma.level.findMany({
      where: { id: { in: levelIds } },
    });

    if (existingLevels.length !== levelIds.length) {
      throw new AppError(
        'Uno o más niveles no existen',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LEVEL_NOT_FOUND,
        true,
        ['Verifica que todos los IDs de niveles sean válidos']
      );
    }

    // Capture old order for diff
    const oldOrder = existingLevels.reduce((acc, level) => {
      acc[level.id] = level.order;
      return acc;
    }, {} as Record<string, number>);

    // Update order in a transaction
    const now = new Date();
    const updatePromises = levelIds.map((id, index) =>
      prisma.level.update({
        where: { id },
        data: {
          order: index,
          // Audit fields
          lastModifiedBy: userId,
          lastModifiedAt: userId ? now : undefined,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    // Log the reorder operation (fail-soft)
    if (userId) {
      const newOrder = levelIds.reduce((acc, id, index) => {
        acc[id] = index;
        return acc;
      }, {} as Record<string, number>);

      await logChange({
        entityType: 'Level',
        entityId: 'bulk-reorder',
        action: 'reorder',
        changedBy: userId,
        diff: {
          order: {
            before: oldOrder,
            after: newOrder,
          },
        },
      });
    }

    // Return updated levels with color
    const reordered = await prisma.level.findMany({
      where: { id: { in: levelIds } },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { modules: true },
        },
        modules: {
          take: 1,
          orderBy: { order: 'asc' },
          select: { difficulty: true },
        },
      },
    });
    return reordered.map((level) => {
      const difficulty = level.modules?.[0]?.difficulty ?? null;
      const { modules: _m, ...rest } = level;
      return { ...rest, color: getColorForDifficulty(difficulty) };
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in reorderLevels:', error);
    throw new AppError(
      'Error al reordenar los niveles',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};
