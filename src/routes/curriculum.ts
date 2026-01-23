/**
 * Curriculum Routes
 * Defines routes for curriculum-related operations
 * Provides explicit module ordering based on curriculumData configuration
 */

import { Router } from 'express';
import * as curriculumController from '../controllers/curriculum.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Public routes with optional authentication
 * When authenticated, returns progress data
 */

// GET /api/curriculum/overview - Get curriculum overview with all levels
router.get('/overview', readLimiter, optionalAuth, curriculumController.getCurriculumOverview);

// GET /api/curriculum/beginner - Get beginner level modules (exactly 6 in order)
router.get('/beginner', readLimiter, optionalAuth, curriculumController.getBeginnerModules);

// GET /api/curriculum/prerequisitos - Get prerequisitos modules (optional level)
router.get('/prerequisitos', readLimiter, optionalAuth, curriculumController.getPrerequisitosModules);

// GET /api/curriculum/level/:level - Get modules by curriculum level
router.get('/level/:level', readLimiter, optionalAuth, curriculumController.getModulesByLevel);

/**
 * Protected routes (authentication required)
 */

// GET /api/curriculum/modules/:moduleId/unlocked - Check if module is unlocked
router.get(
  '/modules/:moduleId/unlocked',
  readLimiter,
  authenticate,
  curriculumController.checkModuleUnlocked
);

// GET /api/curriculum/modules/:moduleId/next - Get next module for navigation
router.get(
  '/modules/:moduleId/next',
  readLimiter,
  authenticate,
  curriculumController.getNextModule
);

export default router;
