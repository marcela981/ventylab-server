/**
 * Progress Service - delegates to learningProgress.service.
 * All operations use UserProgress + LessonCompletion (FASE 3 migration complete).
 */

import * as learningProgressService from './learningProgress.service';
import { prisma } from '../../shared/infrastructure/database';
import { computeModuleProgress } from '../../shared/utils/computeModuleProgress';

interface UpdateProgressInput {
  lessonId: string;
  currentStep: number;
  totalSteps: number;
  timeSpent?: number;
}

interface ProgressResponse {
  id: string;
  lessonId: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  completionPercentage: number;
  timeSpent: number;
  lastAccess: Date | null;
  completedAt: Date | null;
}

interface UserProgressOverviewResponse {
  overview: {
    completedLessons: number;
    totalLessons: number;
    modulesCompleted: number;
    totalModules: number;
    xpTotal: number;
    level: number;
    nextLevelXp: number;
    streakDays: number;
    calendar: any[];
  };
  modules: Array<{
    moduleId: string;
    moduleTitle: string;
    completedLessons: number;
    totalLessons: number;
    timeSpent: number;
    completedAt: Date | null;
    lastAccessed: Date | null;
  }>;
  lessons: Array<{
    lessonId: string;
    progress: number;
    updatedAt: string;
  }>;
}

async function resolveModuleId(lessonId: string): Promise<string> {
  const match = lessonId.match(/^(module-\d+)/);
  if (match) return match[1];
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true },
  }).catch(() => null);
  return lesson?.moduleId ?? 'unknown-module';
}

export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<ProgressResponse | null> {
  const moduleId = await resolveModuleId(lessonId);
  const lp = await learningProgressService.getLessonProgress(userId, moduleId, lessonId);
  if (!lp) return null;
  const totalSteps = 1;
  const currentStep = lp.completed ? 1 : 0;
  const completionPercentage = lp.completed ? 100 : 0;
  return {
    id: `${userId}-${lessonId}`,
    lessonId,
    currentStep,
    totalSteps,
    completed: lp.completed,
    completionPercentage,
    timeSpent: lp.timeSpent,
    lastAccess: lp.lastAccessed,
    completedAt: lp.completed ? (lp.lastAccessed ?? new Date()) : null,
  };
}

export async function getUserProgress(userId: string) {
  const progress: UserProgressOverviewResponse = await learningProgressService.getUserProgressOverview(userId);
  const byModule: Record<string, { lessons: ProgressResponse[]; completedCount: number; totalTimeSpent: number }> = {};
  for (const o of progress.modules) {
    const mod = await learningProgressService.getModuleProgress(userId, o.moduleId);
    byModule[o.moduleId] = {
      lessons: mod.lessons.map((l) => ({
        id: `${userId}-${l.lessonId}`,
        lessonId: l.lessonId,
        currentStep: l.completed ? 1 : 0,
        totalSteps: 1,
        completed: l.completed,
        completionPercentage: l.completed ? 100 : 0,
        timeSpent: l.timeSpent,
        lastAccess: l.lastAccessed,
        completedAt: l.completed ? (l.lastAccessed ?? null) : null,
      })),
      completedCount: mod.completedLessons,
      totalTimeSpent: mod.timeSpent,
    };
  }
  return { progresses: [] as ProgressResponse[], byModule };
}

export async function updateLessonProgress(
  userId: string,
  input: UpdateProgressInput
): Promise<ProgressResponse> {
  const { lessonId, currentStep, totalSteps, timeSpent = 0 } = input;
  if (totalSteps <= 0) throw new Error('totalSteps must be greater than 0');
  if (currentStep > totalSteps) throw new Error(`currentStep (${currentStep}) cannot exceed totalSteps (${totalSteps})`);
  const completed = currentStep === totalSteps;
  const moduleId = await resolveModuleId(lessonId);
  await learningProgressService.updateLessonProgress({
    userId,
    moduleId,
    lessonId,
    completed,
    timeSpent,
  });
  const lp = await learningProgressService.getLessonProgress(userId, moduleId, lessonId);
  const totalStepsOut = 1;
  const currentStepOut = lp?.completed ? 1 : 0;
  const completionPercentage = lp?.completed ? 100 : Math.round((currentStep / totalSteps) * 100);
  return {
    id: `${userId}-${lessonId}`,
    lessonId,
    currentStep: currentStepOut,
    totalSteps: totalStepsOut,
    completed: lp?.completed ?? completed,
    completionPercentage,
    timeSpent: lp?.timeSpent ?? timeSpent,
    lastAccess: lp?.lastAccessed ?? new Date(),
    completedAt: lp?.completed ? (lp?.lastAccessed ?? new Date()) : null,
  };
}

