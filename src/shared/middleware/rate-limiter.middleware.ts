/**
 * Rate Limiting Middleware
 * Implements different rate limiting strategies for various route types
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/** Strict Rate Limiter - For Authentication Routes (5 req/hour) */
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de autenticación desde esta IP',
      details: [
        'Has excedido el número máximo de intentos de autenticación',
        'Por favor espera 1 hora antes de intentar de nuevo',
        'Si crees que esto es un error, contacta a soporte'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  validate: { trustProxy: false },
});

/** Auth Rate Limiter - For Login Attempts (10 req/15min) */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de inicio de sesión',
      details: [
        'Has excedido el número máximo de intentos de inicio de sesión',
        'Por favor espera 15 minutos antes de intentar de nuevo',
        'Considera restablecer tu contraseña si la has olvidado'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { trustProxy: false },
});

/** Write Rate Limiter - For Data Modification Routes (50 req/hour) */
export const writeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas operaciones de escritura desde esta IP',
      details: [
        'Has excedido el número máximo de operaciones de escritura',
        'Por favor espera antes de hacer más cambios',
        'Límite actual: 50 operaciones por hora'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return !writeMethods.includes(req.method);
  },
});

/** Read Rate Limiter - For Data Retrieval Routes (200 req/hour) */
export const readLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde esta IP',
      details: [
        'Has excedido el número máximo de solicitudes',
        'Por favor espera antes de hacer más solicitudes',
        'Límite actual: 200 solicitudes por hora'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

/** API Rate Limiter - General Purpose (100 req/15min) */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde esta IP',
      details: [
        'Has excedido el número máximo de solicitudes API',
        'Por favor espera 15 minutos antes de hacer más solicitudes',
        'Límite actual: 100 solicitudes por 15 minutos'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Password Reset Rate Limiter (3 req/hour) */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes de restablecimiento de contraseña',
      details: [
        'Has excedido el número máximo de intentos de restablecimiento',
        'Por favor espera 1 hora antes de solicitar otro restablecimiento',
        'Revisa tu email para instrucciones previas de restablecimiento'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

/** Search Rate Limiter (30 req/15min) */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes de búsqueda',
      details: [
        'Has excedido el número máximo de solicitudes de búsqueda',
        'Por favor espera 15 minutos antes de buscar de nuevo',
        'Límite actual: 30 búsquedas por 15 minutos'
      ],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Factory function for custom rate limiters */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string = 'Límite de solicitudes excedido'
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: [
          `Has excedido el número máximo de solicitudes`,
          `Límite: ${max} solicitudes por ${windowMs / 1000} segundos`
        ],
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });
};
