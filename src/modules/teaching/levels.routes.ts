/**
 * Level Routes
 * Defines all routes for level-related operations
 *
 * RBAC ACCESS:
 * - GET /api/levels, /:id, /:id/modules: Public (students can read)
 * - GET /api/levels/roadmap, /:id/unlock-status: Authenticated (any role)
 * - POST/PUT endpoints: TEACHER, ADMIN, SUPERUSER
 * - DELETE endpoints: ADMIN, SUPERUSER only
 *
 * ROUTE STRUCTURE:
 * - GET    /api/levels                         - List all levels (public)
 * - GET    /api/levels/roadmap                 - Get user roadmap (auth required)
 * - GET    /api/levels/:id                     - Get single level (public)
 * - GET    /api/levels/:id/modules             - Get modules for a level (public)
 * - GET    /api/levels/:id/unlock-status       - Get unlock status (auth required)
 * - GET    /api/levels/:id/prerequisites       - Get level prerequisites (public)
 * - GET    /api/levels/:id/can-delete          - Check if deletable (ADMIN+)
 * - POST   /api/levels                         - Create level (TEACHER+)
 * - POST   /api/levels/:id/prerequisites       - Add prerequisite (TEACHER+)
 * - PUT    /api/levels/:id                     - Update level (TEACHER+)
 * - PUT    /api/levels/reorder                 - Reorder levels (TEACHER+)
 * - DELETE /api/levels/:id                     - Delete level (ADMIN+)
 * - DELETE /api/levels/:id/prerequisites/:prereqId - Remove prerequisite (TEACHER+)
 */

import { Router } from 'express';
import * as levelsController from './levels.controller';
import { authenticate, requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validator.middleware';
import {
  createLevelValidator,
  updateLevelValidator,
  idValidator,
  paginationValidator,
  levelPrerequisiteValidator,
  levelPrerequisitePairValidator,
} from '../../shared/middleware/validators';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// ============================================
// Public Routes (No authentication required)
// ============================================
// Students can read level information

// GET /api/levels - List all levels with pagination
router.get(
  '/',
  readLimiter,
  validateRequest(paginationValidator),
  levelsController.getAllLevels
);

// ============================================
// Roadmap Routes (Authenticated - any role)
// ============================================
// Note: These must come BEFORE /:id routes to avoid matching "roadmap" as an ID

// GET /api/levels/roadmap - Get user's personalized roadmap
router.get(
  '/roadmap',
  readLimiter,
  authenticate,
  levelsController.getUserRoadmap
);

// ============================================
// Public Single Level Routes
// ============================================

// GET /api/levels/:id - Get a single level by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  levelsController.getLevelById
);

// GET /api/levels/:id/modules - Get all modules of a level
router.get(
  '/:id/modules',
  readLimiter,
  validateRequest(idValidator),
  levelsController.getLevelModules
);

// GET /api/levels/:id/prerequisites - Get level prerequisites (public)
router.get(
  '/:id/prerequisites',
  readLimiter,
  validateRequest(idValidator),
  levelsController.getLevelPrerequisites
);

// ============================================
// Authenticated Level Routes
// ============================================

// GET /api/levels/:id/unlock-status - Get unlock status for authenticated user
router.get(
  '/:id/unlock-status',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  levelsController.getLevelUnlockStatus
);

// GET /api/levels/:id/can-delete - Check if level can be deleted (ADMIN+)
router.get(
  '/:id/can-delete',
  readLimiter,
  authenticate,
  requireAdmin,
  validateRequest(idValidator),
  levelsController.checkCanDelete
);

// ============================================
// Teacher/Admin Routes (Role-based access)
// ============================================
// Note: SUPERUSER has implicit access via requireRole middleware

// PUT /api/levels/reorder - Reorder levels (must come before /:id PUT)
router.put(
  '/reorder',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  levelsController.reorderLevels
);

// POST /api/levels - Create a new level
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest(createLevelValidator),
  levelsController.createLevel
);

// PUT /api/levels/:id - Update a level
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest([...idValidator, ...updateLevelValidator]),
  levelsController.updateLevel
);

// ============================================
// Prerequisite Management Routes (TEACHER+)
// ============================================

// POST /api/levels/:id/prerequisites - Add prerequisite to level
router.post(
  '/:id/prerequisites',
  writeLimiter,
  authenticate,
  requireTeacherPlus,
  validateRequest([...idValidator, ...levelPrerequisiteValidator]),
  levelsController.addPrerequisite
);

// DELETE /api/levels/:id/prerequisites/:prereqId - Remove prerequisite
router.delete(
  '/:id/prerequisites/:prereqId',
  writeLimiter,
  authenticate,
  requireTeacherPlus,
  validateRequest(levelPrerequisitePairValidator),
  levelsController.removePrerequisite
);

// ============================================
// Admin Routes (Strict role access)
// ============================================

// DELETE /api/levels/:id - Delete a level (soft delete)
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireAdmin,  // ADMIN only (SUPERUSER implicit)
  validateRequest(idValidator),
  levelsController.deleteLevel
);

export default router;
