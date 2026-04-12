/**
 * Content Override Service
 *
 * Provides centralized logic for:
 * - CRUD operations on content overrides
 * - Content resolution (merging global + overrides)
 * - Permission verification
 *
 * DESIGN DECISIONS:
 * - Resolution is lazy (on-demand) not eager (pre-computed)
 * - Caching is recommended at the API layer, not here
 * - Progress safety is enforced in resolution, not storage
 *
 * ACCESS RULES:
 * - Teachers: Can create overrides ONLY for their assigned students
 * - Admin & Superuser: Can create overrides for any student
 * - Students: Cannot see or modify overrides
 *
 * FUTURE EXTENSIONS:
 * - Add caching layer with Redis for high-traffic scenarios
 * - Add batch resolution for dashboard views
 * - Add override inheritance (group -> student)
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import {
  HTTP_STATUS,
  ERROR_CODES,
  USER_ROLES,
  OVERRIDE_ENTITY_TYPES,
  type OverrideEntityType,
} from '../../config/constants';
import { isStudentAssignedToTeacher } from './teacherStudent.service';
import { logChange, getDiff } from './changelog.service';
import type {
  CreateOverrideInput,
  UpdateOverrideInput,
  GetOverridesOptions,
  OverrideData,
  FieldOverrides,
  ExtraCard,
  ResolvedStep,
  ResolvedStepsResult,
  ResolvedLessonResult,
  ContentOverrideResponse,
} from '../../shared/types/override.types';

// ============================================
// Permission Helpers
// ============================================

/**
 * Verify that a user can create/modify overrides for a student
 *
 * Rules:
 * - ADMIN/SUPERUSER: Can manage overrides for any student
 * - TEACHER: Can only manage overrides for their assigned students
 * - STUDENT: Cannot manage overrides
 *
 * @param userId - ID of the user attempting the action
 * @param userRole - Role of the user
 * @param studentId - ID of the student the override is for
 * @returns true if user can manage overrides for this student
 */
export async function canManageOverridesFor(
  userId: string,
  userRole: string,
  studentId: string
): Promise<boolean> {
  // Admins and superusers can manage any student
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPERUSER) {
    return true;
  }

  // Teachers can only manage assigned students
  if (userRole === USER_ROLES.TEACHER) {
    return await isStudentAssignedToTeacher(userId, studentId);
  }

  // Students cannot manage overrides
  return false;
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Verify that the target entity exists
 */
