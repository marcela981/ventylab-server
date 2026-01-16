import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateLessonProgressValidator } from '../middleware/validators';
import {
  getProgressOverview,
  getModuleProgress,
  getLessonProgress,
  completeLesson,
  submitQuizAttempt,
  updateLessonProgress,
  getModuleResumePoint,
} from '../controllers/progress.controller';

const router = Router();

console.log('[Routes] Registering progress routes...');

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
 * GET /api/progress/modules/:moduleId/resume
 * Obtener punto de reanudación de un módulo
 */
router.get('/modules/:moduleId/resume', getModuleResumePoint);

/**
 * GET /api/progress/lessons/:lessonId
 * Obtener estado de una lección específica
 */
router.get('/lessons/:lessonId', getLessonProgress);

/**
 * PUT /api/progress/lesson/:lessonId
 * Actualizar progreso parcial de una lección (usado por el frontend)
 */
router.put(
  '/lesson/:lessonId',
  (req, res, next) => {
    console.log('[Route Middleware] PUT /lesson/:lessonId HIT');
    console.log('[Route Middleware] Timestamp:', new Date().toISOString());
    console.log('[Route Middleware] Params:', req.params);
    console.log('[Route Middleware] Body:', req.body);
    console.log('[Route Middleware] User:', req.user);
    next();
  },
  validateRequest(updateLessonProgressValidator),
  updateLessonProgress
);

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

console.log('[Routes] ✅ Progress routes registered successfully');
console.log('[Routes] - PUT /lesson/:lessonId -> updateLessonProgress');

export default router;

