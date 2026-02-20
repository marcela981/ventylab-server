import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infrastructure/database';
import { USER_ROLES, UserRoleType } from '../../config/constants';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name?: string | null;
      };
    }
  }
}

/**
 * Middleware de autenticación JWT
 * Extrae y valida el token JWT del header Authorization
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No se proporcionó un token de autenticación',
        message: 'Incluye el token en el header: Authorization: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token) {
      return res.status(401).json({
        error: 'Token no válido',
      });
    }

    // Verificar y decodificar el token
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error('NEXTAUTH_SECRET no está configurado');
      return res.status(500).json({
        error: 'Error de configuración del servidor',
      });
    }

    try {
      // Decodificar el token
      const decoded = jwt.verify(token, secret) as any;

      // Verificar que el token tenga los datos necesarios
      if (!decoded.id || !decoded.email) {
        return res.status(401).json({
          error: 'Token inválido: faltan datos del usuario',
        });
      }

      // Opcional: Verificar que el usuario aún existe en la base de datos
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          error: 'Usuario no encontrado',
        });
      }

      // Agregar datos del usuario al request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message: 'El token de autenticación ha expirado. Por favor, inicia sesión nuevamente.',
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          message: 'El token de autenticación no es válido.',
        });
      }

      throw jwtError;
    }
  } catch (error: any) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error al verificar autenticación',
      message: error.message,
    });
  }
};

/**
 * Middleware opcional de autenticación
 * No rechaza requests si no hay token, solo agrega req.user si existe
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.NEXTAUTH_SECRET;

      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as any;

          if (decoded.id && decoded.email) {
            const user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true,
                email: true,
                role: true,
                name: true,
              },
            });

            if (user) {
              req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
              };
            }
          }
        } catch (error) {
          // Ignorar errores de token en autenticación opcional
        }
      }
    }

    next();
  } catch (error) {
    // Continuar sin autenticación en caso de error
    next();
  }
};

/**
 * RBAC Middleware - Verifies user has required role
 *
 * SUPERUSER RULE: Users with SUPERUSER role implicitly pass ALL role checks.
 * This is the ONLY place superuser logic is implemented - never hardcode elsewhere.
 *
 * @param roles - Roles that can access the route (SUPERUSER not needed in list)
 * @returns Express middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
    }

    // SUPERUSER always passes - implicit access to ALL routes
    if (req.user.role === USER_ROLES.SUPERUSER) {
      return next();
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        code: 'FORBIDDEN',
        message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Convenience middleware: Require ADMIN role (SUPERUSER implicit)
 */
export const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Convenience middleware: Require TEACHER or ADMIN role (SUPERUSER implicit)
 */
export const requireTeacherPlus = requireRole(USER_ROLES.TEACHER, USER_ROLES.ADMIN);

export default authenticate;
