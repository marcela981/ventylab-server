import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * GET /api/users/me
 * Obtener perfil del usuario actual
 * 
 * Requiere autenticación (middleware authenticate)
 * Extrae userId de req.user
 * Retorna datos del usuario sin password
 * Incluye datos relacionados opcionales (progreso, logros)
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

    // Obtener parámetros de query para incluir datos relacionados
    const includeProgress = req.query.include === 'progress' || req.query.include === 'all';
    const includeAchievements = req.query.include === 'achievements' || req.query.include === 'all';

    // Construir objeto include dinámicamente
    const include: any = {};
    if (includeProgress) {
      include.learningProgress = {
        take: 10, // Limitar a los últimos 10
        orderBy: { updatedAt: 'desc' },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          lessons: {
            select: {
              id: true,
              lessonId: true,
              completed: true,
              timeSpent: true,
            },
          },
        },
      };
    }
    if (includeAchievements) {
      include.achievements = {
        take: 10, // Limitar a los últimos 10
        orderBy: { unlockedAt: 'desc' },
      };
    }

    // Consultar usuario en la base de datos
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
        ...(includeProgress && { learningProgress: include.learningProgress }),
        ...(includeAchievements && { achievements: include.achievements }),
        // Excluir password explícitamente
        password: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe en la base de datos',
      });
    }

    // Log de acceso al perfil
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
 * 
 * Requiere autenticación (middleware authenticate)
 * Valida que el usuario solo pueda editar su propio perfil
 * Permite actualizar: name, image
 * NO permite actualizar: email, password, role directamente
 * Valida campos antes de actualizar
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

    // Validar que el usuario solo pueda editar su propio perfil
    const requestedUserId = req.params.id || req.body.id;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes editar tu propio perfil',
      });
    }

    // Extraer campos permitidos para actualización
    // Nota: El schema actual solo incluye name e image
    // Si se agrega 'bio' al schema en el futuro, se puede agregar aquí
    const { name, image } = req.body;

    // Validar que no se intente actualizar campos no permitidos
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

    // Validaciones de campos
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
      // Validar formato de URL básico
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

    // Si no hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Sin datos para actualizar',
        message: 'Debes proporcionar al menos un campo para actualizar (name, image)',
      });
    }

    // Actualizar usuario en la base de datos
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
        password: false, // Excluir password
      },
    });

    // Log de actualización
    console.log(`[${new Date().toISOString()}] Usuario ${userId} actualizó su perfil:`, Object.keys(updateData));

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error: any) {
    // Manejar error de Prisma si el usuario no existe
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
 * 
 * Requiere autenticación (middleware authenticate)
 * Requiere contraseña actual para verificar identidad
 * Valida requisitos mínimos de la nueva contraseña
 * Hashea la nueva contraseña con bcryptjs
 * Actualiza en la base de datos
 * Invalida sesiones anteriores (opcional)
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

    // Validar que se proporcionen ambas contraseñas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Debes proporcionar tanto la contraseña actual como la nueva contraseña',
      });
    }

    // Obtener usuario con password para verificar
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

    // Verificar que el usuario tenga contraseña (no es usuario de OAuth)
    if (!user.password) {
      return res.status(400).json({
        error: 'Operación no permitida',
        message: 'Este usuario se registró con OAuth y no tiene contraseña. Usa el método de autenticación original.',
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta',
      });
    }

    // Validar requisitos mínimos de la nueva contraseña
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

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La nueva contraseña debe ser diferente a la contraseña actual',
      });
    }

    // Validar complejidad de contraseña (opcional pero recomendado)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
        requirements: {
          minLength: 8,
          requiresUpperCase: true,
          requiresLowerCase: true,
          requiresNumbers: true,
          requiresSpecialChar: false, // Opcional
        },
      });
    }

    // Hashear la nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Invalidar todas las sesiones anteriores eliminándolas de la base de datos
    // Esto fuerza al usuario a iniciar sesión nuevamente
    try {
      await prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      });
    } catch (sessionError) {
      // Log del error pero no fallar la operación
      console.warn('No se pudieron invalidar las sesiones anteriores:', sessionError);
    }

    // Log de cambio de contraseña
    console.log(`[${new Date().toISOString()}] Usuario ${userId} cambió su contraseña`);

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente',
      note: 'Todas tus sesiones anteriores han sido cerradas. Por favor, inicia sesión nuevamente.',
    });
  } catch (error: any) {
    // Manejar error de Prisma si el usuario no existe
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
 * 
 * Requiere autenticación (middleware authenticate)
 * Retorna estadísticas agregadas del usuario
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

    // Obtener estadísticas agregadas usando learning_progress
    const [learningProgress, totalAchievements, totalQuizAttempts, averageScore] = await Promise.all([
      prisma.learningProgress.findMany({
        where: { userId },
        include: {
          lessons: {
            select: {
              completed: true,
            },
          },
        },
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

    // Calculate totals from learning progress
    const totalProgress = learningProgress.reduce((sum, lp) => sum + lp.lessons.length, 0);
    const completedProgress = learningProgress.reduce(
      (sum, lp) => sum + lp.lessons.filter((l) => l.completed).length,
      0
    );

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
 *
 * ACCESS: Admin and Superuser only (checked by middleware)
 *
 * Query params:
 * - page: Page number (1-indexed, default: 1)
 * - limit: Items per page (default: 25, max: 100)
 * - search: Search term for name/email
 * - sortBy: Field to sort by (name, email, createdAt, lastAccess)
 * - sortOrder: 'asc' or 'desc'
 */
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

    // Build where clause
    const where: any = {
      role: 'STUDENT',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const validSortFields = ['name', 'email', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy = { [orderByField]: sortOrder };

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Get students with pagination
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
        learningProgress: {
          select: {
            lessons: {
              select: {
                completed: true,
                timeSpent: true,
                lastAccessed: true,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Compute aggregated progress for each student
    const studentsWithStats = students.map((student) => {
      const allLessons = student.learningProgress.flatMap((lp) => lp.lessons);
      const completedLessons = allLessons.filter((l) => l.completed).length;
      const totalTimeSpent = allLessons.reduce((acc, l) => acc + l.timeSpent, 0);
      const lastAccess = allLessons.reduce(
        (latest: Date | null, l) => {
          if (!l.lastAccessed) return latest;
          if (!latest) return l.lastAccessed;
          return l.lastAccessed > latest ? l.lastAccessed : latest;
        },
        null as Date | null
      );

      // Remove raw progress data, replace with aggregated stats
      const { learningProgress, ...studentData } = student;

      return {
        ...studentData,
        stats: {
          completedLessons,
          totalLessons: allLessons.length,
          totalTimeSpent,
          lastAccess,
          progressPercentage:
            allLessons.length > 0
              ? Math.round((completedLessons / allLessons.length) * 100)
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
 *
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

    // Get the student
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

    // If requesting user is a teacher (not admin/superuser), verify assignment
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

    // Get aggregated progress from learning_progress
    const learningProgress = await prisma.learningProgress.findMany({
      where: { userId: id },
      include: {
        lessons: {
          select: {
            completed: true,
            timeSpent: true,
            lastAccessed: true,
          },
        },
      },
    });

    const allLessons = learningProgress.flatMap((lp) => lp.lessons);
    const completedLessons = allLessons.filter((l) => l.completed).length;
    const totalTimeSpent = allLessons.reduce((acc, l) => acc + l.timeSpent, 0);
    const lastAccess = allLessons.reduce(
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
          totalLessons: allLessons.length,
          totalTimeSpent,
          lastAccess,
          progressPercentage:
            allLessons.length > 0
              ? Math.round((completedLessons / allLessons.length) * 100)
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

export default {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getUserStats,
  getAllStudents,
  getStudentById,
};

