import { prisma } from '../config/prisma';
import { computeModuleProgress } from '../utils/computeModuleProgress';

interface UpdateProgressInput {
  lessonId: string;
  currentStep: number;
  totalSteps: number;
  timeSpent?: number; // segundos adicionales a sumar
  // Note: completed is derived from currentStep === totalSteps, never passed explicitly
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

// Obtener progreso de una lección específica
export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<ProgressResponse | null> {
  // Use unique constraint to ensure we get the correct record (only one per user+lesson)
  const progress = await prisma.progress.findUnique({
    where: { 
      progress_user_lesson_unique: {
        userId,
        lessonId
      }
    }
  });
  
  if (!progress) {
    return null;
  }

  return {
    id: progress.id,
    lessonId: progress.lessonId!,
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    timeSpent: progress.timeSpent,
    lastAccess: progress.lastAccess,
    completedAt: progress.completedAt,
  };
}

// Obtener todo el progreso del usuario (para dashboard/overview)
export async function getUserProgress(userId: string) {
  const progresses = await prisma.progress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });

  // Agrupar por módulo (extraído del lessonId)
  const byModule = progresses.reduce((acc, p) => {
    const moduleId = extractModuleId(p.lessonId);
    if (!acc[moduleId]) {
      acc[moduleId] = { lessons: [], completedCount: 0, totalTimeSpent: 0 };
    }
    acc[moduleId].lessons.push({
      id: p.id,
      lessonId: p.lessonId,
      currentStep: p.currentStep,
      totalSteps: p.totalSteps,
      completed: p.completed,
      completionPercentage: p.completionPercentage,
      timeSpent: p.timeSpent,
      lastAccess: p.lastAccess,
      completedAt: p.completedAt,
    });
    if (p.completed) acc[moduleId].completedCount++;
    acc[moduleId].totalTimeSpent += p.timeSpent;
    return acc;
  }, {} as Record<string, { lessons: ProgressResponse[]; completedCount: number; totalTimeSpent: number }>);

  return { progresses, byModule };
}

// Actualizar o crear progreso
export async function updateLessonProgress(
  userId: string,
  input: UpdateProgressInput
): Promise<ProgressResponse> {
  const { lessonId, currentStep, totalSteps, timeSpent = 0 } = input;

  // Defensive check: ensure totalSteps > 0 to avoid division by zero
  if (totalSteps <= 0) {
    throw new Error('totalSteps must be greater than 0');
  }

  // Validation: currentStep cannot exceed totalSteps
  if (currentStep > totalSteps) {
    throw new Error(`currentStep (${currentStep}) cannot exceed totalSteps (${totalSteps})`);
  }

  // Calculate completion percentage and clamp to 0-100
  const rawPercentage = (currentStep / totalSteps) * 100;
  const completionPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage)));

  // Completion logic: completed = true ONLY when currentStep === totalSteps
  // This ensures the user must reach the final step to complete
  const completed = currentStep === totalSteps;

  // Extraer moduleId del lessonId si es posible
  const moduleId = extractModuleId(lessonId);

  // Use upsert with unique constraint to prevent duplicates and race conditions
  // This ensures only ONE record per user+lesson
  const progress = await prisma.progress.upsert({
    where: {
      progress_user_lesson_unique: {
        userId,
        lessonId
      }
    },
    update: {
      moduleId,
      currentStep,
      totalSteps,
      completionPercentage,
      progress: completionPercentage, // Mantener sincronizado
      completed,
      // Set completedAt when marking as completed (if not already set)
      // Clear it if marking as not completed
      completedAt: completed ? new Date() : null,
      timeSpent: {
        increment: timeSpent
      },
      lastAccess: new Date()
    },
    create: {
      userId,
      moduleId,
      lessonId,
      currentStep,
      totalSteps,
      completionPercentage,
      progress: completionPercentage, // Mantener sincronizado
      completed,
      completedAt: completed ? new Date() : null,
      timeSpent,
      lastAccess: new Date()
    }
  });

  return {
    id: progress.id,
    lessonId: progress.lessonId!,
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    timeSpent: progress.timeSpent,
    lastAccess: progress.lastAccess,
    completedAt: progress.completedAt,
  };
}

