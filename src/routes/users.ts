import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getUserStats,
} from '../controllers/users.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/users/me
 * Obtener perfil del usuario actual
 */
router.get('/me', getCurrentUser);

/**
 * PUT /api/users/me
 * PATCH /api/users/me
 * Actualizar perfil del usuario actual
 */
router.put('/me', updateCurrentUser);
router.patch('/me', updateCurrentUser);

/**
 * POST /api/users/me/change-password
 * Cambiar contraseña del usuario actual
 */
router.post('/me/change-password', changePassword);

/**
 * GET /api/users/me/stats
 * Obtener estadísticas del usuario actual
 */
router.get('/me/stats', getUserStats);

export default router;

