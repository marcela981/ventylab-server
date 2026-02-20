/**
 * Profile Controller
 * Handles user profile management endpoints
 * 
 * Migrated from: controllers/users.controller.ts + routes/users.ts
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/infrastructure/database';
import * as bcrypt from 'bcryptjs';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================
// Handler functions
// ============================================

/**
 * GET /api/users/me
 * Obtener perfil del usuario actual
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a tu perfil',
      });
    }

    const includeProgress = req.query.include === 'progress' || req.query.include === 'all';
    const includeAchievements = req.query.include === 'achievements' || req.query.include === 'all';

    const include: any = {};
    if (includeProgress) {
      include.userProgress = {
        take: 10,
        orderBy: { lastAccessedAt: 'desc' },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      };
    }
    if (includeAchievements) {
      include.achievements = {
        take: 10,
        orderBy: { unlockedAt: 'desc' },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        ...(includeProgress && { userProgress: include.userProgress }),
        ...(includeAchievements && { achievements: include.achievements }),
        password: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe en la base de datos',
      });
    }

    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a su perfil`);

    res.status(200).json({
      user,
    });
  } catch (error: any) {
    console.error('Error al obtener perfil del usuario:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'Ocurrió un error al consultar los datos del usuario',
    });
  }
};

/**
 * PUT /api/users/me
 * PATCH /api/users/me
 * Actualizar perfil del usuario actual
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para actualizar tu perfil',
      });
    }

    const requestedUserId = req.params.id || req.body.id;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes editar tu propio perfil',
      });
    }

    const { name, image } = req.body;

    const restrictedFields = ['email', 'password', 'role', 'id', 'createdAt', 'updatedAt'];
    const attemptedRestrictedFields = Object.keys(req.body).filter(field => 
      restrictedFields.includes(field)
    );

    if (attemptedRestrictedFields.length > 0) {
      return res.status(400).json({
        error: 'Campos no permitidos',
        message: `No puedes actualizar los siguientes campos: ${attemptedRestrictedFields.join(', ')}`,
        restrictedFields: attemptedRestrictedFields,
      });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'El nombre debe ser una cadena de texto',
        });
      }
      if (name.trim().length === 0) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'El nombre no puede estar vacío',
        });
      }
      if (name.length > 100) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'El nombre no puede exceder 100 caracteres',
        });
      }
      updateData.name = name.trim();
    }

    if (image !== undefined) {
      if (typeof image !== 'string') {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'La imagen debe ser una URL válida',
        });
      }
      try {
        new URL(image);
        updateData.image = image;
      } catch {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'La imagen debe ser una URL válida',
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Sin datos para actualizar',
        message: 'Debes proporcionar al menos un campo para actualizar (name, image)',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });

    console.log(`[${new Date().toISOString()}] Usuario ${userId} actualizó su perfil:`, Object.keys(updateData));

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe en la base de datos',
      });
    }

    console.error('Error al actualizar perfil del usuario:', error);
    res.status(500).json({
      error: 'Error al actualizar perfil',
      message: 'Ocurrió un error al actualizar los datos del usuario',
    });
  }
};

/**
 * POST /api/users/me/change-password
 * Cambiar contraseña del usuario actual
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para cambiar tu contraseña',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Debes proporcionar tanto la contraseña actual como la nueva contraseña',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe en la base de datos',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        error: 'Operación no permitida',
        message: 'Este usuario se registró con OAuth y no tiene contraseña. Usa el método de autenticación original.',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta',
      });
    }

    if (typeof newPassword !== 'string') {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'La nueva contraseña debe ser una cadena de texto',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'La nueva contraseña no puede exceder 128 caracteres',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La nueva contraseña debe ser diferente a la contraseña actual',
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
        requirements: {
          minLength: 8,
          requiresUpperCase: true,
          requiresLowerCase: true,
          requiresNumbers: true,
          requiresSpecialChar: false,
        },
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    try {
      await prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      });
    } catch (sessionError) {
      console.warn('No se pudieron invalidar las sesiones anteriores:', sessionError);
    }

    console.log(`[${new Date().toISOString()}] Usuario ${userId} cambió su contraseña`);

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente',
      note: 'Todas tus sesiones anteriores han sido cerradas. Por favor, inicia sesión nuevamente.',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe en la base de datos',
      });
    }

    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      message: 'Ocurrió un error al actualizar la contraseña',
    });
  }
};

/**
 * GET /api/users/me/stats
 * Obtener estadísticas del usuario actual
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a tus estadísticas',
      });
    }

    const [lessonCompletions, totalAchievements, totalQuizAttempts, averageScore] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: { userId },
        select: { isCompleted: true },
      }),
      prisma.achievement.count({
        where: { userId },
      }),
      prisma.quizAttempt.count({
        where: { userId },
      }),
      prisma.quizAttempt.aggregate({
        where: { userId },
        _avg: {
          score: true,
        },
      }),
    ]);

    const totalProgress = lessonCompletions.length;
    const completedProgress = lessonCompletions.filter((l) => l.isCompleted).length;

    const stats = {
      progress: {
        total: totalProgress,
        completed: completedProgress,
        inProgress: totalProgress - completedProgress,
        completionRate: totalProgress > 0 ? (completedProgress / totalProgress) * 100 : 0,
      },
      achievements: {
        total: totalAchievements,
      },
      quizzes: {
        totalAttempts: totalQuizAttempts,
        averageScore: averageScore._avg.score || 0,
      },
    };

    res.status(200).json({
      stats,
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: 'Ocurrió un error al consultar las estadísticas del usuario',
    });
  }
};

/**
 * GET /api/users/students
 * Get all students in the system
 * ACCESS: Admin and Superuser only
 */
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

    const where: any = {
      role: 'STUDENT',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['name', 'email', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy = { [orderByField]: sortOrder };

    const totalCount = await prisma.user.count({ where });

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lessonCompletions: {
          select: {
            isCompleted: true,
            timeSpent: true,
            lastAccessed: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const studentsWithStats = students.map((student) => {
      const completions = student.lessonCompletions;
      const completedLessons = completions.filter((l) => l.isCompleted).length;
      const totalTimeSpent = completions.reduce((acc, l) => acc + l.timeSpent, 0);
      const lastAccess = completions.reduce(
        (latest: Date | null, l) => {
          if (!l.lastAccessed) return latest;
          if (!latest) return l.lastAccessed;
          return l.lastAccessed > latest ? l.lastAccessed : latest;
        },
        null as Date | null
      );

      const { lessonCompletions, ...studentData } = student;

      return {
        ...studentData,
        stats: {
          completedLessons,
          totalLessons: completions.length,
          totalTimeSpent,
          lastAccess,
          progressPercentage:
            completions.length > 0
              ? Math.round((completedLessons / completions.length) * 100)
              : 0,
        },
      };
    });

    res.status(200).json({
      students: studentsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({
      error: 'Error al obtener estudiantes',
      message: 'Ocurrió un error al consultar la lista de estudiantes',
    });
  }
};

/**
 * GET /api/users/students/:id
 * Get a single student's details
 * ACCESS: Teacher (only assigned students), Admin, Superuser
 */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.role?.toUpperCase();

    if (!requestingUserId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a esta información',
      });
    }

    const student = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        error: 'Estudiante no encontrado',
        message: 'No se encontró un estudiante con el ID especificado',
      });
    }

    if (student.role !== 'STUDENT') {
      return res.status(400).json({
        error: 'Usuario no es estudiante',
        message: 'El usuario especificado no tiene rol de estudiante',
      });
    }

    if (requestingUserRole === 'TEACHER') {
      const isAssigned = await prisma.teacherStudent.findUnique({
        where: {
          teacherId_studentId: {
            teacherId: requestingUserId,
            studentId: id,
          },
        },
      });

      if (!isAssigned) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes permiso para ver este estudiante',
        });
      }
    }

    const lessonCompletions = await prisma.lessonCompletion.findMany({
      where: { userId: id },
      select: { isCompleted: true, timeSpent: true, lastAccessed: true },
    });

    const completedLessons = lessonCompletions.filter((l) => l.isCompleted).length;
    const totalTimeSpent = lessonCompletions.reduce((acc, l) => acc + l.timeSpent, 0);
    const lastAccess = lessonCompletions.reduce(
      (latest: Date | null, l) => {
        if (!l.lastAccessed) return latest;
        if (!latest) return l.lastAccessed;
        return l.lastAccessed > latest ? l.lastAccessed : latest;
      },
      null as Date | null
    );

    res.status(200).json({
      student: {
        ...student,
        stats: {
          completedLessons,
          totalLessons: lessonCompletions.length,
          totalTimeSpent,
          lastAccess,
          progressPercentage:
            lessonCompletions.length > 0
              ? Math.round((completedLessons / lessonCompletions.length) * 100)
              : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({
      error: 'Error al obtener estudiante',
      message: 'Ocurrió un error al consultar los datos del estudiante',
    });
  }
};

// ============================================
// Route definitions
// ============================================

// Perfil del usuario actual
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);
router.patch('/me', updateCurrentUser);
router.post('/me/change-password', changePassword);
router.get('/me/stats', getUserStats);

// Student management (Admin/Teacher)
router.get('/students', requireAdmin, getAllStudents);
router.get('/students/:id', requireTeacherPlus, getStudentById);

export default router;
