/*
 * Funcionalidad: DTOs de respuesta de progreso
 * Descripción: Define las respuestas de progreso de lección, progreso agregado de módulo, detalle por pasos, punto de reanudación, módulos desbloqueados y verificación de acceso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LessonProgressDTO {
  @ApiProperty({ description: "Lesson ID as requested", example: "lesson-inversion-fisiologica" })
  public lessonId: string;

  @ApiProperty({ description: "Whether the lesson is completed", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Seconds spent in the lesson", example: 300 })
  public timeSpent: number;

  @ApiProperty({ description: "When the lesson was last accessed", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastAccessed: Date | null;

  @ApiProperty({ description: "Step progress, 0 to 100", example: 60 })
  public completionPercentage: number;

  @ApiProperty({ description: "One-based current step, 0 when the lesson was never opened", example: 6 })
  public currentStep: number;

  @ApiProperty({ description: "Number of steps in the lesson, 0 when the lesson was never opened", example: 10 })
  public totalSteps: number;

  public constructor({ lessonId, completed, timeSpent, lastAccessed, completionPercentage, currentStep, totalSteps }: LessonProgressDTO) {
    this.lessonId = lessonId;
    this.completed = completed;
    this.timeSpent = timeSpent;
    this.lastAccessed = lastAccessed;
    this.completionPercentage = completionPercentage;
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;
  }
}

export class ModuleProgressSummaryDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Number of lessons (sub-modules for a composite module)", example: 4 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed lessons (sub-modules for a composite module)", example: 2 })
  public completedLessons: number;

  @ApiProperty({ description: "Module progress, 0 to 100", example: 50 })
  public completionPercentage: number;

  @ApiProperty({ description: "Whether the module is completed", example: false })
  public isModuleCompleted: boolean;

  @ApiProperty({ description: "Seconds spent in the module", example: 1200 })
  public timeSpent: number;

  @ApiProperty({ description: "When the module was completed", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  @ApiProperty({ description: "Per-lesson progress, only filled on the first real-time calculation", type: () => LessonProgressDTO, isArray: true })
  public lessons: LessonProgressDTO[];

  @ApiProperty({ description: "How the summary was obtained", example: "user_progress", enum: ["user_progress", "realtime_calculation", "composite_aggregate", "not_found"] })
  public source: string;

  public constructor({ moduleId, totalLessons, completedLessons, completionPercentage, isModuleCompleted, timeSpent, completedAt, lessons, source }: ModuleProgressSummaryDTO) {
    this.moduleId = moduleId;
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.completionPercentage = completionPercentage;
    this.isModuleCompleted = isModuleCompleted;
    this.timeSpent = timeSpent;
    this.completedAt = completedAt;
    this.lessons = lessons;
    this.source = source;
  }
}

export class LessonProgressDetailsDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-inversion-fisiologica" })
  public lessonId: string;

  @ApiProperty({ description: "Zero-based current step index", example: 5 })
  public currentStepIndex: number;

  @ApiProperty({ description: "Number of steps in the lesson", example: 10 })
  public totalSteps: number;

  @ApiProperty({ description: "Whether the lesson is completed", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Seconds spent in the lesson", example: 300 })
  public timeSpent: number;

  @ApiProperty({ description: "When the lesson was last accessed", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastAccessed: Date | null;

  @ApiProperty({ description: "Step progress, 0 to 100", example: 60 })
  public progressPercentage: number;

  public constructor({ lessonId, currentStepIndex, totalSteps, completed, timeSpent, lastAccessed, progressPercentage }: LessonProgressDetailsDTO) {
    this.lessonId = lessonId;
    this.currentStepIndex = currentStepIndex;
    this.totalSteps = totalSteps;
    this.completed = completed;
    this.timeSpent = timeSpent;
    this.lastAccessed = lastAccessed;
    this.progressPercentage = progressPercentage;
  }
}

export class ProgressResumeDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public moduleName: string;

  @ApiProperty({ description: "Lesson to resume", example: "lesson-inversion-fisiologica" })
  public currentLessonId: string;

  @ApiProperty({ description: "Title of the lesson to resume", example: "Ventilación con presión positiva" })
  public currentLessonTitle: string;

  @ApiProperty({ description: "Order of the lesson to resume", example: 1 })
  public currentLessonOrder: number;

  @ApiProperty({ description: "Zero-based step index to resume at", example: 3 })
  public currentStepIndex: number;

  @ApiProperty({ description: "Number of steps in the lesson to resume", example: 8 })
  public totalStepsInLesson: number;

  @ApiProperty({ description: "Completed active lessons over active lessons, rounded down, 0 to 100", example: 50 })
  public moduleProgress: number;

  @ApiProperty({ description: "Number of active lessons", example: 4 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed active lessons", example: 2 })
  public completedLessons: number;

  @ApiProperty({ description: "Whether every active lesson is completed", example: false })
  public isModuleComplete: boolean;

  @ApiProperty({ description: "When the module was last accessed", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastAccessedAt: Date | null;

  public constructor({
    moduleId,
    moduleName,
    currentLessonId,
    currentLessonTitle,
    currentLessonOrder,
    currentStepIndex,
    totalStepsInLesson,
    moduleProgress,
    totalLessons,
    completedLessons,
    isModuleComplete,
    lastAccessedAt,
  }: ProgressResumeDTO) {
    this.moduleId = moduleId;
    this.moduleName = moduleName;
    this.currentLessonId = currentLessonId;
    this.currentLessonTitle = currentLessonTitle;
    this.currentLessonOrder = currentLessonOrder;
    this.currentStepIndex = currentStepIndex;
    this.totalStepsInLesson = totalStepsInLesson;
    this.moduleProgress = moduleProgress;
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.isModuleComplete = isModuleComplete;
    this.lastAccessedAt = lastAccessedAt;
  }
}

export class UnlockedModulesDTO {
  @ApiProperty({ description: "IDs of the modules the user can open", example: ["module-01-inversion-fisiologica"], type: String, isArray: true })
  public unlockedModuleIds: string[];

  @ApiProperty({ description: "Number of unlocked modules", example: 1 })
  public count: number;

  public constructor({ unlockedModuleIds, count }: UnlockedModulesDTO) {
    this.unlockedModuleIds = unlockedModuleIds;
    this.count = count;
  }
}

export class ModuleAccessDTO {
  @ApiProperty({ description: "Module ID", example: "module-02-ecuacion-movimiento" })
  public moduleId: string;

  @ApiProperty({ description: "Whether the user can open the module", example: true })
  public hasAccess: boolean;

  public constructor({ moduleId, hasAccess }: ModuleAccessDTO) {
    this.moduleId = moduleId;
    this.hasAccess = hasAccess;
  }
}

export class LessonAccessDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-ecuacion-movimiento" })
  public lessonId: string;

  @ApiProperty({ description: "Whether the user can open the lesson", example: false })
  public hasAccess: boolean;

  public constructor({ lessonId, hasAccess }: LessonAccessDTO) {
    this.lessonId = lessonId;
    this.hasAccess = hasAccess;
  }
}
