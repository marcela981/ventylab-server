/**
 * Lesson Routes
 * Defines all routes for lesson-related operations
 */

import { Router } from 'express';
import * as lessonsController from './lessons.controller';
import * as stepsController from './steps.controller';
import { authenticate, requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validator.middleware';
import {
  createLessonValidator,
  updateLessonValidator,
  idValidator,
  completeLessonValidator,
} from '../../shared/middleware/validators';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

/**
 * Public routes (no authentication required for basic access)
 */

// GET /api/lessons/:id - Get a single lesson by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getLessonById
);

// GET /api/lessons/:id/next - Get the next lesson in the module
router.get(
  '/:id/next',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getNextLesson
);

// GET /api/lessons/:id/previous - Get the previous lesson in the module
router.get(
  '/:id/previous',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getPreviousLesson
);

// GET /api/lessons/:id/steps - Get all steps (cards) for a lesson
router.get(
  '/:id/steps',
  readLimiter,
  stepsController.getStepsByLesson
);

/**
 * Protected routes (authentication required)
 */

// POST /api/lessons/:id/complete - Mark a lesson as completed
router.post(
  '/:id/complete',
  writeLimiter,
  authenticate,
  validateRequest([...idValidator, ...completeLessonValidator]),
  lessonsController.markLessonComplete
);

// POST /api/lessons/:id/access - Record lesson access (for tracking)
router.post(
  '/:id/access',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  lessonsController.recordLessonAccess
);

/**
 * Teacher/Admin routes (role-based access)
 * Note: SUPERUSER has implicit access via requireRole middleware
 */

// POST /api/lessons - Create a new lesson
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest(createLessonValidator),
  lessonsController.createLesson
);

// PUT /api/lessons/:id - Update a lesson
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest([...idValidator, ...updateLessonValidator]),
  lessonsController.updateLesson
);

// DELETE /api/lessons/:id - Delete a lesson
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireAdmin,  // ADMIN only (SUPERUSER implicit)
  validateRequest(idValidator),
  lessonsController.deleteLesson
);

export default router;

