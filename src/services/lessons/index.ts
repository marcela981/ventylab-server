/**
 * Lesson Service
 * Contains all business logic for lesson management
 *
 * All mutations are logged to the audit trail (fail-soft)
 */

import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, ERROR_CODES, USER_ROLES } from '../../config/constants';
import { isPrerequisitosModule, isBeginnerModule, getBeginnerModuleOrder, getPreviousBeginnerModule } from '../../config/curriculumData';
import { logChange, getDiff } from '../changelog';
import { resolveLessonWithOverrides } from '../overrides';

/**
 * Section types that should NOT be counted as actual lesson pages.
 * These are non-content pages like intro screens, completion screens, or conditional navigation.
 */
const EXCLUDED_SECTION_TYPES = new Set([
  'intro',
  'introduction',
  'completion',
  'complete',
  'conditional',
  'navigation',
  'redirect',
  'summary', // Summary pages are typically auto-generated, not actual content
]);

/**
 * Calculates the actual page count for a lesson by counting only rendered content sections.
 * Excludes intro, completion, conditional, and other non-content sections.
 *
 * @param content - Lesson content (string JSON or parsed object)
 * @returns The count of actual content pages
 */
export const calculatePageCount = (content: any): number => {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    if (!parsed || !Array.isArray(parsed.sections)) {
      return 0;
    }

    // Count only sections that are actual content pages
    const contentPages = parsed.sections.filter((section: any) => {
      // If section has no type, it's considered a content page
      if (!section.type) {
        return true;
      }

      // Exclude sections with special types
      const sectionType = String(section.type).toLowerCase();
      return !EXCLUDED_SECTION_TYPES.has(sectionType);
    });

    return contentPages.length;
  } catch (error) {
    // If content can't be parsed, return 0
    return 0;
  }
};

/**
 * Validates that content is a valid JSON with proper lesson structure
 */
const validateLessonContent = (content: any): boolean => {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    if (!parsed.type || !parsed.sections || !Array.isArray(parsed.sections)) {
      return false;
    }

    return parsed.sections.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Validates if user has access to a lesson's module (checks prerequisites)
 * IMPORTANT: Prerequisitos modules are always accessible
 * Beginner modules use the explicit curriculum order for unlocking
 */
const validateModuleAccess = async (moduleId: string, userId: string): Promise<boolean> => {
  // Prerequisitos modules are always accessible
  if (isPrerequisitosModule(moduleId)) {
    return true;
  }

  // For beginner modules, check against curriculum order
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

  // For other modules, use database prerequisites
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

  if (!module || !module.isActive) {
    return false;
  }

  // If no prerequisites, user has access
  if (module.prerequisites.length === 0) {
    return true;
  }

  // Check if user completed all prerequisites
  // Skip prerequisitos modules in this check
  for (const prereq of module.prerequisites) {
    // Skip if prerequisite is a prerequisitos module
    if (isPrerequisitosModule(prereq.prerequisiteId)) {
      continue;
    }

    const progress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId: prereq.prerequisiteId,
        },
      },
    });

    // User must have completed the prerequisite module
    if (!progress || !progress.completedAt) {
      return false;
    }
  }

  return true;
};

/**
 * Get lesson by ID with optional user progress
 * @param lessonId - Lesson ID
 * @param userId - Optional user ID to include progress
 * @returns Lesson with module, quizzes, and optional progress
 */
