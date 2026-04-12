/**
 * Changelog Service
 * Business logic for audit trail tracking and retrieval
 *
 * DESIGN DECISIONS:
 * - Fail-soft: Logging failures never block content updates
 * - Diff-only: Only changed fields are recorded (not full snapshots)
 * - RBAC-aware: Query results filtered by user permissions
 *
 * FUTURE EXTENSIONS:
 * - Add rollback capability using diff.before values
 * - Add batch operations support for bulk changes
 * - Add retention policies for old logs
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import { HTTP_STATUS, ERROR_CODES, PAGINATION, USER_ROLES } from '../../config/constants';
import { Prisma } from '@prisma/client';

// ============================================
// Type Definitions
// ============================================

/** Supported entity types for change tracking */
export type ChangeLogEntityType = 'Level' | 'Module' | 'Lesson' | 'Step';

/** Supported action types */
export type ChangeLogAction = 'create' | 'update' | 'delete' | 'reorder';

/** Diff structure for a single field change */
export interface FieldDiff {
  before: any;
  after: any;
}

/** Diff structure for update operations */
export interface ChangeDiff {
  [fieldName: string]: FieldDiff;
}

/** Input for logging a change */
export interface LogChangeInput {
  entityType: ChangeLogEntityType;
  entityId: string;
  action: ChangeLogAction;
  changedBy: string;
  diff?: ChangeDiff | null;
  metadata?: Record<string, any>;
}

