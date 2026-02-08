import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas de progreso
router.use(authenticate);

// Obtener overview del usuario (dashboard)
router.get('/overview', progressController.getUserOverview);

// Obtener progreso agregado de un módulo específico
router.get('/module/:moduleId', progressController.getModuleProgress);

// Obtener progreso de una lección específica
router.get('/lesson/:lessonId', progressController.getLessonProgress);

// Actualizar progreso de una lección
router.put('/lesson/:lessonId', progressController.updateLessonProgress);

// Marcar lección como completada
router.post('/lesson/:lessonId/complete', progressController.markComplete);

// ============================================
// UNIFIED PROGRESS ENDPOINTS (NEW - USE THESE)
// ============================================
// These endpoints implement the consolidated progress system.
// The database is the SINGLE source of truth for resume.

// POST /api/progress/step/update
// Call on EVERY step navigation
router.post('/step/update', progressController.updateStepProgress);

// GET /api/progress/resume/:moduleId
// Call when user clicks "Continue Module"
router.get('/resume/:moduleId', progressController.getResumeState);

// POST /api/progress/lesson/:lessonId/complete-unified
// Call when user clicks "Complete" on last step
router.post('/lesson/:lessonId/complete-unified', progressController.markLessonCompleteUnified);

// GET /api/progress/lesson/:lessonId/details
// Get detailed progress including step info
router.get('/lesson/:lessonId/details', progressController.getLessonProgressDetails);

// ============================================
// LEGACY ROUTES (kept for backward compatibility)
// ============================================

// Milestones - Para gamificación futura
router.get('/milestones', progressController.getMilestones);

// Achievements - Logros del usuario
router.get('/achievements', progressController.getAchievements);

// Skills - Habilidades/competencias
router.get('/skills', progressController.getSkills);

// ============================================
// DEBUG ENDPOINT - REMOVE IN PRODUCTION
// ============================================
// Test database write capability
// GET /api/progress/debug/write-test
router.get('/debug/write-test', progressController.debugWriteTest);

export default router;