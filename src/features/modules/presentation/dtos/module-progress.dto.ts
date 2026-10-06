/*
 * Funcionalidad: DTOs module-progress.dto
 * Descripción: Define los DTOs ModuleProgressRecordDTO, ModuleProgressModuleDTO, ModuleProgressStatisticsDTO, ModuleProgressLessonDTO, ModuleLessonProgressDTO, ModuleProgressDTO y otros de la feature de módulos, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class ModuleProgressRecordDTO {
  @ApiProperty({ description: "User progress record ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Module completion timestamp", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  @ApiProperty({ description: "Time spent in the module, in seconds", example: 1200 })
  public timeSpent: number;

  public constructor({ id, completedAt, timeSpent }: ModuleProgressRecordDTO) {
    this.id = id;
    this.completedAt = completedAt;
    this.timeSpent = timeSpent;
  }
}

export class ModuleProgressModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  public constructor({ id, title, estimatedTime }: ModuleProgressModuleDTO) {
    this.id = id;
    this.title = title;
    this.estimatedTime = estimatedTime;
  }
}

export class ModuleProgressStatisticsDTO {
  @ApiProperty({ description: "Number of lessons", example: 4 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed lessons", example: 2 })
  public completedLessons: number;

  @ApiProperty({ description: "Completed lessons over total lessons, rounded, 0 to 100", example: 50 })
  public completionPercentage: number;

  @ApiProperty({ description: "Number of lessons left", example: 2 })
  public remainingLessons: number;

  public constructor({ totalLessons, completedLessons, completionPercentage, remainingLessons }: ModuleProgressStatisticsDTO) {
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.completionPercentage = completionPercentage;
    this.remainingLessons = remainingLessons;
  }
}

export class ModuleProgressLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public id: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Estimated time in minutes", example: 15, nullable: true, type: Number })
  public estimatedTime: number | null;

  public constructor({ id, title, order, estimatedTime }: ModuleProgressLessonDTO) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.estimatedTime = estimatedTime;
  }
}

export class ModuleLessonProgressDTO {
  @ApiProperty({ description: "Lesson", example: {}, type: ModuleProgressLessonDTO })
  public lesson: ModuleProgressLessonDTO;

  @ApiProperty({ description: "Whether the lesson is completed", example: true })
  public completed: boolean;

  @ApiProperty({ description: "Time spent in the lesson, in seconds", example: 300 })
  public timeSpent: number;

  @ApiProperty({ description: "Last access timestamp", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastAccessed: Date | null;

  public constructor({ lesson, completed, timeSpent, lastAccessed }: ModuleLessonProgressDTO) {
    this.lesson = lesson;
    this.completed = completed;
    this.timeSpent = timeSpent;
    this.lastAccessed = lastAccessed;
  }
}

export class ModuleProgressDTO {
  @ApiProperty({ description: "User progress record", example: {}, type: ModuleProgressRecordDTO })
  public progress: ModuleProgressRecordDTO;

  @ApiProperty({ description: "Module", example: {}, type: ModuleProgressModuleDTO })
  public module: ModuleProgressModuleDTO;

  @ApiProperty({ description: "Progress statistics", example: {}, type: ModuleProgressStatisticsDTO })
  public statistics: ModuleProgressStatisticsDTO;

  @ApiProperty({ description: "Progress of each lesson", example: [], type: [ModuleLessonProgressDTO] })
  public lessonProgress: ModuleLessonProgressDTO[];

  public constructor({ progress, module, statistics, lessonProgress }: ModuleProgressDTO) {
    this.progress = progress;
    this.module = module;
    this.statistics = statistics;
    this.lessonProgress = lessonProgress;
  }
}

export class ModuleResumeDTO {
  @ApiProperty({ description: "Lesson to resume", example: "lesson-02" })
  public resumeLessonId: string;

  @ApiProperty({ description: "Title of the lesson to resume", example: "Ecuación de movimiento" })
  public resumeLessonTitle: string;

  @ApiProperty({ description: "Module progress, 0 to 100", example: 50 })
  public resumeLessonProgress: number;

  @ApiProperty({ description: "Order of the lesson to resume", example: 1 })
  public resumeLessonOrder: number;

  @ApiProperty({ description: "Completed active lessons over active lessons, rounded down, 0 to 100", example: 50 })
  public moduleProgress: number;

  @ApiProperty({ description: "Number of active lessons", example: 4 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed active lessons", example: 2 })
  public completedLessons: number;

  @ApiProperty({ description: "Order after the lesson to resume", example: 2 })
  public nextLessonOrder: number;

  @ApiProperty({ description: "Zero-based step index to resume at", example: 3 })
  public currentStepIndex: number;

  @ApiProperty({ description: "Number of steps in the lesson to resume", example: 8 })
  public totalStepsInLesson: number;

  @ApiProperty({ description: "Whether every active lesson is completed", example: false })
  public isModuleComplete: boolean;

  @ApiProperty({ description: "When the module was last accessed", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastAccessedAt: Date | null;

  public constructor({ resumeLessonId, resumeLessonTitle, resumeLessonProgress, resumeLessonOrder, moduleProgress, totalLessons, completedLessons, nextLessonOrder, currentStepIndex, totalStepsInLesson, isModuleComplete, lastAccessedAt }: ModuleResumeDTO) {
    this.resumeLessonId = resumeLessonId;
    this.resumeLessonTitle = resumeLessonTitle;
    this.resumeLessonProgress = resumeLessonProgress;
    this.resumeLessonOrder = resumeLessonOrder;
    this.moduleProgress = moduleProgress;
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.nextLessonOrder = nextLessonOrder;
    this.currentStepIndex = currentStepIndex;
    this.totalStepsInLesson = totalStepsInLesson;
    this.isModuleComplete = isModuleComplete;
    this.lastAccessedAt = lastAccessedAt;
  }
}
