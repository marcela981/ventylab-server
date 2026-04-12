/**
 * Teaching Types
 * Type definitions for the teaching module
 */

export interface ModuleProgress {
  moduleId: string;
  userId: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
  progressPercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface LessonCompletionData {
  lessonId: string;
  userId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number;
  quizScore?: number;
}

export interface CurriculumLevel {
  id: string;
  title: string;
  description?: string;
  order: number;
  modules: CurriculumModule[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  difficulty: string;
  lessonCount: number;
}
