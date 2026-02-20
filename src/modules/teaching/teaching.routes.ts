/**
 * Teaching Routes
 * Exposes the teaching progression services (module unlock + lesson completion).
 *
 * All routes require authentication.
 *
 * Endpoints:
 * POST /api/teaching/lessons/:lessonId/complete  - Complete a lesson (quiz/case optional)
 * GET  /api/teaching/modules/unlocked             - List unlocked module IDs
 * GET  /api/teaching/modules/:moduleId/access     - Check module access
 * GET  /api/teaching/lessons/:lessonId/access     - Check lesson access (sequential)
 */

import { Router } from 'express';
import {
  completeLessonHandler,
  getUnlockedModulesHandler,
  checkModuleAccessHandler,
  checkLessonAccessHandler,
} from './teaching.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// All teaching routes require authentication
router.use(authenticate);

// Lesson completion (creates LessonCompletion + recalculates UserProgress)
router.post(
  '/lessons/:lessonId/complete',
  writeLimiter,
  completeLessonHandler
);

// Module unlock queries
router.get(
  '/modules/unlocked',
  readLimiter,
  getUnlockedModulesHandler
);

router.get(
  '/modules/:moduleId/access',
  readLimiter,
  checkModuleAccessHandler
);

// Lesson sequential access check
router.get(
  '/lessons/:lessonId/access',
  readLimiter,
  checkLessonAccessHandler
);

export default router;
