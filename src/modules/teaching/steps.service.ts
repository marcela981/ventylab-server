/**
 * Step (Card) Service
 * Business logic for step/card-related operations
 * Handles CRUD operations for lesson steps (cards)
 *
 * DESIGN DECISIONS:
 * - Steps are soft-deleted (isActive = false) to preserve student progress
 * - Order conflicts are validated within the same lesson
 * - Deletion checks for student progress before allowing deletion
 * - Content type is validated against allowed types
 * - All mutations are logged to the audit trail (fail-soft)
 *
 * FUTURE EXTENSIONS:
 * - Add content versioning support
 * - Add conditional display logic
 * - Add step-level progress tracking
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import { HTTP_STATUS, ERROR_CODES, PAGINATION, STEP_CONTENT_TYPES } from '../../config/constants';
import { logChange, getDiff } from './changelog.service';
import { resolveStepsWithOverrides } from './overrides.service';

// ============================================
// Type Definitions
// ============================================

interface GetAllStepsParams {
  lessonId?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

interface GetAllStepsResult {
  steps: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateStepData {
  lessonId: string;
  title?: string;
  content: string;
  contentType?: string;
  order?: number;
}

interface UpdateStepData {
  title?: string;
  content?: string;
  contentType?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate content type against allowed types
 */
const validateContentType = (contentType: string): boolean => {
  return Object.values(STEP_CONTENT_TYPES).includes(contentType as any);
};

// ============================================
// Service Functions
// ============================================

/**
 * Get all steps with pagination and optional lesson filter
 *
 * @param params - Filter and pagination parameters
 * @returns Steps with pagination metadata
 */
