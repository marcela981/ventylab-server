/**
 * Application Constants
 * Centralized location for all constant values used throughout the application
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error Codes
 * Custom error codes for better error handling
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // User Related
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // General
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Module Related
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  MODULE_INACTIVE: 'MODULE_INACTIVE',
  MODULE_HAS_LESSONS: 'MODULE_HAS_LESSONS',
  DUPLICATE_MODULE_TITLE: 'DUPLICATE_MODULE_TITLE',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  DUPLICATE_PREREQUISITE: 'DUPLICATE_PREREQUISITE',

  // Lesson Related
  LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',
  INVALID_CONTENT_STRUCTURE: 'INVALID_CONTENT_STRUCTURE',
  ACCESS_DENIED: 'ACCESS_DENIED',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
  USER_DELETED: 'Usuario eliminado exitosamente',
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
  MODULE_CREATED: 'Módulo creado exitosamente',
  MODULE_UPDATED: 'Módulo actualizado exitosamente',
  MODULE_DELETED: 'Módulo eliminado exitosamente',
  LESSON_CREATED: 'Lección creada exitosamente',
  LESSON_UPDATED: 'Lección actualizada exitosamente',
  LESSON_DELETED: 'Lección eliminada exitosamente',
  LESSON_COMPLETED: 'Lección completada exitosamente',
  PREREQUISITE_ADDED: 'Prerequisito agregado exitosamente',
  PREREQUISITE_REMOVED: 'Prerequisito eliminado exitosamente',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email o contraseña inválidos',
  UNAUTHORIZED: 'No estás autorizado para acceder a este recurso',
  FORBIDDEN: 'Acceso denegado',
  TOKEN_EXPIRED: 'Tu sesión ha expirado, por favor inicia sesión de nuevo',
  TOKEN_INVALID: 'Token de autenticación inválido',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_ALREADY_EXISTS: 'El usuario ya existe',
  EMAIL_ALREADY_EXISTS: 'El email ya está en uso',
  VALIDATION_ERROR: 'Error de validación',
  INVALID_INPUT: 'Entrada inválida',
  NOT_FOUND: 'Recurso no encontrado',
  INTERNAL_SERVER_ERROR: 'Ocurrió un error interno del servidor',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes, por favor intenta más tarde',
  MODULE_NOT_FOUND: 'Módulo no encontrado',
  LESSON_NOT_FOUND: 'Lección no encontrada',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Module Difficulties
 * Note: prerequisitos is an optional level that does NOT affect
 * beginner navigation or unlocking
 */
export const MODULE_DIFFICULTIES = {
  PREREQUISITOS: 'prerequisitos',
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

/**
 * Main levels (excludes optional prerequisitos)
 * Use this for navigation and unlocking logic
 */
export const MAIN_MODULE_DIFFICULTIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

/**
 * Lesson Types
 */
export const LESSON_TYPES = {
  THEORY: 'theory',
  PRACTICE: 'practice',
  QUIZ: 'quiz',
  SIMULATION: 'simulation',
} as const;

