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

  // Level Related
  LEVEL_NOT_FOUND: 'LEVEL_NOT_FOUND',
  LEVEL_HAS_MODULES: 'LEVEL_HAS_MODULES',
  DUPLICATE_LEVEL_TITLE: 'DUPLICATE_LEVEL_TITLE',
  LEVEL_HAS_STUDENT_PROGRESS: 'LEVEL_HAS_STUDENT_PROGRESS',
  LEVEL_CIRCULAR_DEPENDENCY: 'LEVEL_CIRCULAR_DEPENDENCY',
  DUPLICATE_LEVEL_PREREQUISITE: 'DUPLICATE_LEVEL_PREREQUISITE',
  LEVEL_IS_PREREQUISITE: 'LEVEL_IS_PREREQUISITE',
  LEVEL_SELF_PREREQUISITE: 'LEVEL_SELF_PREREQUISITE',
  LEVEL_PREREQUISITE_NOT_FOUND: 'LEVEL_PREREQUISITE_NOT_FOUND',

  // Lesson Related
  LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',
  LESSON_HAS_STEPS: 'LESSON_HAS_STEPS',
  LESSON_HAS_STUDENT_PROGRESS: 'LESSON_HAS_STUDENT_PROGRESS',
  INVALID_CONTENT_STRUCTURE: 'INVALID_CONTENT_STRUCTURE',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // Step (Card) Related
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  STEP_HAS_STUDENT_PROGRESS: 'STEP_HAS_STUDENT_PROGRESS',
  INVALID_STEP_CONTENT_TYPE: 'INVALID_STEP_CONTENT_TYPE',

  // Teacher-Student Related
  TEACHER_NOT_FOUND: 'TEACHER_NOT_FOUND',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  RELATIONSHIP_NOT_FOUND: 'RELATIONSHIP_NOT_FOUND',
  RELATIONSHIP_EXISTS: 'RELATIONSHIP_EXISTS',
  INVALID_TEACHER_ROLE: 'INVALID_TEACHER_ROLE',
  INVALID_STUDENT_ROLE: 'INVALID_STUDENT_ROLE',
  NOT_ASSIGNED_TO_TEACHER: 'NOT_ASSIGNED_TO_TEACHER',

  // Content Override Related
  OVERRIDE_NOT_FOUND: 'OVERRIDE_NOT_FOUND',
  OVERRIDE_EXISTS: 'OVERRIDE_EXISTS',
  INVALID_OVERRIDE_DATA: 'INVALID_OVERRIDE_DATA',
  CANNOT_MANAGE_OVERRIDE: 'CANNOT_MANAGE_OVERRIDE',
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
  // Level
  LEVEL_CREATED: 'Nivel creado exitosamente',
  LEVEL_UPDATED: 'Nivel actualizado exitosamente',
  LEVEL_DELETED: 'Nivel eliminado exitosamente',
  LEVEL_DEACTIVATED: 'Nivel desactivado exitosamente',
  // Module
  MODULE_CREATED: 'Módulo creado exitosamente',
  MODULE_UPDATED: 'Módulo actualizado exitosamente',
  MODULE_DELETED: 'Módulo eliminado exitosamente',
  MODULE_DEACTIVATED: 'Módulo desactivado exitosamente',
  // Lesson
  LESSON_CREATED: 'Lección creada exitosamente',
  LESSON_UPDATED: 'Lección actualizada exitosamente',
  LESSON_DELETED: 'Lección eliminada exitosamente',
  LESSON_DEACTIVATED: 'Lección desactivada exitosamente',
  LESSON_COMPLETED: 'Lección completada exitosamente',
  // Step (Card)
  STEP_CREATED: 'Paso creado exitosamente',
  STEP_UPDATED: 'Paso actualizado exitosamente',
  STEP_DELETED: 'Paso eliminado exitosamente',
  STEP_DEACTIVATED: 'Paso desactivado exitosamente',
  STEPS_REORDERED: 'Pasos reordenados exitosamente',
  // Prerequisites (Module)
  PREREQUISITE_ADDED: 'Prerequisito agregado exitosamente',
  PREREQUISITE_REMOVED: 'Prerequisito eliminado exitosamente',
  // Prerequisites (Level)
  LEVEL_PREREQUISITE_ADDED: 'Prerequisito de nivel agregado exitosamente',
  LEVEL_PREREQUISITE_REMOVED: 'Prerequisito de nivel eliminado exitosamente',
  // Roadmap
  ROADMAP_RETRIEVED: 'Roadmap obtenido exitosamente',
  LEVEL_UNLOCK_STATUS_RETRIEVED: 'Estado de desbloqueo obtenido exitosamente',
  // Teacher-Student
  STUDENT_ASSIGNED: 'Estudiante asignado exitosamente al profesor',
  STUDENT_UNASSIGNED: 'Relación profesor-estudiante eliminada exitosamente',
  // Content Override
  OVERRIDE_CREATED: 'Override creado exitosamente',
  OVERRIDE_UPDATED: 'Override actualizado exitosamente',
  OVERRIDE_DELETED: 'Override eliminado exitosamente',
  OVERRIDES_RETRIEVED: 'Overrides obtenidos exitosamente',
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
  // Level
  LEVEL_NOT_FOUND: 'Nivel no encontrado',
  LEVEL_HAS_MODULES: 'No se puede eliminar un nivel con módulos asociados',
  DUPLICATE_LEVEL_TITLE: 'Ya existe un nivel con este título',
  LEVEL_HAS_STUDENT_PROGRESS: 'No se puede eliminar: hay estudiantes con progreso en este nivel',
  LEVEL_CIRCULAR_DEPENDENCY: 'No se puede agregar: crearía una dependencia circular entre niveles',
  DUPLICATE_LEVEL_PREREQUISITE: 'Este nivel ya tiene configurado este prerequisito',
  LEVEL_IS_PREREQUISITE: 'No se puede eliminar: este nivel es prerequisito de otros niveles activos',
  LEVEL_SELF_PREREQUISITE: 'Un nivel no puede ser prerequisito de sí mismo',
  LEVEL_PREREQUISITE_NOT_FOUND: 'Relación de prerequisito de nivel no encontrada',
  // Module
  MODULE_NOT_FOUND: 'Módulo no encontrado',
  // Lesson
  LESSON_NOT_FOUND: 'Lección no encontrada',
  LESSON_HAS_STEPS: 'No se puede eliminar una lección con pasos asociados',
  LESSON_HAS_STUDENT_PROGRESS: 'No se puede eliminar: hay estudiantes con progreso en esta lección',
  // Step (Card)
  STEP_NOT_FOUND: 'Paso no encontrado',
  STEP_HAS_STUDENT_PROGRESS: 'No se puede eliminar: hay estudiantes con progreso en este paso',
  INVALID_STEP_CONTENT_TYPE: 'Tipo de contenido de paso inválido',
  // Teacher-Student
  TEACHER_NOT_FOUND: 'Profesor no encontrado',
  STUDENT_NOT_FOUND: 'Estudiante no encontrado',
  RELATIONSHIP_NOT_FOUND: 'Relación profesor-estudiante no encontrada',
  RELATIONSHIP_EXISTS: 'El estudiante ya está asignado a este profesor',
  INVALID_TEACHER_ROLE: 'El usuario no tiene rol de profesor',
  INVALID_STUDENT_ROLE: 'El usuario no tiene rol de estudiante',
  NOT_ASSIGNED_TO_TEACHER: 'Este estudiante no está asignado al profesor',
  // Content Override
  OVERRIDE_NOT_FOUND: 'Override no encontrado',
  OVERRIDE_EXISTS: 'Ya existe un override para esta combinación de estudiante y entidad',
  INVALID_OVERRIDE_DATA: 'Datos de override inválidos',
  CANNOT_MANAGE_OVERRIDE: 'No tienes permiso para gestionar este override',
} as const;

