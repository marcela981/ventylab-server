/**
 * Validation Middleware
 * Uses express-validator to validate incoming requests
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './error-handler.middleware';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants';

/**
 * Middleware to check validation results
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : undefined,
      message: error.msg,
    }));

    throw new AppError(
      'Error de validación',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      true,
      formattedErrors
    );
  }

  next();
};

/**
 * Wrapper function to run validation chains and check results
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Validation Middleware] Running validations...');
    console.log('[Validation Middleware] URL:', req.url);
    console.log('[Validation Middleware] Params:', req.params);
    console.log('[Validation Middleware] Body:', req.body);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[Validation Middleware] ❌ VALIDATION FAILED');
      console.error('[Validation Middleware] Errors:', JSON.stringify(errors.array(), null, 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const formattedErrors = errors.array().map((error) => ({
        field: error.type === 'field' ? (error as any).path : undefined,
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined,
      }));

      return next(
        new AppError(
          'Error de validación',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          true,
          formattedErrors
        )
      );
    }

    console.log('[Validation Middleware] ✅ Validation passed');
    next();
  };
};
