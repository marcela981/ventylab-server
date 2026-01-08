import { Request, Response, NextFunction } from 'express';

/**
 * Clase de error personalizada para errores operacionales
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de manejo de errores global
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log del error según severidad
  if (statusCode >= 500) {
    // Error del servidor - log completo
    console.error('❌ Error del servidor:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Error del cliente - log simplificado
    console.warn('⚠️ Error del cliente:', {
      message: err.message,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Formatear respuesta de error
  const errorResponse: any = {
    success: false,
    error: {
      message: err.message || 'Error interno del servidor',
      statusCode,
    },
  };

  // En desarrollo, incluir stack trace
  if (isDevelopment && !isOperational) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = {
      name: err.name,
      url: req.url,
      method: req.method,
    };
  }

  // En producción, no exponer detalles de errores internos
  if (!isDevelopment && !isOperational) {
    errorResponse.error.message = 'Error interno del servidor';
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores 404
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

export default errorHandler;

