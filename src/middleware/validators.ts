/**
 * Validation & Sanitization Middleware
 * Provides reusable validators for common input validation patterns
 * Uses express-validator for robust validation and sanitization
 */

import { body, param, query, ValidationChain } from 'express-validator';
import { VALIDATION, USER_ROLES, MODULE_DIFFICULTIES, STEP_CONTENT_TYPES } from '../config/constants';

/**
 * User Registration Validator
 */
export const registerValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Por favor proporciona un email válido')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`El email no debe exceder ${VALIDATION.EMAIL_MAX_LENGTH} caracteres`),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`La contraseña no debe exceder ${VALIDATION.PASSWORD_MAX_LENGTH} caracteres`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH })
    .withMessage(`El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
    .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`El nombre no debe exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre debe contener solo letras y espacios'),

  body('role')
    .optional()
    .trim()
    .isIn([USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERUSER])
    .withMessage(`El rol debe ser uno de: ${USER_ROLES.STUDENT}, ${USER_ROLES.TEACHER}, ${USER_ROLES.ADMIN}, ${USER_ROLES.SUPERUSER}`)
    .customSanitizer((value) => value || USER_ROLES.STUDENT),
];

/**
 * Login Validator
 */
export const loginValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Por favor proporciona un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
];

/**
 * Update Profile Validator
 */
export const updateProfileValidator: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH })
    .withMessage(`El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
    .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`El nombre no debe exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre debe contener solo letras y espacios'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Por favor proporciona un email válido')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`El email no debe exceder ${VALIDATION.EMAIL_MAX_LENGTH} caracteres`),
];

/**
 * Change Password Validator
 */
export const changePasswordValidator: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`La contraseña no debe exceder ${VALIDATION.PASSWORD_MAX_LENGTH} caracteres`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('La nueva contraseña debe ser diferente a la actual'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('La confirmación de contraseña no coincide'),
];

/**
 * ID Parameter Validator
 */
export const idValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID es requerido')
    .isString()
    .withMessage('El ID debe ser un string válido'),
];

/**
 * Module Creation Validator
 */
export const createModuleValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título del módulo es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no debe exceder 1000 caracteres'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La categoría no debe exceder 100 caracteres'),

  body('difficulty')
    .optional()
    .trim()
    .isIn([MODULE_DIFFICULTIES.PREREQUISITOS, MODULE_DIFFICULTIES.BEGINNER, MODULE_DIFFICULTIES.INTERMEDIATE, MODULE_DIFFICULTIES.ADVANCED])
    .withMessage('La dificultad debe ser: prerequisitos, beginner, intermediate o advanced'),

  body('estimatedTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo estimado debe ser un número positivo')
    .toInt(),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('prerequisiteIds')
    .optional()
    .isArray()
    .withMessage('Los prerequisitos deben ser un array'),

  body('prerequisiteIds.*')
    .optional()
    .isString()
    .withMessage('Cada ID de prerequisito debe ser un string válido'),
];

/**
 * Module Update Validator
 */
export const updateModuleValidator: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no debe exceder 1000 caracteres'),

  body('difficulty')
    .optional()
    .trim()
    .isIn([MODULE_DIFFICULTIES.PREREQUISITOS, MODULE_DIFFICULTIES.BEGINNER, MODULE_DIFFICULTIES.INTERMEDIATE, MODULE_DIFFICULTIES.ADVANCED])
    .withMessage('La dificultad debe ser: prerequisitos, beginner, intermediate o advanced'),

  body('estimatedTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo estimado debe ser un número positivo')
    .toInt(),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

/**
 * Lesson Creation Validator
 */
export const createLessonValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título de la lección es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),

  body('content')
    .notEmpty()
    .withMessage('El contenido de la lección es requerido'),

  body('moduleId')
    .trim()
    .notEmpty()
    .withMessage('El ID del módulo es requerido')
    .isString()
    .withMessage('El ID del módulo debe ser un string válido'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('estimatedTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo estimado debe ser un número positivo')
    .toInt(),

  body('aiGenerated')
    .optional()
    .isBoolean()
    .withMessage('aiGenerated debe ser un booleano'),

  body('sourcePrompt')
    .optional()
    .isString()
    .withMessage('sourcePrompt debe ser un string'),
];

/**
 * Lesson Update Validator
 */