async function verifyEntityExists(
  entityType: OverrideEntityType,
  entityId: string
): Promise<void> {
  let exists = false;

  switch (entityType) {
    case OVERRIDE_ENTITY_TYPES.LEVEL:
      exists = !!(await prisma.level.findUnique({ where: { id: entityId } }));
      break;
    case OVERRIDE_ENTITY_TYPES.LESSON:
      exists = !!(await prisma.lesson.findUnique({ where: { id: entityId } }));
      break;
    case OVERRIDE_ENTITY_TYPES.CARD:
      exists = !!(await prisma.step.findUnique({ where: { id: entityId } }));
      break;
  }

  if (!exists) {
    throw new AppError(
      `Entidad ${entityType} no encontrada con ID: ${entityId}`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }
}

/**
 * Validate override data structure based on entity type
 */
function validateOverrideData(
  entityType: OverrideEntityType,
  data: OverrideData
): void {
  // extraCards and hiddenCardIds are only valid for LESSON type
  if (entityType !== OVERRIDE_ENTITY_TYPES.LESSON) {
    if (data.extraCards && data.extraCards.length > 0) {
      throw new AppError(
        'extraCards solo es válido para overrides de tipo LESSON',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_OVERRIDE_DATA
      );
    }
    if (data.hiddenCardIds && data.hiddenCardIds.length > 0) {
      throw new AppError(
        'hiddenCardIds solo es válido para overrides de tipo LESSON',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_OVERRIDE_DATA
      );
    }
  }

  // Validate extraCards structure
  if (data.extraCards) {
    for (const card of data.extraCards) {
      if (!card.id || !card.content || !card.contentType) {
        throw new AppError(
          'Cada extraCard debe tener id, content y contentType',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.INVALID_OVERRIDE_DATA
        );
      }
      if (typeof card.insertAfterOrder !== 'number') {
        throw new AppError(
          'Cada extraCard debe tener insertAfterOrder como número',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.INVALID_OVERRIDE_DATA
        );
      }
    }
  }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new content override
 *
 * @param input - Override creation input
 * @param creatorId - ID of the user creating the override
 * @param creatorRole - Role of the user creating the override
 * @returns Created override with relations
 */
export async function createOverride(
  input: CreateOverrideInput,
  creatorId: string,
  creatorRole: string
): Promise<ContentOverrideResponse> {
  const { studentId, entityType, entityId, overrideData } = input;

  // Verify permission
  const canManage = await canManageOverridesFor(creatorId, creatorRole, studentId);
  if (!canManage) {
    throw new AppError(
      'No tienes permiso para crear overrides para este estudiante',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.CANNOT_MANAGE_OVERRIDE
    );
  }

  // Verify student exists and is a student
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!student) {
    throw new AppError(
      'Estudiante no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.STUDENT_NOT_FOUND
    );
  }

  if (student.role !== USER_ROLES.STUDENT) {
    throw new AppError(
      'El usuario especificado no es un estudiante',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_STUDENT_ROLE
    );
  }

  // Verify target entity exists
  await verifyEntityExists(entityType as OverrideEntityType, entityId);

  // Validate override data
  validateOverrideData(entityType as OverrideEntityType, overrideData);

  // Check for existing override
  const existing = await prisma.contentOverride.findUnique({
    where: {
      override_student_entity_unique: {
        studentId,
        entityType: entityType as any,
        entityId,
      },
    },
  });

  if (existing) {
    throw new AppError(
      'Ya existe un override para esta combinación de estudiante y entidad',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.OVERRIDE_EXISTS
    );
  }

  const override = await prisma.contentOverride.create({
    data: {
      studentId,
      entityType: entityType as any,
      entityId,
      overrideData: overrideData as any, // Cast to JSON-compatible type
      createdBy: creatorId,
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log the change (fail-soft)
  await logChange({
    entityType: 'ContentOverride' as any,
    entityId: override.id,
    action: 'create',
    changedBy: creatorId,
    metadata: { studentId, targetEntityType: entityType, targetEntityId: entityId },
  });

  return {
    id: override.id,
    studentId: override.studentId,
    entityType: override.entityType as OverrideEntityType,
    entityId: override.entityId,
    overrideData: override.overrideData as OverrideData,
    createdBy: override.createdBy,
    createdAt: override.createdAt,
    updatedAt: override.updatedAt,
    isActive: override.isActive,
    student: (override as any).student,
    creator: (override as any).creator,
  };
}

/**
 * Update an existing override
 *
 * @param overrideId - ID of the override to update
 * @param input - Update input
 * @param userId - ID of the user making the update
 * @param userRole - Role of the user
 * @returns Updated override with relations
 */
export async function updateOverride(
  overrideId: string,
  input: UpdateOverrideInput,
  userId: string,
  userRole: string
): Promise<ContentOverrideResponse> {
  const existing = await prisma.contentOverride.findUnique({
    where: { id: overrideId },
  });

  if (!existing) {
    throw new AppError(
      'Override no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.OVERRIDE_NOT_FOUND
    );
  }

  // Verify permission
  const canManage = await canManageOverridesFor(userId, userRole, existing.studentId);
  if (!canManage) {
    throw new AppError(
      'No tienes permiso para modificar este override',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.CANNOT_MANAGE_OVERRIDE
    );
  }

  // Validate override data if provided
  if (input.overrideData) {
    validateOverrideData(existing.entityType as OverrideEntityType, input.overrideData);
  }

  const updated = await prisma.contentOverride.update({
    where: { id: overrideId },
    data: {
      ...(input.overrideData && { overrideData: input.overrideData as any }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log the change
  const diff = getDiff(existing as any, updated as any, ['overrideData', 'isActive']);
  await logChange({
    entityType: 'ContentOverride' as any,
    entityId: overrideId,
    action: 'update',
    changedBy: userId,
    diff,
  });

  return {
    id: updated.id,
    studentId: updated.studentId,
    entityType: updated.entityType as OverrideEntityType,
    entityId: updated.entityId,
    overrideData: updated.overrideData as OverrideData,
    createdBy: updated.createdBy,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    isActive: updated.isActive,
    student: (updated as any).student,
    creator: (updated as any).creator,
  };
}

/**
 * Delete (soft delete) an override
 *
 * @param overrideId - ID of the override to delete
 * @param userId - ID of the user making the deletion
 * @param userRole - Role of the user
 */
export async function deleteOverride(
  overrideId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const existing = await prisma.contentOverride.findUnique({
    where: { id: overrideId },
  });

  if (!existing) {
    throw new AppError(
      'Override no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.OVERRIDE_NOT_FOUND
    );
  }

  // Verify permission
  const canManage = await canManageOverridesFor(userId, userRole, existing.studentId);
  if (!canManage) {
    throw new AppError(
      'No tienes permiso para eliminar este override',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.CANNOT_MANAGE_OVERRIDE
    );
  }

  // Soft delete
  await prisma.contentOverride.update({
    where: { id: overrideId },
    data: { isActive: false },
  });

  // Log deletion
  await logChange({
    entityType: 'ContentOverride' as any,
    entityId: overrideId,
    action: 'delete',
    changedBy: userId,
    diff: { isActive: { before: true, after: false } },
  });
}

/**
 * Get a single override by ID
 *
 * @param overrideId - ID of the override
 * @param userId - ID of the user requesting
 * @param userRole - Role of the user
 * @returns Override with relations
 */
export async function getOverrideById(
  overrideId: string,
  userId: string,
  userRole: string
): Promise<ContentOverrideResponse> {
  const override = await prisma.contentOverride.findUnique({
    where: { id: overrideId },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!override) {
    throw new AppError(
      'Override no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.OVERRIDE_NOT_FOUND
    );
  }

  // Verify permission
  const canManage = await canManageOverridesFor(userId, userRole, override.studentId);
  if (!canManage) {
    throw new AppError(
      'No tienes permiso para ver este override',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.CANNOT_MANAGE_OVERRIDE
    );
  }

  return {
    id: override.id,
    studentId: override.studentId,
    entityType: override.entityType as OverrideEntityType,
    entityId: override.entityId,
    overrideData: override.overrideData as OverrideData,
    createdBy: override.createdBy,
    createdAt: override.createdAt,
    updatedAt: override.updatedAt,
    isActive: override.isActive,
    student: (override as any).student,
    creator: (override as any).creator,
  };
}

/**
 * Get overrides for a student (teacher/admin view)
 *
 * @param studentId - ID of the student
 * @param userId - ID of the user requesting
 * @param userRole - Role of the user
 * @param options - Query options
 * @returns Array of overrides
 */
export async function getOverridesForStudent(
  studentId: string,
  userId: string,
  userRole: string,
  options?: GetOverridesOptions
): Promise<ContentOverrideResponse[]> {
  // Verify permission
  const canManage = await canManageOverridesFor(userId, userRole, studentId);
  if (!canManage) {
    throw new AppError(
      'No tienes permiso para ver los overrides de este estudiante',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.CANNOT_MANAGE_OVERRIDE
    );
  }

  const where: any = { studentId };
  if (options?.entityType) {
    where.entityType = options.entityType;
  }
  if (!options?.includeInactive) {
    where.isActive = true;
  }

  const overrides = await prisma.contentOverride.findMany({
    where,
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return overrides.map((o) => ({
    id: o.id,
    studentId: o.studentId,
    entityType: o.entityType as OverrideEntityType,
    entityId: o.entityId,
    overrideData: o.overrideData as OverrideData,
    createdBy: o.createdBy,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    isActive: o.isActive,
    student: (o as any).student,
    creator: (o as any).creator,
  }));
}

// ============================================
// Content Resolution
// ============================================

/**
 * Apply field overrides to a single entity
 * This is the core resolution function
 *
 * IMPORTANT: This function does NOT modify the database.
 * It returns a merged view of the content.
 *
 * @param entity - Original entity data
 * @param fieldOverrides - Field overrides to apply
 * @returns Entity with overrides applied
 */
export function applyFieldOverrides<T extends Record<string, any>>(
  entity: T,
  fieldOverrides?: FieldOverrides
): T {
  if (!fieldOverrides) return entity;

  return {
    ...entity,
    ...Object.fromEntries(
      Object.entries(fieldOverrides).filter(([_, value]) => value !== undefined)
    ),
    _hasFieldOverrides: true,
  } as T;
}

/**
 * Resolve steps/cards for a lesson with overrides applied
 *
 * This handles:
 * 1. Field overrides on individual cards
 * 2. Hiding cards (marking as skipped, not removing)
 * 3. Injecting extra cards at specified positions
 *
 * PROGRESS SAFETY:
 * - Hidden cards are marked with `_isHiddenOverride: true`
 * - They are returned in the array but should be filtered by the client
 * - Progress tracking marks hidden cards as "skipped"
 *
 * @param lessonId - ID of the lesson
 * @param studentId - ID of the student
 * @returns Resolved steps with override markers
 */
export async function resolveStepsWithOverrides(
  lessonId: string,
  studentId: string
): Promise<ResolvedStepsResult> {
  // Get the lesson override for this student
  const lessonOverride = await prisma.contentOverride.findUnique({
    where: {
      override_student_entity_unique: {
        studentId,
        entityType: 'LESSON',
        entityId: lessonId,
      },
    },
  });

  // Get all steps for the lesson
  const steps = await prisma.step.findMany({
    where: { lessonId, isActive: true },
    orderBy: { order: 'asc' },
  });

  // Get card-level overrides for this lesson's steps
  const cardOverrides = await prisma.contentOverride.findMany({
    where: {
      studentId,
      entityType: 'CARD',
      entityId: { in: steps.map((s) => s.id) },
      isActive: true,
    },
  });

  // Build override map for quick lookup
  const cardOverrideMap = new Map(
    cardOverrides.map((o) => [o.entityId, o.overrideData as OverrideData])
  );

  const overrideData = lessonOverride?.overrideData as OverrideData | undefined;
  const hiddenStepIds = overrideData?.hiddenCardIds || [];

  // Apply card-level overrides and mark hidden cards
  let resolvedSteps: ResolvedStep[] = steps.map((step) => {
    const cardOverride = cardOverrideMap.get(step.id);
    let resolved: ResolvedStep = cardOverride?.fieldOverrides
      ? applyFieldOverrides(step as any, cardOverride.fieldOverrides)
      : { ...step };

    // Mark hidden cards
    if (hiddenStepIds.includes(step.id)) {
      resolved._isHiddenOverride = true;
    }

    return resolved;
  });

  // Inject extra cards if present
  // FUTURE: Add conditions support for conditional extra cards
  if (overrideData?.extraCards && overrideData.extraCards.length > 0) {
    const extras: ResolvedStep[] = overrideData.extraCards.map((extra: ExtraCard) => ({
      id: extra.id,
      lessonId,
      title: extra.title || null,
      content: extra.content,
      contentType: extra.contentType,
      order: extra.insertAfterOrder + 0.5, // Use fractional order for sorting
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModifiedBy: null,
      lastModifiedAt: null,
      _isExtraCard: true,
    }));

    // Merge and sort by order
    resolvedSteps = [...resolvedSteps, ...extras].sort((a, b) => a.order - b.order);

    // Recalculate integer order values
    resolvedSteps = resolvedSteps.map((step, idx) => ({
      ...step,
      order: idx,
    }));
  }

  return {
    steps: resolvedSteps,
    hiddenStepIds,
    hasOverrides: !!(lessonOverride || cardOverrides.length > 0),
  };
}

/**
 * Resolve a lesson with overrides applied
 *
 * @param lessonId - ID of the lesson
 * @param studentId - ID of the student
 * @returns Lesson with overrides applied
 */
export async function resolveLessonWithOverrides(
  lessonId: string,
  studentId: string
): Promise<ResolvedLessonResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });

  if (!lesson) {
    throw new AppError(
      'Lección no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.LESSON_NOT_FOUND
    );
  }

  const override = await prisma.contentOverride.findUnique({
    where: {
      override_student_entity_unique: {
        studentId,
        entityType: 'LESSON',
        entityId: lessonId,
      },
    },
  });

  const overrideData = override?.overrideData as OverrideData | undefined;
  const resolvedLesson = applyFieldOverrides(lesson as any, overrideData?.fieldOverrides);

  return {
    lesson: resolvedLesson,
    hasOverrides: !!override,
  };
}

/**
 * Get the adjusted total steps count for a lesson considering overrides
 *
 * PROGRESS SAFETY:
 * - Excludes hidden cards from the total
 * - Includes extra cards in the total
 *
 * @param lessonId - ID of the lesson
 * @param studentId - ID of the student
 * @returns Adjusted total steps count
 */
export async function getAdjustedTotalSteps(
  lessonId: string,
  studentId: string
): Promise<number> {
  const { steps, hiddenStepIds } = await resolveStepsWithOverrides(lessonId, studentId);

  // Count visible steps (non-hidden)
  const visibleSteps = steps.filter((s) => !s._isHiddenOverride);

  return visibleSteps.length;
}

/**
 * Check if a student has any active overrides for an entity
 *
 * @param studentId - ID of the student
 * @param entityType - Type of the entity
 * @param entityId - ID of the entity
 * @returns true if an active override exists
 */
export async function hasActiveOverride(
  studentId: string,
  entityType: OverrideEntityType,
  entityId: string
): Promise<boolean> {
  const override = await prisma.contentOverride.findUnique({
    where: {
      override_student_entity_unique: {
        studentId,
        entityType: entityType as any,
        entityId,
      },
    },
  });

  return !!(override && override.isActive);
}
