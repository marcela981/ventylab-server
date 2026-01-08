import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCases,
  getCaseById,
  evaluateCase,
  getCaseAttempts,
} from '../controllers/evaluation.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/cases
 * Obtener lista de casos clínicos disponibles
 */
router.get('/', getCases);

/**
 * GET /api/cases/:caseId
 * Obtener información completa de un caso clínico
 */
router.get('/:caseId', getCaseById);

/**
 * POST /api/cases/:caseId/evaluate
 * Evaluar configuración del usuario
 */
router.post('/:caseId/evaluate', evaluateCase);

/**
 * GET /api/cases/:caseId/attempts
 * Obtener historial de intentos del usuario en un caso
 */
router.get('/:caseId/attempts', getCaseAttempts);

export default router;

