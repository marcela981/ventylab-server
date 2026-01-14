import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios con email/password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Este email ya está registrado',
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || UserRole.STUDENT,
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error al registrar usuario',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login con credenciales (alternativa al endpoint de NextAuth)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout del usuario
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // NextAuth maneja el logout automáticamente
    // Este endpoint es para compatibilidad
    res.json({
      message: 'Logout exitoso',
    });
  } catch (error: any) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario actual
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Este endpoint requiere autenticación, se debe usar con el middleware
    // Por ahora retorna un mensaje
    res.json({
      message: 'Usa el endpoint /api/auth/session de NextAuth para obtener la sesión actual',
    });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error al obtener información del usuario',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/nextauth-token
 * Genera un token JWT del backend a partir de los datos de sesión de NextAuth
 * Este endpoint es llamado por el frontend para obtener un token válido del backend
 */
router.post('/nextauth-token', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    // Validar campos requeridos
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'userId y email son requeridos',
        },
      });
    }

    // Verificar que el usuario existe en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    // Verificar que el email coincide
    if (user.email !== email) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'EMAIL_MISMATCH',
          message: 'El email no coincide con el usuario',
        },
      });
    }

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generando token de NextAuth:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_GENERATION_ERROR',
        message: 'Error al generar el token',
        details: error.message,
      },
    });
  }
});

export default router;