export const updateLessonValidator: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),

  body('content')
    .optional(),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('estimatedTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo estimado debe ser un número positivo')
    .toInt(),

  body('aiGenerated')
    .optional()
    .isBoolean()
    .withMessage('aiGenerated debe ser un booleano'),

  body('sourcePrompt')
    .optional()
    .isString()
    .withMessage('sourcePrompt debe ser un string'),
];

/**
 * Pagination Validator
 */
export const paginationValidator: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un entero positivo')
    .toInt()
    .customSanitizer((value) => value || 1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un entero entre 1 y 100')
    .toInt()
    .customSanitizer((value) => value || 10),
];

/**
 * Search Query Validator
 */
export const searchValidator: ValidationChain[] = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('El término de búsqueda es requerido')
    .isLength({ min: 1, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 1 y 100 caracteres')
    .escape(),

  query('category')
    .optional()
    .trim()
    .isAlpha()
    .withMessage('La categoría debe contener solo letras'),
];

/**
 * Email Validator
 */
export const emailValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Por favor proporciona un email válido')
    .normalizeEmail(),
];

/**
 * Prerequisite Validator
 */
export const prerequisiteValidator: ValidationChain[] = [
  body('prerequisiteId')
    .trim()
    .notEmpty()
    .withMessage('El ID del prerequisito es requerido')
    .isString()
    .withMessage('El ID del prerequisito debe ser un string válido'),
];

/**
 * Complete Lesson Validator
 */
export const completeLessonValidator: ValidationChain[] = [
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo transcurrido debe ser un número positivo')
    .toInt(),
];

/**
 * Update Lesson Progress Validator
 */
export const updateLessonProgressValidator: ValidationChain[] = [
  param('lessonId')
    .trim()
    .notEmpty()
    .withMessage('lessonId es requerido')
    .isString()
    .withMessage('lessonId debe ser un string válido'),

  body('lessonId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('lessonId es requerido'),

  body('completionPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('completionPercentage debe estar entre 0 y 100'),

  body('progress')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('progress debe estar entre 0 y 1'),

  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('timeSpent debe ser un número positivo'),

  body('timeSpentDelta')
    .optional()
    .isNumeric()
    .withMessage('timeSpentDelta debe ser un número'),

  body('lastAccessed')
    .optional()
    .isISO8601()
    .withMessage('lastAccessed debe ser una fecha válida en formato ISO 8601'),

  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed debe ser booleano'),
];

// ============================================
// Teacher-Student Relationship Validators
// ============================================

/**
 * Assign Student to Teacher Validator
 * POST /api/teacher-students
 */
export const assignStudentValidator: ValidationChain[] = [
  body('teacherId')
    .trim()
    .notEmpty()
    .withMessage('teacherId es requerido')
    .isString()
    .withMessage('teacherId debe ser un string válido'),

  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('studentId es requerido')
    .isString()
    .withMessage('studentId debe ser un string válido'),
];

/**
 * Teacher ID Parameter Validator
 * GET /api/teachers/:id/students
 */
export const teacherIdValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID del profesor es requerido')
    .isString()
    .withMessage('El ID del profesor debe ser un string válido'),
];

/**
 * Student ID Parameter Validator
 * GET /api/students/:id/teachers
 */
export const studentIdValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID del estudiante es requerido')
    .isString()
    .withMessage('El ID del estudiante debe ser un string válido'),
];

/**
 * Teacher-Student Pair Validator
 * GET /api/teachers/:teacherId/students/:studentId/progress
 * DELETE /api/teachers/:teacherId/students/:studentId
 */
export const teacherStudentPairValidator: ValidationChain[] = [
  param('teacherId')
    .trim()
    .notEmpty()
    .withMessage('teacherId es requerido')
    .isString()
    .withMessage('teacherId debe ser un string válido'),

  param('studentId')
    .trim()
    .notEmpty()
    .withMessage('studentId es requerido')
    .isString()
    .withMessage('studentId debe ser un string válido'),
];

/**
 * Relationship ID Parameter Validator
 * DELETE /api/teacher-students/:id
 */
export const relationshipIdValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID de la relación es requerido')
    .isString()
    .withMessage('El ID de la relación debe ser un string válido'),
];

/**
 * Include Progress Query Validator
 * GET /api/teachers/:id/students?includeProgress=true
 */
