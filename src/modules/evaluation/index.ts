/**
 * Evaluation Module
 * Barrel exports for the evaluation module
 */

export * from './evaluation.controller';
export * from './evaluation.service';
export * from './scoring.service';
export * from './evaluation.types';
export * from './quiz.service';

// Default export: clinical-cases router (legacy)
export { default } from './evaluation.controller';