// Actualizar progreso con currentStep y totalSteps del frontend
// Frontend MUST send currentStep, totalSteps, and completionPercentage
// Backend NEVER fabricates totalSteps
interface UpdateProgressByPercentageInput {
  lessonId: string;
  currentStep: number;       // REQUIRED: actual section index + 1
  totalSteps: number;        // REQUIRED: sections.length from lesson JSON
  completionPercentage: number;
  timeSpent?: number; // segundos adicionales a sumar
  scrollPosition?: number; // opcional
  lastViewedSection?: string; // opcional
  moduleId?: string; // opcional
}

export async function updateLessonProgressByPercentage(
  userId: string,
  input: UpdateProgressByPercentageInput
): Promise<ProgressResponse> {
  const {
    lessonId,
    currentStep: inputCurrentStep,
    totalSteps: inputTotalSteps,
    completionPercentage,
    timeSpent = 0,
    scrollPosition,
    lastViewedSection,
    moduleId: providedModuleId
  } = input;

  // Validation: totalSteps must be > 0 (never fabricated, always from frontend)
  if (!inputTotalSteps || inputTotalSteps <= 0) {
    throw new Error('totalSteps must be provided and greater than 0');
  }

  // Validation: currentStep must be valid
  if (inputCurrentStep < 0) {
    throw new Error('currentStep cannot be negative');
  }

  // Validation: currentStep cannot exceed totalSteps
  if (inputCurrentStep > inputTotalSteps) {
    throw new Error(`currentStep (${inputCurrentStep}) cannot exceed totalSteps (${inputTotalSteps})`);
  }

  // Use values from frontend - NEVER fabricate
  const currentStep = inputCurrentStep;
  const totalSteps = inputTotalSteps;

  // Clamp completionPercentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(completionPercentage)));

  // Completion logic: completed = true ONLY when currentStep === totalSteps
  // This ensures the user must reach the final step to complete
  const completed = currentStep === totalSteps;

  // Extraer moduleId del lessonId si no se proporciona
  const moduleId = providedModuleId || extractModuleId(lessonId);

  // Use upsert with unique constraint to prevent duplicates and race conditions
  // This ensures only ONE record per user+lesson
  const progress = await prisma.progress.upsert({
    where: {
      progress_user_lesson_unique: {
        userId,
        lessonId
      }
    },
    update: {
      moduleId,
      currentStep,
      totalSteps,
      completionPercentage: clampedPercentage,
      progress: clampedPercentage, // Mantener sincronizado
      completed,
      scrollPosition,
      lastViewedSection,
      // Set completedAt when marking as completed
      // Clear it if marking as not completed
      completedAt: completed ? new Date() : null,
      timeSpent: {
        increment: timeSpent
      },
      lastAccess: new Date()
    },
    create: {
      userId,
      moduleId,
      lessonId,
      currentStep,
      totalSteps,
      completionPercentage: clampedPercentage,
      progress: clampedPercentage, // Mantener sincronizado
      completed,
      scrollPosition,
      lastViewedSection,
      completedAt: completed ? new Date() : null,
      timeSpent,
      lastAccess: new Date()
    }
  });

  return {
    id: progress.id,
    lessonId: progress.lessonId!,
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    timeSpent: progress.timeSpent,
    lastAccess: progress.lastAccess,
    completedAt: progress.completedAt,
  };
}

// Marcar lección como completada manualmente
// Sets currentStep = totalSteps, which triggers completed = true
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  totalSteps: number
): Promise<ProgressResponse> {
  return updateLessonProgress(userId, {
    lessonId,
    currentStep: totalSteps, // Setting currentStep = totalSteps marks as completed
    totalSteps,
  });
}

// Utilidad: extraer moduleId del lessonId
// Ejemplo: "respiratory-fundamentals" en module-01 → buscar en curriculum
// O si el lessonId tiene prefijo: "module-01-respiratory" → "module-01"
function extractModuleId(lessonId: string): string {
  const match = lessonId.match(/^(module-\d+)/);
  if (match) return match[1];

  // Fallback: buscar en el curriculum/mapping
  // Por ahora retornar el lessonId como moduleId genérico
  return 'unknown-module';
}

