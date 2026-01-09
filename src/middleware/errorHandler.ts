import { Request, Response, NextFunction } from 'express';

/**
 * Clase de error personalizada para errores operacionales
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: any[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    details?: any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
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
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
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
      code: isAppError ? err.code : 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Error interno del servidor',
      statusCode,
    },
  };

  // Incluir detalles si existen
  if (isAppError && err.details && err.details.length > 0) {
    errorResponse.error.details = err.details;
  }

  // En desarrollo, incluir stack trace
  if (isDevelopment && !isAppError) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.debug = {
      name: err.name,
      url: req.url,
      method: req.method,
    };
  }

  // En producción, no exponer detalles de errores internos
  if (!isDevelopment && !isAppError) {
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
    404,
    'NOT_FOUND'
  );
  next(error);
};

export default errorHandler;
