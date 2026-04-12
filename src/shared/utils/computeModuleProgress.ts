/**
 * computeModuleProgress - Single source of truth for module progress calculation
 *
 * RULES:
 * - A lesson is considered completed ONLY if progress === 100
 * - Module progress is derived from lesson completion count
 * - progressPercentage is rounded DOWN (floor)
 */

export interface LessonProgressInput {
  id?: string;
  lessonId?: string;
  progress: number; // 0-100
}

export interface ModuleProgressResult {
  completedLessonsCount: number;
  totalLessonsCount: number;
  progressPercentage: number; // 0-100, rounded down
}

/** Compute module progress from a list of lessons */
export function computeModuleProgress(lessons: LessonProgressInput[]): ModuleProgressResult {
  if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
    return {
      completedLessonsCount: 0,
      totalLessonsCount: 0,
      progressPercentage: 0,
    };
  }

  const totalLessonsCount = lessons.length;
  const completedLessonsCount = lessons.filter(lesson => {
    const progress = typeof lesson.progress === 'number' ? lesson.progress : 0;
    return progress === 100;
  }).length;

  const progressPercentage = Math.floor((completedLessonsCount / totalLessonsCount) * 100);

  return {
    completedLessonsCount,
    totalLessonsCount,
    progressPercentage,
  };
}

/** Check if a module is fully completed */
export function isModuleComplete(lessons: LessonProgressInput[]): boolean {
  const { completedLessonsCount, totalLessonsCount } = computeModuleProgress(lessons);
  return totalLessonsCount > 0 && completedLessonsCount === totalLessonsCount;
}

export default computeModuleProgress;
