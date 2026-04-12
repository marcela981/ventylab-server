/**
 * Profile Module - Barrel Exports
 * Handles user profile management and student listing
 */

export * from './profile.types';
export {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getUserStats,
  getAllStudents,
  getStudentById,
} from './profile.controller';
export { default as profileRouter } from './profile.controller';
