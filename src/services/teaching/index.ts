/**
 * Teaching Progression Services
 *
 * Module unlock logic and lesson completion tracking
 * using UserProgress + LessonCompletion tables.
 *
 * USAGE:
 * import { canAccessModule, getUnlockedModules, completeLesson, canAccessLesson } from '../services/teaching';
 */

export { canAccessModule, getUnlockedModules } from './moduleUnlock.service';
export { completeLesson, canAccessLesson } from './lessonProgress.service';
export type { CompleteLessonResult } from './lessonProgress.service';
