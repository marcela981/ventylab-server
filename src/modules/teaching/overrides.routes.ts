/**
 * Content Override Routes
 * Defines all routes for managing per-student content overrides
 *
 * ACCESS CONTROL SUMMARY:
 * ┌────────────────────────────────────┬───────────────────┬─────────┬───────────┐
 * │ Endpoint                           │ Teacher           │ Admin   │ Superuser │
 * ├────────────────────────────────────┼───────────────────┼─────────┼───────────┤
 * │ POST   /overrides                  │ Assigned students │    ✓    │     ✓     │
 * │ GET    /overrides?studentId=       │ Assigned students │    ✓    │     ✓     │
 * │ GET    /overrides/:id              │ Assigned students │    ✓    │     ✓     │
 * │ PUT    /overrides/:id              │ Assigned students │    ✓    │     ✓     │
 * │ DELETE /overrides/:id              │ Assigned students │    ✓    │     ✓     │
 * └────────────────────────────────────┴───────────────────┴─────────┴───────────┘
 *
 * "Assigned students" = Teacher can only manage overrides for their assigned students
 * (verified via canManageOverridesFor() in the service layer)
 *
 * FUTURE EXTENSIONS:
 * - POST /overrides/bulk - Bulk create for cohorts (Phase 2)
 * - POST /overrides/clone - Clone from template (Phase 2)
 * - GET /overrides/templates - Reusable override templates (Phase 2)
 */

import { Router } from 'express';
import * as overridesController from './overrides.controller';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validator.middleware';
import {
  createOverrideValidator,
  updateOverrideValidator,
  overrideIdValidator,
  getOverridesQueryValidator,
} from '../../shared/middleware/validators';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// ============================================
// Override CRUD Routes
// ============================================

/**
 * POST /api/overrides
 * Create a new content override for a student
 *
 * ACCESS: TEACHER+ (only for assigned students), ADMIN/SUPERUSER (any student)
 *
 * Body:
 * - studentId: string (must be a user with STUDENT role)
 * - entityType: 'LEVEL' | 'LESSON' | 'CARD'
 * - entityId: string (ID of the content to override)
 * - overrideData: {
 *     fieldOverrides?: { title?, content?, order?, isActive?, ... }
 *     extraCards?: [{ id, content, contentType, insertAfterOrder, ... }]  // LESSON only
 *     hiddenCardIds?: string[]  // LESSON only
 *   }
 *
 * Response: Created ContentOverrideResponse with student and creator details
 */
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(createOverrideValidator),
  overridesController.createOverride
);

/**
 * GET /api/overrides
 * List overrides for a student
 *
 * ACCESS: TEACHER+ (only for assigned students), ADMIN/SUPERUSER (any student)
 *
 * Query params:
 * - studentId (required): ID of the student
 * - entityType (optional): Filter by entity type (LEVEL, LESSON, CARD)
 * - includeInactive (optional): 'true' to include soft-deleted overrides
 *
 * Response: { studentId, count, overrides: ContentOverrideResponse[] }
 */
router.get(
  '/',
  readLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(getOverridesQueryValidator),
  overridesController.getOverrides
);

/**
 * GET /api/overrides/:id
 * Get a single override by ID
 *
 * ACCESS: TEACHER+ (if assigned to student), ADMIN/SUPERUSER
 *
 * Params:
 * - id: Override ID
 *
 * Response: ContentOverrideResponse with student and creator details
 */
router.get(
  '/:id',
  readLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(overrideIdValidator),
  overridesController.getOverrideById
);

/**
 * PUT /api/overrides/:id
 * Update an existing override
 *
 * ACCESS: TEACHER+ (if assigned to student), ADMIN/SUPERUSER
 *
 * Params:
 * - id: Override ID
 *
 * Body:
 * - overrideData (optional): New override data
 * - isActive (optional): boolean to activate/deactivate
 *
 * Response: Updated ContentOverrideResponse
 */
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest([...overrideIdValidator, ...updateOverrideValidator]),
  overridesController.updateOverride
);

/**
 * DELETE /api/overrides/:id
 * Delete (soft) an override
 *
 * ACCESS: TEACHER+ (if assigned to student), ADMIN/SUPERUSER
 *
 * Params:
 * - id: Override ID
 *
 * Note: This performs a soft delete (sets isActive=false)
 */
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(overrideIdValidator),
  overridesController.deleteOverride
);

export default router;