export const includeProgressValidator: ValidationChain[] = [
  query('includeProgress')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeProgress debe ser "true" o "false"'),
];

// ============================================
// Level Validators
// ============================================

/**
 * Level Creation Validator
 * POST /api/levels
 */
export const createLevelValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título del nivel es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El título debe tener entre 2 y 100 caracteres'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no debe exceder 1000 caracteres'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),
];

/**
 * Level Update Validator
 * PUT /api/levels/:id
 */
export const updateLevelValidator: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El título debe tener entre 2 y 100 caracteres'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no debe exceder 1000 caracteres'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

/**
 * Level ID Query Validator
 * GET /api/modules?levelId=...
 */
export const levelIdQueryValidator: ValidationChain[] = [
  query('levelId')
    .optional()
    .isString()
    .withMessage('levelId debe ser un string válido'),
];

// ============================================
// Step (Card) Validators
// ============================================

/**
 * Step Creation Validator
 * POST /api/cards
 */
export const createStepValidator: ValidationChain[] = [
  body('lessonId')
    .trim()
    .notEmpty()
    .withMessage('El ID de la lección es requerido')
    .isString()
    .withMessage('El ID de la lección debe ser un string válido'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('El título no debe exceder 200 caracteres'),

  body('content')
    .notEmpty()
    .withMessage('El contenido del paso es requerido'),

  body('contentType')
    .optional()
    .trim()
    .isIn(Object.values(STEP_CONTENT_TYPES))
    .withMessage(`El tipo de contenido debe ser uno de: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),
];

/**
 * Step Update Validator
 * PUT /api/cards/:id
 */
export const updateStepValidator: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('El título no debe exceder 200 caracteres'),

  body('content')
    .optional(),

  body('contentType')
    .optional()
    .trim()
    .isIn(Object.values(STEP_CONTENT_TYPES))
    .withMessage(`El tipo de contenido debe ser uno de: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número no negativo')
    .toInt(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

/**
 * Steps Reorder Validator
 * PUT /api/cards/reorder
 */
export const reorderStepsValidator: ValidationChain[] = [
  body('lessonId')
    .trim()
    .notEmpty()
    .withMessage('El ID de la lección es requerido')
    .isString()
    .withMessage('El ID de la lección debe ser un string válido'),

  body('stepIds')
    .isArray({ min: 1 })
    .withMessage('stepIds debe ser un array con al menos un elemento'),

  body('stepIds.*')
    .isString()
    .withMessage('Cada ID de paso debe ser un string válido'),
];

/**
 * Lesson ID Query Validator for Steps
 * GET /api/cards?lessonId=...
 */
export const lessonIdQueryValidator: ValidationChain[] = [
  query('lessonId')
    .optional()
    .isString()
    .withMessage('lessonId debe ser un string válido'),
];

// ============================================
// Content Override Validators
// ============================================

/**
 * Override Entity Type enum values
 */
const OVERRIDE_ENTITY_TYPE_VALUES = ['LEVEL', 'LESSON', 'CARD'];

/**
 * Create Override Validator
 * POST /api/overrides
 */
export const createOverrideValidator: ValidationChain[] = [
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('studentId es requerido')
    .isString()
    .withMessage('studentId debe ser un string válido'),

  body('entityType')
    .trim()
    .notEmpty()
    .withMessage('entityType es requerido')
    .isIn(OVERRIDE_ENTITY_TYPE_VALUES)
    .withMessage(`entityType debe ser uno de: ${OVERRIDE_ENTITY_TYPE_VALUES.join(', ')}`),

  body('entityId')
    .trim()
    .notEmpty()
    .withMessage('entityId es requerido')
    .isString()
    .withMessage('entityId debe ser un string válido'),

  body('overrideData')
    .notEmpty()
    .withMessage('overrideData es requerido')
    .isObject()
    .withMessage('overrideData debe ser un objeto'),

  // Validate fieldOverrides structure
  body('overrideData.fieldOverrides')
    .optional()
    .isObject()
    .withMessage('fieldOverrides debe ser un objeto'),

  body('overrideData.fieldOverrides.title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('title no debe exceder 200 caracteres'),

  body('overrideData.fieldOverrides.content')
    .optional()
    .isString()
    .withMessage('content debe ser un string'),

  body('overrideData.fieldOverrides.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('order debe ser un entero no negativo'),

  body('overrideData.fieldOverrides.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),

  body('overrideData.fieldOverrides.estimatedTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('estimatedTime debe ser un entero no negativo'),

  body('overrideData.fieldOverrides.contentType')
    .optional()
    .isIn(Object.values(STEP_CONTENT_TYPES))
    .withMessage(`contentType debe ser uno de: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`),

  // Validate extraCards array
  body('overrideData.extraCards')
    .optional()
    .isArray()
    .withMessage('extraCards debe ser un array'),

  body('overrideData.extraCards.*.id')
    .if(body('overrideData.extraCards').exists())
    .notEmpty()
    .withMessage('Cada extraCard debe tener un id'),

  body('overrideData.extraCards.*.content')
    .if(body('overrideData.extraCards').exists())
    .notEmpty()
    .withMessage('Cada extraCard debe tener content'),

  body('overrideData.extraCards.*.contentType')
    .if(body('overrideData.extraCards').exists())
    .notEmpty()
    .isIn(Object.values(STEP_CONTENT_TYPES))
    .withMessage(`contentType debe ser uno de: ${Object.values(STEP_CONTENT_TYPES).join(', ')}`),

  body('overrideData.extraCards.*.insertAfterOrder')
    .if(body('overrideData.extraCards').exists())
    .notEmpty()
    .isInt({ min: -1 })
    .withMessage('insertAfterOrder debe ser un entero (use -1 para insertar al inicio)'),

  // Validate hiddenCardIds array
  body('overrideData.hiddenCardIds')
    .optional()
    .isArray()
    .withMessage('hiddenCardIds debe ser un array'),

  body('overrideData.hiddenCardIds.*')
    .optional()
    .isString()
    .withMessage('Cada ID en hiddenCardIds debe ser un string'),
];

/**
 * Update Override Validator
 * PUT /api/overrides/:id
 */
export const updateOverrideValidator: ValidationChain[] = [
  body('overrideData')
    .optional()
    .isObject()
    .withMessage('overrideData debe ser un objeto'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),

  // Same field validations as create, but all optional
  body('overrideData.fieldOverrides')
    .optional()
    .isObject()
    .withMessage('fieldOverrides debe ser un objeto'),

  body('overrideData.extraCards')
    .optional()
    .isArray()
    .withMessage('extraCards debe ser un array'),

  body('overrideData.hiddenCardIds')
    .optional()
    .isArray()
    .withMessage('hiddenCardIds debe ser un array'),
];

/**
 * Override ID Parameter Validator
 * GET/PUT/DELETE /api/overrides/:id
 */
export const overrideIdValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID del override es requerido')
    .isString()
    .withMessage('El ID del override debe ser un string válido'),
];

/**
 * Get Overrides Query Validator
 * GET /api/overrides?studentId=...
 */
export const getOverridesQueryValidator: ValidationChain[] = [
  query('studentId')
    .trim()
    .notEmpty()
    .withMessage('studentId es requerido')
    .isString()
    .withMessage('studentId debe ser un string válido'),

  query('entityType')
    .optional()
    .isIn(OVERRIDE_ENTITY_TYPE_VALUES)
    .withMessage(`entityType debe ser uno de: ${OVERRIDE_ENTITY_TYPE_VALUES.join(', ')}`),

  query('includeInactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeInactive debe ser "true" o "false"'),
];

// ============================================
// Level Prerequisite Validators
// ============================================

/**
 * Level Prerequisite Body Validator
 * POST /api/levels/:id/prerequisites
 */
export const levelPrerequisiteValidator: ValidationChain[] = [
  body('prerequisiteLevelId')
    .trim()
    .notEmpty()
    .withMessage('El ID del nivel prerequisito es requerido')
    .isString()
    .withMessage('El ID del nivel prerequisito debe ser un string válido'),
];

/**
 * Level Prerequisite Pair Validator
 * DELETE /api/levels/:id/prerequisites/:prereqId
 */
export const levelPrerequisitePairValidator: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID del nivel es requerido')
    .isString()
    .withMessage('El ID del nivel debe ser un string válido'),

  param('prereqId')
    .trim()
    .notEmpty()
    .withMessage('El ID del prerequisito es requerido')
    .isString()
    .withMessage('El ID del prerequisito debe ser un string válido'),
];