export const getAllSteps = async (
  params: GetAllStepsParams
): Promise<GetAllStepsResult> => {
  try {
    const {
      lessonId,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      includeInactive = false,
    } = params;

    const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    const where: any = {};
    if (lessonId) {
      where.lessonId = lessonId;
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    const [steps, total] = await Promise.all([
      prisma.step.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { order: 'asc' },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              moduleId: true,
            },
          },
        },
      }),
      prisma.step.count({ where }),
    ]);

    return {
      steps,
      pagination: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  } catch (error) {
    console.error('Error in getAllSteps:', error);
    throw new AppError(
      'Error al obtener los pasos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get steps by lesson ID (convenience function for route)
 *
 * Supports per-student content overrides when studentId is provided.
 * Overrides include:
 * - Field-level overrides on individual steps
 * - Hidden steps (marked with _isHiddenOverride: true)
 * - Extra injected steps (marked with _isExtraCard: true)
 *
 * PROGRESS SAFETY:
 * - Hidden steps are NOT removed; they're marked and should be filtered by client
 * - Extra steps are included in the array with _isExtraCard marker
 *
 * @param lessonId - Lesson ID
 * @param includeInactive - Whether to include inactive steps
 * @param studentId - Optional student ID to apply overrides
 * @returns Array of steps (with override markers if studentId provided)
 */
export const getStepsByLessonId = async (
  lessonId: string,
  includeInactive: boolean = false,
  studentId?: string
): Promise<any[]> => {
  try {
    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError(
        'Lección no encontrada',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LESSON_NOT_FOUND,
        true,
        ['La lección especificada no existe']
      );
    }

    // If student ID is provided, apply overrides
    // FUTURE: Add caching for override resolution in high-traffic scenarios
    if (studentId) {
      try {
        const { steps, hasOverrides } = await resolveStepsWithOverrides(lessonId, studentId);

        // Filter inactive if not requested (but keep hidden ones with marker)
        let result = includeInactive ? steps : steps.filter((s) => s.isActive);

        // Add metadata about overrides
        if (hasOverrides && result.length > 0) {
          result = result.map((step) => ({
            ...step,
            _lessonHasOverrides: hasOverrides,
          }));
        }

        return result;
      } catch (error) {
        // Fail-soft: If override resolution fails, return original steps
        console.error('[Steps] Override resolution failed (fail-soft):', error);
      }
    }

    // Default behavior: fetch steps without overrides
    const where: any = { lessonId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const steps = await prisma.step.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return steps;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getStepsByLessonId:', error);
    throw new AppError(
      'Error al obtener los pasos de la lección',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get a single step by ID
 *
 * @param stepId - Step ID
 * @returns Step with lesson info
 */
export const getStepById = async (stepId: string): Promise<any> => {
  try {
    const step = await prisma.step.findUnique({
      where: { id: stepId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
            module: {
              select: {
                id: true,
                title: true,
                levelId: true,
              },
            },
          },
        },
      },
    });

    if (!step) {
      throw new AppError(
        'Paso no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.STEP_NOT_FOUND,
        true,
        ['El paso solicitado no existe o ha sido eliminado']
      );
    }

    return step;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getStepById:', error);
    throw new AppError(
      'Error al obtener el paso',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Create a new step
 *
 * @param data - Step creation data
 * @param userId - ID of the user creating the step (for audit trail)
 * @returns Created step
 */
export const createStep = async (
  data: CreateStepData,
  userId?: string
): Promise<any> => {
  try {
    const { lessonId, title, content, contentType = STEP_CONTENT_TYPES.TEXT, order } = data;

    // Validate lesson exists and is active
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new AppError(
        'Lección no encontrada',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LESSON_NOT_FOUND,
        true,
        ['La lección especificada no existe']
      );
    }

    if (!lesson.isActive) {
      throw new AppError(
        'No se pueden agregar pasos a una lección inactiva',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.LESSON_NOT_FOUND,
        true,
        ['Activa la lección primero antes de agregar pasos']
      );
    }

    // Validate content type
    if (!validateContentType(contentType)) {
      throw new AppError(
        'Tipo de contenido inválido',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STEP_CONTENT_TYPE,
        true,
        [`Los tipos válidos son: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`]
      );
    }

    // If order is specified, check for conflicts within the same lesson
    if (order !== undefined) {
      const conflictingStep = await prisma.step.findFirst({
        where: {
          lessonId,
          order,
        },
      });

      if (conflictingStep) {
        throw new AppError(
          'Ya existe un paso con ese orden en esta lección',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_ORDER,
          true,
          [`Ya existe un paso con el orden ${order}. Usa un orden diferente o reordena los pasos.`]
        );
      }
    }

    // Determine order if not specified
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrder = await prisma.step.aggregate({
        where: { lessonId },
        _max: { order: true },
      });
      finalOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const step = await prisma.step.create({
      data: {
        lessonId,
        title,
        content,
        contentType,
        order: finalOrder,
        // Audit fields
        lastModifiedBy: userId,
        lastModifiedAt: userId ? new Date() : undefined,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    });

    // Log the change (fail-soft)
    if (userId) {
      await logChange({
        entityType: 'Step',
        entityId: step.id,
        action: 'create',
        changedBy: userId,
      });
    }

    return step;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in createStep:', error);
    throw new AppError(
      'Error al crear el paso',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update an existing step
 *
 * @param stepId - Step ID
 * @param data - Update data
 * @param userId - ID of the user making the update (for audit trail)
 * @returns Updated step
 */
export const updateStep = async (
  stepId: string,
  data: UpdateStepData,
  userId?: string
): Promise<any> => {
  try {
    // Validate step exists and get current state for diff
    const existingStep = await prisma.step.findUnique({
      where: { id: stepId },
    });

    if (!existingStep) {
      throw new AppError(
        'Paso no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.STEP_NOT_FOUND,
        true,
        ['El paso que intentas actualizar no existe']
      );
    }

    // Validate content type if being updated
    if (data.contentType && !validateContentType(data.contentType)) {
      throw new AppError(
        'Tipo de contenido inválido',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_STEP_CONTENT_TYPE,
        true,
        [`Los tipos válidos son: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`]
      );
    }

    // If updating order, check for conflicts within the same lesson
    if (data.order !== undefined && data.order !== existingStep.order) {
      const conflictingStep = await prisma.step.findFirst({
        where: {
          lessonId: existingStep.lessonId,
          order: data.order,
          id: { not: stepId },
        },
      });

      if (conflictingStep) {
        throw new AppError(
          'Ya existe un paso con ese orden en esta lección',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_ORDER,
          true,
          [`Ya existe un paso con el orden ${data.order}. Usa un orden diferente o reordena los pasos.`]
        );
      }
    }

    const updatedStep = await prisma.step.update({
      where: { id: stepId },
      data: {
        ...data,
        // Audit fields
        lastModifiedBy: userId,
        lastModifiedAt: userId ? new Date() : undefined,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    });

    // Calculate and log diff (fail-soft)
    if (userId) {
      const diff = getDiff(existingStep, updatedStep, [
        'title',
        'content',
        'contentType',
        'order',
        'isActive',
      ]);
      await logChange({
        entityType: 'Step',
        entityId: stepId,
        action: 'update',
        changedBy: userId,
        diff,
      });
    }

    return updatedStep;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in updateStep:', error);
    throw new AppError(
      'Error al actualizar el paso',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete a step (soft delete)
 *
 * DATA SAFETY:
 * - Performs soft delete (isActive = false) to preserve student progress
 * - Student progress is NOT affected by soft deletion
 *
 * @param stepId - Step ID
 * @param userId - ID of the user making the deletion (for audit trail)
 * @returns Confirmation message
 */
export const deleteStep = async (
  stepId: string,
  userId?: string
): Promise<string> => {
  try {
    const step = await prisma.step.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new AppError(
        'Paso no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.STEP_NOT_FOUND,
        true,
        ['El paso que intentas eliminar no existe']
      );
    }

    // Soft delete by setting isActive to false
    await prisma.step.update({
      where: { id: stepId },
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
        entityType: 'Step',
        entityId: stepId,
        action: 'delete',
        changedBy: userId,
        diff: { isActive: { before: true, after: false } },
      });
    }

    return `Paso "${step.title || 'Sin título'}" desactivado exitosamente`;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in deleteStep:', error);
    throw new AppError(
      'Error al eliminar el paso',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Reorder steps within a lesson
 * Updates the order of multiple steps in a single transaction
 *
 * This operation is safe for student progress - only order changes,
 * IDs and content remain the same.
 *
 * @param lessonId - Lesson ID
 * @param stepIds - Array of step IDs in the desired order
 * @param userId - ID of the user making the reorder (for audit trail)
 * @returns Updated steps
 */
export const reorderSteps = async (
  lessonId: string,
  stepIds: string[],
  userId?: string
): Promise<any[]> => {
  try {
    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError(
        'Lección no encontrada',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.LESSON_NOT_FOUND,
        true,
        ['La lección especificada no existe']
      );
    }

    // Validate all steps exist and belong to this lesson, and capture old order
    const existingSteps = await prisma.step.findMany({
      where: {
        id: { in: stepIds },
        lessonId,
      },
    });

    if (existingSteps.length !== stepIds.length) {
      throw new AppError(
        'Uno o más pasos no existen o no pertenecen a esta lección',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.STEP_NOT_FOUND,
        true,
        ['Verifica que todos los IDs de pasos sean válidos y pertenezcan a la lección']
      );
    }

    // Capture old order for diff
    const oldOrder = existingSteps.reduce((acc, step) => {
      acc[step.id] = step.order;
      return acc;
    }, {} as Record<string, number>);

    // Update order in a transaction
    const now = new Date();
    const updatePromises = stepIds.map((id, index) =>
      prisma.step.update({
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
      const newOrder = stepIds.reduce((acc, id, index) => {
        acc[id] = index;
        return acc;
      }, {} as Record<string, number>);

      await logChange({
        entityType: 'Step',
        entityId: `lesson-${lessonId}-reorder`,
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

    // Return updated steps
    return await prisma.step.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in reorderSteps:', error);
    throw new AppError(
      'Error al reordenar los pasos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get the next step in a lesson
 *
 * @param stepId - Current step ID
 * @returns Next step or null
 */
export const getNextStep = async (stepId: string): Promise<any | null> => {
  try {
    const currentStep = await prisma.step.findUnique({
      where: { id: stepId },
      select: { lessonId: true, order: true },
    });

    if (!currentStep) {
      throw new AppError(
        'Paso no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.STEP_NOT_FOUND
      );
    }

    const nextStep = await prisma.step.findFirst({
      where: {
        lessonId: currentStep.lessonId,
        order: { gt: currentStep.order },
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return nextStep;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getNextStep:', error);
    throw new AppError(
      'Error al obtener el siguiente paso',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get the previous step in a lesson
 *
 * @param stepId - Current step ID
 * @returns Previous step or null
 */
export const getPreviousStep = async (stepId: string): Promise<any | null> => {
  try {
    const currentStep = await prisma.step.findUnique({
      where: { id: stepId },
      select: { lessonId: true, order: true },
    });

    if (!currentStep) {
      throw new AppError(
        'Paso no encontrado',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.STEP_NOT_FOUND
      );
    }

    const previousStep = await prisma.step.findFirst({
      where: {
        lessonId: currentStep.lessonId,
        order: { lt: currentStep.order },
        isActive: true,
      },
      orderBy: { order: 'desc' },
    });

    return previousStep;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error in getPreviousStep:', error);
    throw new AppError(
      'Error al obtener el paso anterior',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};
