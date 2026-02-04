import { Router } from 'express';
import { authenticate, requireAdmin, requireTeacherPlus } from '../middleware/auth';
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getUserStats,
  getAllStudents,
  getStudentById,
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

// ============================================
// Student Management Routes (Admin/Teacher)
// ============================================

/**
 * GET /api/users/students
 * Get all students in the system
 *
 * ACCESS: Admin and Superuser only
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 * - search: Search term for name/email
 * - sortBy: Field to sort by
 * - sortOrder: 'asc' or 'desc'
 */
router.get('/students', requireAdmin, getAllStudents);

/**
 * GET /api/users/students/:id
 * Get a single student's details
 *
 * ACCESS:
 * - Teachers: Can only view their assigned students
 * - Admin/Superuser: Can view any student
 */
router.get('/students/:id', requireTeacherPlus, getStudentById);

export default router;

