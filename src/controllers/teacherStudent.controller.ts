/**
 * Teacher-Student Controller
 * Handles HTTP requests for teacher-student relationship operations
 *
 * ACCESS RULES:
 * - POST /teacher-students: Admin/Superuser only
 * - DELETE /teacher-students/:id: Admin/Superuser only
 * - GET /teachers/:id/students: Teacher (own) or Admin/Superuser (any)
 * - GET /students/:id/teachers: Admin/Superuser only
 * - GET /teachers/:id/students/:studentId/progress: Teacher (own students) or Admin/Superuser
 */

import { Request, Response, NextFunction } from 'express';
import * as teacherStudentService from '../services/teacherStudent.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { HTTP_STATUS, USER_ROLES } from '../config/constants';

// Extend Request to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  };
}

/**
 * Assign a student to a teacher
 * POST /api/teacher-students
 *
 * ACCESS: Admin and Superuser only
 *
 * Body: { teacherId: string, studentId: string }
 */
export const assignStudent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherId, studentId } = req.body;

    const relationship = await teacherStudentService.assignStudent({
      teacherId,
      studentId,
    });

    sendCreated(res, 'Estudiante asignado exitosamente al profesor', relationship);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a teacher-student relationship
 * DELETE /api/teacher-students/:id
 *
 * ACCESS: Admin and Superuser only
 */
export const removeRelationship = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await teacherStudentService.removeRelationship(id);

    sendSuccess(res, HTTP_STATUS.OK, 'Relación profesor-estudiante eliminada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a teacher-student relationship by teacher and student IDs
 * DELETE /api/teachers/:teacherId/students/:studentId
 *
 * ACCESS: Admin and Superuser only
 */
export const removeRelationshipByPair = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherId, studentId } = req.params;

    await teacherStudentService.removeRelationshipByPair(teacherId, studentId);

    sendSuccess(res, HTTP_STATUS.OK, 'Relación profesor-estudiante eliminada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all students assigned to a teacher
 * GET /api/teachers/:id/students
 *
 * ACCESS:
 * - Teachers: Can only access their own students (id must match req.user.id)
 * - Admin/Superuser: Can access any teacher's students
 *
 * Query params:
 * - includeProgress: boolean - Include aggregated progress for each student
 */
export const getTeacherStudents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: teacherId } = req.params;
    const { includeProgress } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Ownership check: Teachers can only view their own students
    const isOwnData = currentUser.id === teacherId;
    const isAdminOrSuperuser =
      currentUser.role === USER_ROLES.ADMIN ||
      currentUser.role === USER_ROLES.SUPERUSER;

    if (!isOwnData && !isAdminOrSuperuser) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Acceso denegado',
        code: 'FORBIDDEN',
        message: 'Solo puedes ver tus propios estudiantes asignados',
      });
      return;
    }

    const students = await teacherStudentService.getTeacherStudents(
      teacherId,
      includeProgress === 'true'
    );

    sendSuccess(res, HTTP_STATUS.OK, 'Estudiantes obtenidos exitosamente', {
      teacherId,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teachers assigned to a student
 * GET /api/students/:id/teachers
 *
 * ACCESS: Admin and Superuser only
 */
export const getStudentTeachers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: studentId } = req.params;

    const teachers = await teacherStudentService.getStudentTeachers(studentId);

    sendSuccess(res, HTTP_STATUS.OK, 'Profesores obtenidos exitosamente', {
      studentId,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed progress for a specific student
 * GET /api/teachers/:teacherId/students/:studentId/progress
 *
 * ACCESS:
 * - Teachers: Can only access their assigned students
 * - Admin/Superuser: Can access any student
 */
export const getStudentProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherId, studentId } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const isAdminOrSuperuser =
      currentUser.role === USER_ROLES.ADMIN ||
      currentUser.role === USER_ROLES.SUPERUSER;

    // For non-admin users, verify ownership and student assignment
    if (!isAdminOrSuperuser) {
      // Must be accessing their own data
      if (currentUser.id !== teacherId) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Acceso denegado',
          code: 'FORBIDDEN',
          message: 'Solo puedes ver el progreso de tus propios estudiantes',
        });
        return;
      }

      // Verify student is assigned to this teacher
      const isAssigned = await teacherStudentService.isStudentAssignedToTeacher(
        teacherId,
        studentId
      );

      if (!isAssigned) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Acceso denegado',
          code: 'FORBIDDEN',
          message: 'Este estudiante no está asignado a ti',
        });
        return;
      }
    }

    const progress = await teacherStudentService.getStudentDetailedProgress(studentId);

    sendSuccess(res, HTTP_STATUS.OK, 'Progreso del estudiante obtenido exitosamente', progress);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teacher-student relationships
 * GET /api/teacher-students
 *
 * ACCESS: Admin and Superuser only
 */
export const getAllRelationships = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const relationships = await teacherStudentService.getAllRelationships();

    sendSuccess(res, HTTP_STATUS.OK, 'Relaciones obtenidas exitosamente', {
      count: relationships.length,
      relationships,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if current user (teacher) has a student assigned
 * GET /api/teachers/me/students/:studentId/check
 *
 * ACCESS: Teachers only (checks against own assignment)
 */
export const checkStudentAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const isAssigned = await teacherStudentService.isStudentAssignedToTeacher(
      currentUser.id,
      studentId
    );

    sendSuccess(res, HTTP_STATUS.OK, 'Verificación completada', {
      teacherId: currentUser.id,
      studentId,
      isAssigned,
    });
  } catch (error) {
    next(error);
  }
};