/**
 * User Roles - Single source of truth for RBAC
 * IMPORTANT: Must match Prisma UserRole enum exactly
 *
 * Role Hierarchy (lowest to highest):
 * - STUDENT: Default role. Access to learning content and progress tracking
 * - TEACHER: Can create/edit modules, lessons, and view student progress
 * - ADMIN: Full access except system-level operations
 * - SUPERUSER: Implicit access to ALL routes (handled in middleware)
 *
 * To add a new role:
 * 1. Add it here
 * 2. Add to UserRole enum in prisma/schema.prisma
 * 3. Run: npx prisma migrate dev
 * 4. Use in routes: requireRole(USER_ROLES.NEW_ROLE)
 */
export const USER_ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',      // Renamed from INSTRUCTOR
  ADMIN: 'ADMIN',
  SUPERUSER: 'SUPERUSER',  // Full access to all routes
} as const;

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Route Access Presets - Use these for consistent route protection
 * Note: SUPERUSER is handled implicitly in requireRole middleware
 */
export const ROUTE_ACCESS = {
  /** Any authenticated user (student and above) */
  AUTHENTICATED: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN] as const,
  /** Teacher and above - for /panel/*, /editor/* routes */
  TEACHER_PLUS: [USER_ROLES.TEACHER, USER_ROLES.ADMIN] as const,
  /** Admin only - for /admin/* routes */
  ADMIN_ONLY: [USER_ROLES.ADMIN] as const,
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

/**
 * Step (Card) Content Types
 * Defines the types of content a step can contain
 */
export const STEP_CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  QUIZ: 'quiz',
  SIMULATION: 'simulation',
  CODE: 'code',
} as const;

export type StepContentType = typeof STEP_CONTENT_TYPES[keyof typeof STEP_CONTENT_TYPES];

/**
 * Changelog Entity Types
 * Defines which entities can be tracked in the audit trail
 */
export const CHANGELOG_ENTITY_TYPES = {
  LEVEL: 'Level',
  MODULE: 'Module',
  LESSON: 'Lesson',
  STEP: 'Step',
} as const;

export type ChangelogEntityType = typeof CHANGELOG_ENTITY_TYPES[keyof typeof CHANGELOG_ENTITY_TYPES];

/**
 * Changelog Action Types
 * Defines the types of actions that can be logged
 */
export const CHANGELOG_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REORDER: 'reorder',
} as const;

export type ChangelogAction = typeof CHANGELOG_ACTIONS[keyof typeof CHANGELOG_ACTIONS];

/**
 * Content Override Entity Types
 * Defines which content types can be overridden for individual students
 *
 * FUTURE EXTENSIONS:
 * - Add MODULE for module-level overrides
 * - Add QUIZ for quiz customization per student
 */
export const OVERRIDE_ENTITY_TYPES = {
  LEVEL: 'LEVEL',
  LESSON: 'LESSON',
  CARD: 'CARD',
} as const;

export type OverrideEntityType = typeof OVERRIDE_ENTITY_TYPES[keyof typeof OVERRIDE_ENTITY_TYPES];

