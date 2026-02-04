/**
 * Changelog Routes
 * Defines all routes for audit trail operations
 *
 * RBAC ACCESS:
 * - All endpoints require authentication
 * - Teachers: Can only see their own changes
 * - Admin/Superuser: Full access to all change history
 * - Students: NO access (blocked at controller level with 403)
 *
 * ROUTE STRUCTURE:
 * - GET /api/changelog              - List changes with filters
 * - GET /api/changelog/recent       - Get recent changes
 * - GET /api/changelog/stats        - Get change statistics
 * - GET /api/changelog/:type/:id    - Get history for specific entity
 */

import { Router } from 'express';
import * as changelogController from '../controllers/changelog.controller';
import { authenticate, requireTeacherPlus } from '../middleware/auth';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

// ============================================
// Protected Routes (Authentication required)
// ============================================
// Note: Student role is blocked at controller level with proper error message
// This allows for a more informative error response than just 403

/**
 * GET /api/changelog
 * List changes with filtering and pagination
 *
 * Query params:
 * - entityType: Level | Module | Lesson | Step
 * - entityId: specific entity ID
 * - action: create | update | delete | reorder
 * - changedBy: user ID
 * - fromDate: ISO date string
 * - toDate: ISO date string
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
router.get(
  '/',
  readLimiter,
  authenticate,
  requireTeacherPlus,
  changelogController.getChangelog
);

/**
 * GET /api/changelog/recent
 * Get recent changes across all entity types
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 */
router.get(
  '/recent',
  readLimiter,
  authenticate,
  requireTeacherPlus,
  changelogController.getRecentChanges
);

/**
 * GET /api/changelog/stats
 * Get change statistics for a given period
 *
 * Query params:
 * - fromDate: ISO date string (required)
 * - toDate: ISO date string (required)
 */
router.get(
  '/stats',
  readLimiter,
  authenticate,
  requireTeacherPlus,
  changelogController.getChangeStats
);

/**
 * GET /api/changelog/:entityType/:entityId
 * Get full change history for a specific entity
 *
 * Path params:
 * - entityType: Level | Module | Lesson | Step
 * - entityId: the entity's ID
 */
router.get(
  '/:entityType/:entityId',
  readLimiter,
  authenticate,
  requireTeacherPlus,
  changelogController.getEntityHistory
);

export default router;