// Interfaz para la respuesta de progreso de módulo
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

// Mapeo de total de lecciones por módulo
// TODO: Esto debería venir de la BD o del curriculum JSON
const MODULE_LESSON_COUNTS: Record<string, number> = {
  'module-01': 5,
  'module-02': 4,
  'module-03': 6,
  'module-04': 4,
  'module-05': 5,
};

// Obtener total de lecciones de un módulo
async function getTotalLessonsInModule(moduleId: string): Promise<number> {
  // Opción 1: Intentar obtener de la BD (tabla Lesson)
  try {
    const count = await prisma.lesson.count({
      where: {
        moduleId,
        isActive: true
      }
    });
    if (count > 0) return count;
  } catch {
    // Si falla, usar el mapeo estático
  }

  // Opción 2: Usar mapeo estático
  return MODULE_LESSON_COUNTS[moduleId] || 0;
}

// Obtener progreso agregado de un módulo específico
// Uses computeModuleProgress: lesson completed when progress === 100
// Always calculates module progress from lesson progress aggregation
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResponse> {
  // Get all lessons for this module from the database
  const lessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      isActive: true,
    },
    select: {
      id: true,
    },
    orderBy: { order: 'asc' },
  });

  const lessonIds = lessons.map((lesson) => lesson.id);
  const totalLessonsInModule = lessons.length;

  // Get all lesson progress records for this module
  // Only filter by lessonId (not moduleId) since moduleId in Progress table is for module-level records
  const progresses = lessonIds.length > 0
    ? await prisma.progress.findMany({
        where: {
          userId,
          lessonId: { in: lessonIds },
        },
        orderBy: { lastAccess: 'desc' }
      })
    : [];

  // Build progress map for quick lookup
  const progressMap = new Map(
    progresses.map((record) => [record.lessonId!, record])
  );

  // Build lessons array for computeModuleProgress
  // Use completionPercentage (0-100) as the progress value, defaulting to 0 if no record
  const lessonsWithProgress = lessons.map((lesson) => {
    const record = progressMap.get(lesson.id);
    const progressValue = record?.completionPercentage ?? record?.progress ?? 0;
    // Defensive check: clamp to 0-100
    const clampedProgress = Math.max(0, Math.min(100, progressValue));
    return {
      id: lesson.id,
      progress: clampedProgress,
    };
  });

  // Use computeModuleProgress as single source of truth
  // This ensures module progress is always calculated from lesson progress aggregation
  const { completedLessonsCount, progressPercentage } = computeModuleProgress(lessonsWithProgress);

  // Defensive check: clamp progressPercentage to 0-100
  const clampedProgressPercentage = Math.max(0, Math.min(100, progressPercentage));

  // Calcular tiempo total
  const totalTimeSpent = progresses.reduce((acc, p) => acc + p.timeSpent, 0);

  // Obtener último acceso
  const lastAccess = progresses.length > 0 ? progresses[0].lastAccess : null;

  return {
    moduleId,
    completionPercentage: clampedProgressPercentage,
    completedLessons: completedLessonsCount,
    totalLessons: totalLessonsInModule,
    totalTimeSpent,
    lastAccess,
    lessons: lessons.map((lesson) => {
      const progressRecord = progressMap.get(lesson.id);
      const progressValue = progressRecord?.completionPercentage ?? progressRecord?.progress ?? 0;
      // Defensive check: clamp to 0-100
      const clampedProgress = Math.max(0, Math.min(100, progressValue));
      // A lesson is completed when progress === 100
      const isCompleted = clampedProgress === 100;
      return {
        lessonId: lesson.id,
        completed: isCompleted,
        completionPercentage: clampedProgress,
        currentStep: progressRecord?.currentStep ?? 0,
        totalSteps: progressRecord?.totalSteps ?? 1,
        timeSpent: progressRecord?.timeSpent ?? 0,
        lastAccess: progressRecord?.lastAccess ?? null
      };
    })
  };
}