export const getLessonById = async (
  lessonId: string,
  userId?: string
): Promise<any> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: true,
      quizzes: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!lesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  // Validate module is active
  if (!lesson.module.isActive) {
    throw new AppError(
      'El módulo de esta lección no está disponible',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.MODULE_INACTIVE
    );
  }

  // Calculate pageCount from lesson content
  const pageCount = calculatePageCount(lesson.content);

  // If user is provided, check access and include progress
  if (userId) {
    const hasAccess = await validateModuleAccess(lesson.moduleId, userId);

    if (!hasAccess) {
      throw new AppError(
        'No tienes acceso a esta lección. Debes completar los módulos prerequisitos primero',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.ACCESS_DENIED
      );
    }

    // Get user role to determine if overrides should be applied
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Get or create learning progress for this module
    let learningProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId: lesson.moduleId,
        },
      },
    });

    if (!learningProgress) {
      learningProgress = await prisma.learningProgress.create({
        data: {
          userId,
          moduleId: lesson.moduleId,
          timeSpent: 0,
        },
      });
    }

    // Get user progress for this lesson
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        progressId_lessonId: {
          progressId: learningProgress.id,
          lessonId,
        },
      },
    });

    // Apply content overrides for students
    // FUTURE: Add caching for override resolution in high-traffic scenarios
    if (user?.role === USER_ROLES.STUDENT) {
      try {
        const { lesson: resolvedLesson, hasOverrides } = await resolveLessonWithOverrides(lessonId, userId);
        const resolvedPageCount = calculatePageCount(resolvedLesson.content);
        return {
          ...resolvedLesson,
          pageCount: resolvedPageCount,
          progress: progress || undefined,
          _hasOverrides: hasOverrides,
        };
      } catch (error) {
        // Fail-soft: If override resolution fails, return original lesson
        console.error('[Lessons] Override resolution failed (fail-soft):', error);
        return { ...lesson, pageCount, progress: progress || undefined };
      }
    }

    return { ...lesson, pageCount, progress: progress || undefined };
  }

  return { ...lesson, pageCount };
};

/**
 * Get next lesson in the same module
 * @param lessonId - Current lesson ID
 * @returns Next lesson or null if there isn't one
 */
export const getNextLesson = async (lessonId: string): Promise<any | null> => {
  const currentLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, order: true },
  });

  if (!currentLesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  const nextLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: currentLesson.moduleId,
      order: { gt: currentLesson.order },
    },
    orderBy: { order: 'asc' },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!nextLesson) {
    return null;
  }

  // Add pageCount to the returned lesson
  return {
    ...nextLesson,
    pageCount: calculatePageCount(nextLesson.content),
  };
};

/**
 * Get previous lesson in the same module
 * @param lessonId - Current lesson ID
 * @returns Previous lesson or null if there isn't one
 */
export const getPreviousLesson = async (lessonId: string): Promise<any | null> => {
  const currentLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, order: true },
  });

  if (!currentLesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  const previousLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: currentLesson.moduleId,
      order: { lt: currentLesson.order },
    },
    orderBy: { order: 'desc' },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!previousLesson) {
    return null;
  }

  // Add pageCount to the returned lesson
  return {
    ...previousLesson,
    pageCount: calculatePageCount(previousLesson.content),
  };
};

/**
 * Create a new lesson
 * @param data - Lesson creation data
 * @param userId - ID of the user creating the lesson (for audit trail)
 * @returns Created lesson
 */
export const createLesson = async (
  data: {
    moduleId: string;
    title: string;
    content: any;
    order?: number;
    estimatedTime?: number;
    aiGenerated?: boolean;
    sourcePrompt?: string;
  },
  userId?: string
): Promise<any> => {
  const { moduleId, title, content, order = 0, estimatedTime = 0, aiGenerated = false, sourcePrompt } = data;

  // Validate module exists and is active
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
  });

  if (!module) {
    throw new AppError(
      'Módulo no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.MODULE_NOT_FOUND
    );
  }

  if (!module.isActive) {
    throw new AppError(
      'No se pueden agregar lecciones a un módulo inactivo',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.MODULE_INACTIVE
    );
  }

  // Validate content structure
  if (!validateLessonContent(content)) {
    throw new AppError(
      'El contenido de la lección debe tener un campo "type" y un array "sections" con al menos un elemento',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_CONTENT_STRUCTURE
    );
  }

  // Validate order is unique within module
  const existingLesson = await prisma.lesson.findFirst({
    where: {
      moduleId,
      order,
    },
  });

  if (existingLesson) {
    throw new AppError(
      `Ya existe una lección con el orden ${order} en este módulo`,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_ORDER
    );
  }

  // Convert content to JSON string if it's an object
  const contentString = typeof content === 'string' ? content : JSON.stringify(content);

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      content: contentString,
      order,
      estimatedTime,
      aiGenerated,
      sourcePrompt,
      // Audit fields
      lastModifiedBy: userId,
      lastModifiedAt: userId ? new Date() : undefined,
    },
    include: {
      module: true,
    },
  });

  // Log the change (fail-soft)
  if (userId) {
    await logChange({
      entityType: 'Lesson',
      entityId: lesson.id,
      action: 'create',
      changedBy: userId,
    });
  }

  // Add pageCount to the returned lesson
  return {
    ...lesson,
    pageCount: calculatePageCount(lesson.content),
  };
};