interface UpdateProgressByPercentageInput {
  lessonId: string;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  timeSpent?: number;
  scrollPosition?: number;
  lastViewedSection?: string;
  moduleId?: string;
}

export async function updateLessonProgressByPercentage(
  userId: string,
  input: UpdateProgressByPercentageInput
): Promise<ProgressResponse> {
  const { lessonId, currentStep, totalSteps, completionPercentage, timeSpent = 0, moduleId: providedModuleId } = input;
  if (!input.totalSteps || input.totalSteps <= 0) throw new Error('totalSteps must be provided and greater than 0');
  if (input.currentStep < 0) throw new Error('currentStep cannot be negative');
  if (input.currentStep > input.totalSteps) throw new Error(`currentStep cannot exceed totalSteps`);
  const completed = currentStep === totalSteps;
  const moduleId = providedModuleId ?? await resolveModuleId(lessonId);
  await learningProgressService.updateLessonProgress({
    userId,
    moduleId,
    lessonId,
    completed,
    timeSpent,
  });
  const lp = await learningProgressService.getLessonProgress(userId, moduleId, lessonId);
  return {
    id: `${userId}-${lessonId}`,
    lessonId,
    currentStep,
    totalSteps,
    completed: lp?.completed ?? completed,
    completionPercentage: Math.max(0, Math.min(100, Math.round(completionPercentage))),
    timeSpent: lp?.timeSpent ?? timeSpent,
    lastAccess: lp?.lastAccessed ?? new Date(),
    completedAt: lp?.completed ? (lp?.lastAccessed ?? new Date()) : null,
  };
}

export async function markLessonComplete(
  userId: string,
  lessonId: string,
  totalSteps: number
): Promise<ProgressResponse> {
  const moduleId = await resolveModuleId(lessonId);
  await learningProgressService.markLessonComplete(userId, moduleId, lessonId, 0);
  const lp = await learningProgressService.getLessonProgress(userId, moduleId, lessonId);
  return {
    id: `${userId}-${lessonId}`,
    lessonId,
    currentStep: totalSteps,
    totalSteps,
    completed: lp?.completed ?? true,
    completionPercentage: 100,
    timeSpent: lp?.timeSpent ?? 0,
    lastAccess: lp?.lastAccessed ?? new Date(),
    completedAt: lp?.completed ? (lp?.lastAccessed ?? new Date()) : new Date(),
  };
}

interface ModuleProgressResponse {
  moduleId: string;
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  lastAccess: Date | null;
  lessons: Array<{
    lessonId: string;
    completed: boolean;
    completionPercentage: number;
    currentStep: number;
    totalSteps: number;
    timeSpent: number;
    lastAccess: Date | null;
  }>;
}

export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResponse> {
  const mod = await learningProgressService.getModuleProgress(userId, moduleId);
  const totalLessonsInModule = mod.totalLessons;
  const lessons = mod.lessons.map((l) => ({
    lessonId: l.lessonId,
    completed: l.completed,
    completionPercentage: l.completed ? 100 : 0,
    currentStep: l.completed ? 1 : 0,
    totalSteps: 1,
    timeSpent: l.timeSpent,
    lastAccess: l.lastAccessed,
  }));
  const lastAccess = lessons.length > 0
    ? lessons.reduce((latest, l) => (l.lastAccess && (!latest || l.lastAccess > latest) ? l.lastAccess : latest), null as Date | null)
    : null;
  return {
    moduleId,
    completionPercentage: mod.completionPercentage,
    completedLessons: mod.completedLessons,
    totalLessons: totalLessonsInModule,
    totalTimeSpent: mod.timeSpent,
    lastAccess,
    lessons,
  };
}
