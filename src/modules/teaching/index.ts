/**
 * Teaching Module - Barrel Exports
 * All teaching-related controllers, services, and routes
 */

// Types
export * from './teaching.types';

// Controllers
export { completeLessonHandler, getUnlockedModulesHandler, checkModuleAccessHandler, checkLessonAccessHandler } from './teaching.controller';

// Routes (primary exports for index.ts)
export * from './router';

// Services - re-exported with explicit names to avoid collisions
// Progress & Learning
export {
  getLessonProgress as getLessonProgressV1,
  getModuleProgress as getModuleProgressV1,
  updateLessonProgress as updateLessonProgressV1,
  markLessonComplete as markLessonCompleteV1,
  getNextLesson,
  getUserProgressOverview,
} from './learningProgress.service';

export {
  updateStepProgress,
  markLessonComplete,
  getResumeState,
  getLessonProgressDetails,
} from './unifiedProgress.service';

export { getProgressOverview } from './overviewProgress.service';
export { completeLesson } from './progressUpdate.service';

// Note: other services are available via direct import from their files
// e.g. import { ... } from './modules/teaching/lessons.service'
