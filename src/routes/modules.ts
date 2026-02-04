/**
 * Module Routes
 * Defines all routes for module-related operations
 */

import { Router } from 'express';
import * as modulesController from '../controllers/modules.controller';
import { authenticate, requireRole, requireAdmin, requireTeacherPlus } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { USER_ROLES } from '../config/constants';
import {
  createModuleValidator,
  updateModuleValidator,
  idValidator,
  paginationValidator,
  prerequisiteValidator,
} from '../middleware/validators';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// GET /api/modules - List all modules with filtering and pagination
router.get(
  '/',
  readLimiter,
  validateRequest(paginationValidator),
  modulesController.getAllModules
);

// GET /api/modules/:id - Get a single module by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  modulesController.getModuleById
);

// GET /api/modules/:id/lessons - Get all lessons of a module
router.get(
  '/:id/lessons',
  readLimiter,
  validateRequest(idValidator),
  modulesController.getModuleLessons
);

/**
 * Protected routes (authentication required)
 */

// GET /api/modules/:id/progress - Get user progress in a module
router.get(
  '/:id/progress',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  modulesController.getModuleProgress
);

// GET /api/modules/:id/resume - Get resume point for a module
router.get(
  '/:id/resume',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  modulesController.getModuleResume
);

/**
 * Teacher/Admin routes (role-based access)
 * Note: SUPERUSER has implicit access via requireRole middleware
 */

// POST /api/modules - Create a new module
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest(createModuleValidator),
  modulesController.createModule
);

// PUT /api/modules/:id - Update a module
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest([...idValidator, ...updateModuleValidator]),
  modulesController.updateModule
);

// DELETE /api/modules/:id - Delete a module (soft delete)
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireAdmin,  // ADMIN only (SUPERUSER implicit)
  validateRequest(idValidator),
  modulesController.deleteModule
);

// POST /api/modules/:id/prerequisites - Add a prerequisite
router.post(
  '/:id/prerequisites',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest([...idValidator, ...prerequisiteValidator]),
  modulesController.addPrerequisite
);

// DELETE /api/modules/:id/prerequisites/:prerequisiteId - Remove a prerequisite
router.delete(
  '/:id/prerequisites/:prerequisiteId',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  modulesController.removePrerequisite
);

export default router;

