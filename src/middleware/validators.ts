/**
 * Validation & Sanitization Middleware
 * Provides reusable validators for common input validation patterns
 * Uses express-validator for robust validation and sanitization
 */

import { body, param, query, ValidationChain } from 'express-validator';
import { VALIDATION, USER_ROLES, MODULE_DIFFICULTIES } from '../config/constants';

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
    .isIn([USER_ROLES.STUDENT, USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN])
    .withMessage(`El rol debe ser uno de: ${USER_ROLES.STUDENT}, ${USER_ROLES.INSTRUCTOR}, ${USER_ROLES.ADMIN}`)
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
    .isIn([MODULE_DIFFICULTIES.BEGINNER, MODULE_DIFFICULTIES.INTERMEDIATE, MODULE_DIFFICULTIES.ADVANCED])
    .withMessage('La dificultad debe ser: beginner, intermediate o advanced'),

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
    .isIn([MODULE_DIFFICULTIES.BEGINNER, MODULE_DIFFICULTIES.INTERMEDIATE, MODULE_DIFFICULTIES.ADVANCED])
    .withMessage('La dificultad debe ser: beginner, intermediate o advanced'),

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
    .isFloat({ min: 0, max: 100 })
    .withMessage('progress debe estar entre 0 y 100'),

  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('timeSpent debe ser un número positivo'),

  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed debe ser booleano'),
];

