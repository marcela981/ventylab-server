import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProgressOverview,
  getModuleProgress,
  getLessonProgress,
  completeLesson,
  submitQuizAttempt,
} from '../controllers/progress.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/progress/overview
 * Obtener estadísticas generales del progreso
 */
router.get('/overview', getProgressOverview);

/**
 * GET /api/progress/modules/:moduleId
 * Obtener progreso detallado de un módulo
 */
router.get('/modules/:moduleId', getModuleProgress);

/**
 * GET /api/progress/lessons/:lessonId
 * Obtener estado de una lección específica
 */
router.get('/lessons/:lessonId', getLessonProgress);

/**
 * POST /api/progress/lessons/:lessonId/complete
 * Marcar una lección como completada
 */
router.post('/lessons/:lessonId/complete', completeLesson);

/**
 * POST /api/progress/quiz/:quizId/attempt
 * Registrar intento de quiz y calcular score
 */
router.post('/quiz/:quizId/attempt', submitQuizAttempt);

export default router;