/**
 * Update an existing lesson
 * @param lessonId - Lesson ID
 * @param data - Fields to update
 * @param userId - ID of the user making the update (for audit trail)
 * @returns Updated lesson
 */
export const updateLesson = async (
  lessonId: string,
  data: {
    title?: string;
    content?: any;
    order?: number;
    estimatedTime?: number;
    aiGenerated?: boolean;
    sourcePrompt?: string;
  },
  userId?: string
): Promise<any> => {
  // Get existing lesson for diff calculation
  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!existingLesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  // If updating order, check for conflicts
  if (data.order !== undefined && data.order !== existingLesson.order) {
    const conflictingLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: existingLesson.moduleId,
        order: data.order,
        id: { not: lessonId },
      },
    });

    if (conflictingLesson) {
      throw new AppError(
        `Ya existe una lección con el orden ${data.order} en este módulo`,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DUPLICATE_ORDER
      );
    }
  }

  // If updating content, validate structure
  if (data.content !== undefined) {
    if (!validateLessonContent(data.content)) {
      throw new AppError(
        'El contenido de la lección debe tener un campo "type" y un array "sections" con al menos un elemento',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_CONTENT_STRUCTURE
      );
    }
    // Convert to string if needed
    data.content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...data,
      // Audit fields
      lastModifiedBy: userId,
      lastModifiedAt: userId ? new Date() : undefined,
    },
    include: {
      module: true,
    },
  });

  // Calculate and log diff (fail-soft)
  if (userId) {
    const diff = getDiff(existingLesson, updatedLesson, [
      'title',
      'content',
      'order',
      'estimatedTime',
      'isActive',
    ]);
    await logChange({
      entityType: 'Lesson',
      entityId: lessonId,
      action: 'update',
      changedBy: userId,
      diff,
    });
  }

  // Add pageCount to the returned lesson
  return {
    ...updatedLesson,
    pageCount: calculatePageCount(updatedLesson.content),
  };
};

/**
 * Delete a lesson (soft delete for data safety)
 *
 * DATA SAFETY:
 * - Uses soft delete (isActive = false) by default to preserve student progress
 * - Checks for active steps before allowing deletion
 * - Student progress is NOT affected by soft deletion
 *
 * FUTURE EXTENSIONS:
 * - Add forceHardDelete option for admin cleanup
 * - Add checkStudentProgress option to block deletion if students have progress
 *
 * @param lessonId - Lesson ID
 * @param forceDeactivate - If true, deactivates lesson even with active steps
 * @param userId - ID of the user making the deletion (for audit trail)
 * @returns Confirmation message
 */
