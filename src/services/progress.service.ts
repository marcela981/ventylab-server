import { prisma } from '../config/prisma';

interface UpdateProgressInput {
  lessonId: string;
  currentStep: number;
  totalSteps: number;
  timeSpent?: number; // segundos adicionales a sumar
  completed?: boolean; // explicit completion flag - never auto-complete
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
  const progress = await prisma.progress.findFirst({
    where: { 
      userId,
      lessonId
    }
  });
  
  if (!progress) {
    return null;
  }

  return {
    id: progress.id,
    lessonId: progress.lessonId,
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
  const { lessonId, currentStep, totalSteps, timeSpent = 0, completed: explicitCompleted } = input;

  const completionPercentage = Math.round((currentStep / totalSteps) * 100);
  // IMPORTANT: Only mark as completed when explicitly requested
  // Never auto-complete based on currentStep >= totalSteps
  const completed = explicitCompleted === true;

  // Find existing progress
  const existing = await prisma.progress.findFirst({
    where: { userId, lessonId }
  });

  // Extraer moduleId del lessonId si es posible
  const moduleId = extractModuleId(lessonId);

  const progress = existing
    ? await prisma.progress.update({
        where: { id: existing.id },
        data: {
          moduleId,
          currentStep,
          totalSteps,
          completionPercentage,
          progress: completionPercentage, // Mantener sincronizado
          completed,
          ...(completed && !existing.completedAt && { completedAt: new Date() }),
          timeSpent: existing.timeSpent + timeSpent,
          lastAccess: new Date()
        }
      })
    : await prisma.progress.create({
        data: {
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
    lessonId: progress.lessonId,
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    timeSpent: progress.timeSpent,
    lastAccess: progress.lastAccess,
    completedAt: progress.completedAt,
  };
}

// Actualizar progreso usando completionPercentage directamente (nuevo formato)
interface UpdateProgressByPercentageInput {
  lessonId: string;
  completionPercentage: number;
  timeSpent?: number; // segundos adicionales a sumar
  scrollPosition?: number; // opcional, no se guarda en BD por ahora
  lastViewedSection?: string; // opcional, no se guarda en BD por ahora
  completed?: boolean; // explicit completion flag - never auto-complete
}

export async function updateLessonProgressByPercentage(
  userId: string,
  input: UpdateProgressByPercentageInput
): Promise<ProgressResponse> {
  const { lessonId, completionPercentage, timeSpent = 0, scrollPosition, lastViewedSection, moduleId: providedModuleId, completed: explicitCompleted } = input;

  // Clamp completionPercentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(completionPercentage)));
  // IMPORTANT: Only mark as completed when explicitly requested
  // Never auto-complete based on completionPercentage >= 100
  const completed = explicitCompleted === true;

  // Get existing progress to preserve currentStep/totalSteps if they exist
  // Otherwise, use a default totalSteps of 100 (so currentStep = completionPercentage)
  const existing = await prisma.progress.findFirst({
    where: { 
      userId,
      lessonId
    }
  });

  // Calculate currentStep and totalSteps
  // If we have existing progress, try to preserve the ratio
  // Otherwise, use totalSteps = 100 so currentStep = completionPercentage
  let currentStep: number;
  let totalSteps: number;

  if (existing && existing.totalSteps > 0) {
    // Preserve existing totalSteps and calculate currentStep
    totalSteps = existing.totalSteps;
    currentStep = Math.round((clampedPercentage / 100) * totalSteps);
  } else {
    // Default: use 100 as totalSteps
    totalSteps = 100;
    currentStep = clampedPercentage;
  }

  // Extraer moduleId del lessonId si no se proporciona
  const moduleId = providedModuleId || extractModuleId(lessonId);

  // Update existing or create new progress
  const progress = existing
    ? await prisma.progress.update({
        where: { id: existing.id },
        data: {
          moduleId,
          currentStep,
          totalSteps,
          completionPercentage: clampedPercentage,
          progress: clampedPercentage, // Mantener sincronizado
          completed,
          scrollPosition,
          lastViewedSection,
          ...(completed && !existing.completedAt && { completedAt: new Date() }),
          timeSpent: existing.timeSpent + timeSpent,
          lastAccess: new Date()
        }
      })
    : await prisma.progress.create({
        data: {
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
    lessonId: progress.lessonId,
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
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  totalSteps: number
): Promise<ProgressResponse> {
  return updateLessonProgress(userId, {
    lessonId,
    currentStep: totalSteps,
    totalSteps
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
        module: {
          id: moduleId
        },
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
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResponse> {
  // Buscar todas las lecciones de este módulo que tienen progreso
  // Usamos startsWith para matchear "module-01-leccion-x" con "module-01"
  const progresses = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: {
        startsWith: moduleId
      }
    },
    orderBy: { lastAccess: 'desc' }
  });

  // Obtener total de lecciones del módulo
  const totalLessonsInModule = await getTotalLessonsInModule(moduleId);

  // Calcular lecciones completadas
  const completedLessons = progresses.filter(p => p.completed).length;

  // Calcular porcentaje de completación
  const completionPercentage = totalLessonsInModule > 0
    ? Math.round((completedLessons / totalLessonsInModule) * 100)
    : 0;

  // Calcular tiempo total
  const totalTimeSpent = progresses.reduce((acc, p) => acc + p.timeSpent, 0);

  // Obtener último acceso
  const lastAccess = progresses.length > 0 ? progresses[0].lastAccess : null;

  return {
    moduleId,
    completionPercentage,
    completedLessons,
    totalLessons: totalLessonsInModule,
    totalTimeSpent,
    lastAccess,
    lessons: progresses.map(p => ({
      lessonId: p.lessonId,
      completed: p.completed,
      completionPercentage: p.completionPercentage,
      currentStep: p.currentStep,
      totalSteps: p.totalSteps,
      timeSpent: p.timeSpent,
      lastAccess: p.lastAccess
    }))
  };
}