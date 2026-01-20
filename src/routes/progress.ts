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
// NUEVAS RUTAS (stubs para evitar 404)
// ============================================

// Milestones - Para gamificación futura
router.get('/milestones', progressController.getMilestones);

// Achievements - Logros del usuario
router.get('/achievements', progressController.getAchievements);

// Skills - Habilidades/competencias
router.get('/skills', progressController.getSkills);

export default router;