export const deleteLesson = async (
  lessonId: string,
  forceDeactivate: boolean = false,
  userId?: string
): Promise<{ message: string }> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      steps: {
        where: { isActive: true },
      },
    },
  });

  if (!lesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  // Check for active steps
  if (lesson.steps && lesson.steps.length > 0 && !forceDeactivate) {
    throw new AppError(
      'No se puede eliminar una lección con pasos activos',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.LESSON_HAS_STEPS,
      true,
      [
        `Esta lección tiene ${lesson.steps.length} pasos activos asociados`,
        'Elimina o desactiva los pasos primero, o usa forceDeactivate=true',
      ]
    );
  }

  // Soft delete by setting isActive to false
  await prisma.lesson.update({
    where: { id: lessonId },
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
      entityType: 'Lesson',
      entityId: lessonId,
      action: 'delete',
      changedBy: userId,
      diff: { isActive: { before: true, after: false } },
    });
  }

  return { message: `Lección "${lesson.title}" desactivada exitosamente` };
};

/**
 * Mark a lesson as completed by a user
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @param timeSpent - Time spent in minutes
 * @returns Updated progress with module completion info
 */
export const markLessonAsCompleted = async (
  userId: string,
  lessonId: string,
  timeSpent: number = 0
): Promise<{
  lessonProgress: any;
  moduleCompleted: boolean;
  moduleProgress?: any;
}> => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(
      'Usuario no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Validate lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: true,
    },
  });

  if (!lesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Get or create module learning progress
    let moduleProgress = await tx.learningProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId: lesson.moduleId,
        },
      },
    });

    if (!moduleProgress) {
      moduleProgress = await tx.learningProgress.create({
        data: {
          userId,
          moduleId: lesson.moduleId,
          timeSpent: 0,
        },
      });
    }

    // Update or create lesson progress
    const lessonProgress = await tx.lessonProgress.upsert({
      where: {
        progressId_lessonId: {
          progressId: moduleProgress.id,
          lessonId,
        },
      },
      update: {
        completed: true,
        timeSpent: {
          increment: timeSpent,
        },
        lastAccessed: new Date(),
      },
      create: {
        progressId: moduleProgress.id,
        lessonId,
        completed: true,
        timeSpent,
        lastAccessed: new Date(),
      },
    });

    // Update module progress time spent
    moduleProgress = await tx.learningProgress.update({
      where: {
        userId_moduleId: {
          userId,
          moduleId: lesson.moduleId,
        },
      },
      data: {
        timeSpent: {
          increment: timeSpent,
        },
      },
    });

    // Check if all lessons in the module are completed
    const totalLessons = await tx.lesson.count({
      where: { moduleId: lesson.moduleId },
    });

    const completedLessons = await tx.lessonProgress.count({
      where: {
        progressId: moduleProgress.id,
        completed: true,
      },
    });

    const moduleCompleted = completedLessons === totalLessons;

    // If module is completed, update learning progress
    if (moduleCompleted && !moduleProgress.completedAt) {
      moduleProgress = await tx.learningProgress.update({
        where: {
          userId_moduleId: {
            userId,
            moduleId: lesson.moduleId,
          },
        },
        data: {
          completedAt: new Date(),
        },
      });
    }

    return {
      lessonProgress,
      moduleCompleted,
      moduleProgress,
    };
  });

  return result;
};

/**
 * Record lesson access without marking as completed
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @returns Updated or created lesson progress
 */
export const recordLessonAccess = async (
  userId: string,
  lessonId: string
): Promise<any> => {
  // Get the lesson to find its module
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true },
  });

  if (!lesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  // Get or create learning progress for the module
  let learningProgress = await prisma.learningProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: lesson.moduleId,
      },
    },
  });

  if (!learningProgress) {
    learningProgress = await prisma.learningProgress.create({
      data: {
        userId,
        moduleId: lesson.moduleId,
        timeSpent: 0,
      },
    });
  }

  // Update or create lesson progress
  const lessonProgress = await prisma.lessonProgress.upsert({
    where: {
      progressId_lessonId: {
        progressId: learningProgress.id,
        lessonId,
      },
    },
    update: {
      lastAccessed: new Date(),
    },
    create: {
      progressId: learningProgress.id,
      lessonId,
      completed: false,
      timeSpent: 0,
      lastAccessed: new Date(),
    },
  });

  return lessonProgress;
};