/** Query parameters for changelog retrieval */
export interface GetChangelogParams {
  entityType?: ChangeLogEntityType;
  entityId?: string;
  action?: ChangeLogAction;
  changedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/** Result structure for changelog queries */
export interface GetChangelogResult {
  logs: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** User context for permission checking */
export interface UserContext {
  id: string;
  role: string;
}

// ============================================
// Diff Calculation
// ============================================

/**
 * Calculate diff between old and new values
 * Only includes fields that have actually changed
 *
 * EXTENSION POINT: To support rollback, ensure diff.before contains
 * complete previous values that can be used to restore state.
 *
 * @param oldValue - Previous state (or null for create)
 * @param newValue - New state (or null for delete)
 * @param fieldsToTrack - Specific fields to compare (optional, defaults to all keys in newValue)
 * @returns Diff object with only changed fields, or null if no changes
 */
export const getDiff = (
  oldValue: Record<string, any> | null,
  newValue: Record<string, any> | null,
  fieldsToTrack?: string[]
): ChangeDiff | null => {
  // For create - no diff needed (entity didn't exist before)
  if (!oldValue && newValue) {
    return null;
  }

  // For delete - capture that entity was deleted
  if (oldValue && !newValue) {
    return { _deleted: { before: false, after: true } };
  }

  // For update - calculate actual changes
  if (oldValue && newValue) {
    const diff: ChangeDiff = {};
    const fields = fieldsToTrack || Object.keys(newValue);

    for (const field of fields) {
      // Skip internal/system fields that shouldn't be tracked
      if (['id', 'createdAt', 'updatedAt', 'lastModifiedAt', 'lastModifiedBy'].includes(field)) {
        continue;
      }

      const oldVal = oldValue[field];
      const newVal = newValue[field];

      // Deep comparison using JSON serialization
      // This handles objects, arrays, and primitives uniformly
      const oldJson = JSON.stringify(oldVal);
      const newJson = JSON.stringify(newVal);

      if (oldJson !== newJson) {
        diff[field] = {
          before: oldVal,
          after: newVal,
        };
      }
    }

    // Return null if no actual changes detected
    return Object.keys(diff).length > 0 ? diff : null;
  }

  return null;
};

// ============================================
// Change Logging
// ============================================

/**
 * Log a change to the audit trail
 *
 * FAIL-SOFT: This function catches all errors internally and logs them
 * to console, but NEVER throws. Content updates should never fail
 * because of logging issues.
 *
 * @param input - Change details to log
 * @returns Created changelog entry or null on failure
 */
export const logChange = async (
  input: LogChangeInput
): Promise<any | null> => {
  try {
    const { entityType, entityId, action, changedBy, diff, metadata } = input;

    // Skip logging if no meaningful diff for updates
    // This avoids cluttering the log with no-op updates
    if (action === 'update' && (!diff || Object.keys(diff).length === 0)) {
      return null;
    }

    const log = await prisma.changeLog.create({
      data: {
        entityType,
        entityId,
        action,
        changedBy,
        diff: diff as Prisma.InputJsonValue | undefined,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return log;
  } catch (error) {
    // FAIL-SOFT: Log error but do NOT throw
    // This ensures content updates are never blocked by logging failures
    console.error('[ChangeLog] Failed to log change (fail-soft):', {
      error: error instanceof Error ? error.message : error,
      input: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        changedBy: input.changedBy,
      },
    });
    return null;
  }
};

// ============================================
// Change Retrieval
// ============================================

/**
 * Get changelog entries with filtering and pagination
 * Results are filtered based on user permissions
 *
 * RBAC Rules:
 * - TEACHER: Can only see changes they made
 * - ADMIN/SUPERUSER: Can see all changes
 *
 * @param params - Query parameters
 * @param user - User context for permission filtering
 * @returns Paginated changelog entries
 */
export const getChangelog = async (
  params: GetChangelogParams,
  user: UserContext
): Promise<GetChangelogResult> => {
  try {
    const {
      entityType,
      entityId,
      action,
      changedBy,
      fromDate,
      toDate,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = params;

    const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (action) {
      where.action = action;
    }

    if (changedBy) {
      where.changedBy = changedBy;
    }

    if (fromDate || toDate) {
      where.changedAt = {};
      if (fromDate) {
        where.changedAt.gte = fromDate;
      }
      if (toDate) {
        where.changedAt.lte = toDate;
      }
    }

    // RBAC filtering for TEACHER role
    // Teachers can only see changes they made themselves
    if (user.role === USER_ROLES.TEACHER) {
      where.changedBy = user.id;
    }

    const [logs, total] = await Promise.all([
      prisma.changeLog.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { changedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.changeLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  } catch (error) {
    console.error('[ChangeLog] Error in getChangelog:', error);
    throw new AppError(
      'Error al obtener el historial de cambios',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get recent changes across all entity types
 * Useful for admin dashboard overview
 *
 * @param limit - Number of recent changes to return (max 100)
 * @param user - User context for permission filtering
 * @returns Array of recent changelog entries
 */
export const getRecentChanges = async (
  limit: number = 20,
  user: UserContext
): Promise<any[]> => {
  try {
    const where: any = {};

    // RBAC filtering for TEACHER role
    if (user.role === USER_ROLES.TEACHER) {
      where.changedBy = user.id;
    }

    const logs = await prisma.changeLog.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs;
  } catch (error) {
    console.error('[ChangeLog] Error in getRecentChanges:', error);
    throw new AppError(
      'Error al obtener cambios recientes',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get change history for a specific entity
 *
 * EXTENSION POINT: This function can be extended to support
 * rollback by adding a method that applies diff.before values.
 *
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @param user - User context for permission filtering
 * @returns Array of changelog entries for the entity
 */
export const getEntityHistory = async (
  entityType: ChangeLogEntityType,
  entityId: string,
  user: UserContext
): Promise<any[]> => {
  try {
    const where: any = {
      entityType,
      entityId,
    };

    // RBAC filtering for teachers
    // Teachers can only see their own changes to the entity
    if (user.role === USER_ROLES.TEACHER) {
      where.changedBy = user.id;
    }

    const logs = await prisma.changeLog.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs;
  } catch (error) {
    console.error('[ChangeLog] Error in getEntityHistory:', error);
    throw new AppError(
      'Error al obtener historial de la entidad',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get statistics about changes for a given period
 * Useful for analytics and reporting
 *
 * @param fromDate - Start of period
 * @param toDate - End of period
 * @param user - User context for permission filtering
 * @returns Statistics object
 */
export const getChangeStats = async (
  fromDate: Date,
  toDate: Date,
  user: UserContext
): Promise<{
  totalChanges: number;
  byEntityType: Record<string, number>;
  byAction: Record<string, number>;
}> => {
  try {
    const where: any = {
      changedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    // RBAC filtering
    if (user.role === USER_ROLES.TEACHER) {
      where.changedBy = user.id;
    }

    const [total, byEntityType, byAction] = await Promise.all([
      prisma.changeLog.count({ where }),
      prisma.changeLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),
      prisma.changeLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalChanges: total,
      byEntityType: byEntityType.reduce((acc, item) => {
        acc[item.entityType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error('[ChangeLog] Error in getChangeStats:', error);
    throw new AppError(
      'Error al obtener estadísticas de cambios',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
};
