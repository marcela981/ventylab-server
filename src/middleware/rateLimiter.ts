/**
 * Rate Limiting Middleware
 * Implements different rate limiting strategies for various route types
 * Protects the API from abuse and ensures fair usage
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Strict Rate Limiter - For Authentication Routes
 * Very strict limits to prevent brute force attacks
 *
 * Limits:
 * - 5 requests per hour per IP
 * - Protects login, register, and password reset endpoints
 */
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
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

/**
 * Auth Rate Limiter - For Login Attempts
 * Moderately strict to prevent credential stuffing
 *
 * Limits:
 * - 10 requests per 15 minutes per IP
 * - Specifically for login endpoints
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
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

/**
 * Write Rate Limiter - For Data Modification Routes
 * Moderate limits for POST, PUT, PATCH, DELETE operations
 *
 * Limits:
 * - 50 requests per hour per IP
 * - Protects create, update, and delete endpoints
 */
export const writeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
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

/**
 * Read Rate Limiter - For Data Retrieval Routes
 * Permissive limits for GET operations
 *
 * Limits:
 * - 200 requests per hour per IP
 * - Protects read/query endpoints
 */
export const readLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 requests per hour
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

/**
 * API Rate Limiter - General Purpose
 * Balanced limits for general API usage
 *
 * Limits:
 * - 100 requests per 15 minutes per IP
 * - General protection for all API routes
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
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

/**
 * Password Reset Rate Limiter
 * Very strict limits for password reset requests
 *
 * Limits:
 * - 3 requests per hour per IP
 * - Prevents abuse of password reset functionality
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
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

/**
 * Search Rate Limiter
 * Moderate limits for search operations
 *
 * Limits:
 * - 30 searches per 15 minutes per IP
 * - Prevents search abuse while allowing reasonable usage
 */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 searches per 15 minutes
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

/**
 * Create Custom Rate Limiter
 * Factory function to create custom rate limiters with specific config
 *
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests in the time window
 * @param message - Custom error message
 * @returns Configured rate limiter middleware
 */
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

