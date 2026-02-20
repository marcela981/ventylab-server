/**
 * Teacher-Student Routes
 * Defines all routes for managing teacher-student relationships
 *
 * ACCESS CONTROL SUMMARY:
 * ┌────────────────────────────────────────────────┬───────────┬─────────┬───────────┐
 * │ Endpoint                                       │ Teacher   │ Admin   │ Superuser │
 * ├────────────────────────────────────────────────┼───────────┼─────────┼───────────┤
 * │ POST   /teacher-students                       │     ✗     │    ✓    │     ✓     │
 * │ GET    /teacher-students                       │     ✗     │    ✓    │     ✓     │
 * │ DELETE /teacher-students/:id                   │     ✗     │    ✓    │     ✓     │
 * │ GET    /teachers/:id/students                  │  Own only │    ✓    │     ✓     │
 * │ DELETE /teachers/:teacherId/students/:studentId│     ✗     │    ✓    │     ✓     │
 * │ GET    /teachers/:tid/students/:sid/progress   │  Assigned │    ✓    │     ✓     │
 * │ GET    /teachers/me/students/:studentId/check  │     ✓     │    ✓    │     ✓     │
 * │ GET    /students/:id/teachers                  │     ✗     │    ✓    │     ✓     │
 * └────────────────────────────────────────────────┴───────────┴─────────┴───────────┘
 *
 * FUTURE EXTENSIONS:
 * - Add bulk assignment endpoints (POST /teacher-students/bulk)
 * - Add course-specific assignments (POST /courses/:courseId/teacher-students)
 * - Add group-based assignments (POST /groups/:groupId/teacher-students)
 */

import { Router } from 'express';
import * as teacherStudentController from './teacherStudent.controller';
import { authenticate, requireRole, requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validator.middleware';
import { USER_ROLES } from '../../config/constants';
import {
  assignStudentValidator,
  teacherIdValidator,
  studentIdValidator,
  teacherStudentPairValidator,
  relationshipIdValidator,
  includeProgressValidator,
} from '../../shared/middleware/validators';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// ============================================
// Admin-Only Routes (Relationship Management)
// ============================================

/**
 * POST /api/teacher-students
 * Assign a student to a teacher
 *
 * ACCESS: Admin and Superuser only
 *
 * Body:
 * - teacherId: string (must be a user with TEACHER/ADMIN/SUPERUSER role)
 * - studentId: string (must be a user with STUDENT role)
 *
 * Response: TeacherStudentResponse with teacher and student details
 */
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireAdmin, // ADMIN only (SUPERUSER implicit)
  validateRequest(assignStudentValidator),
  teacherStudentController.assignStudent
);

/**
 * GET /api/teacher-students
 * List all teacher-student relationships
 *
 * ACCESS: Admin and Superuser only
 *
 * Response: Array of all relationships with teacher and student details
 */
router.get(
  '/',
  readLimiter,
  authenticate,
  requireAdmin, // ADMIN only (SUPERUSER implicit)
  teacherStudentController.getAllRelationships
);

/**
 * DELETE /api/teacher-students/:id
 * Remove a teacher-student relationship by relationship ID
 *
 * ACCESS: Admin and Superuser only
 *
 * Params:
 * - id: The relationship ID (from TeacherStudent table)
 */
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireAdmin, // ADMIN only (SUPERUSER implicit)
  validateRequest(relationshipIdValidator),
  teacherStudentController.removeRelationship
);

// ============================================
// Teacher Routes (Own Students)
// ============================================

/**
 * GET /api/teachers/:id/students
 * List all students assigned to a specific teacher
 *
 * ACCESS:
 * - Teachers: Can only view their own students (id must match req.user.id)
 * - Admin/Superuser: Can view any teacher's students
 *
 * Params:
 * - id: Teacher's user ID
 *
 * Query:
 * - includeProgress: 'true' | 'false' - Include aggregated progress data
 *
 * Response: { teacherId, count, students: StudentWithProgress[] }
 */
router.get(
  '/teachers/:id/students',
  readLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest([...teacherIdValidator, ...includeProgressValidator]),
  teacherStudentController.getTeacherStudents
);

/**
 * DELETE /api/teachers/:teacherId/students/:studentId
 * Remove a teacher-student relationship by teacher and student IDs
 *
 * ACCESS: Admin and Superuser only
 *
 * Params:
 * - teacherId: Teacher's user ID
 * - studentId: Student's user ID
 */
router.delete(
  '/teachers/:teacherId/students/:studentId',
  writeLimiter,
  authenticate,
  requireAdmin, // ADMIN only (SUPERUSER implicit)
  validateRequest(teacherStudentPairValidator),
  teacherStudentController.removeRelationshipByPair
);

/**
 * GET /api/teachers/:teacherId/students/:studentId/progress
 * Get detailed progress for a specific student
 *
 * ACCESS:
 * - Teachers: Can only view progress of their assigned students
 * - Admin/Superuser: Can view any student's progress
 *
 * Params:
 * - teacherId: Teacher's user ID (for ownership verification)
 * - studentId: Student's user ID
 *
 * Response: Detailed progress by module with completion stats
 */
router.get(
  '/teachers/:teacherId/students/:studentId/progress',
  readLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(teacherStudentPairValidator),
  teacherStudentController.getStudentProgress
);

/**
 * GET /api/teachers/me/students/:studentId/check
 * Check if the current teacher has a specific student assigned
 *
 * ACCESS: Any authenticated teacher
 *
 * Params:
 * - studentId: Student's user ID to check
 *
 * Response: { teacherId, studentId, isAssigned: boolean }
 */
router.get(
  '/teachers/me/students/:studentId/check',
  readLimiter,
  authenticate,
  requireTeacherPlus, // TEACHER or ADMIN (SUPERUSER implicit)
  validateRequest(studentIdValidator),
  teacherStudentController.checkStudentAssignment
);

// ============================================
// Student Routes (Admin View)
// ============================================

/**
 * GET /api/students/:id/teachers
 * List all teachers assigned to a specific student
 *
 * ACCESS: Admin and Superuser only
 * (Reserved for future admin dashboards and reporting)
 *
 * Params:
 * - id: Student's user ID
 *
 * Response: { studentId, count, teachers: TeacherInfo[] }
 */
router.get(
  '/students/:id/teachers',
  readLimiter,
  authenticate,
  requireAdmin, // ADMIN only (SUPERUSER implicit)
  validateRequest(studentIdValidator),
  teacherStudentController.getStudentTeachers
);

export default router;
