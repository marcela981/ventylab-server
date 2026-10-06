/*
 * Funcionalidad: DTOs de progreso por páginas
 * Descripción: Define las respuestas del registro de vista de página y del progreso ponderado por lecciones de módulos, niveles, secciones y el resumen del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class PageViewResultDTO {
  @ApiProperty({ description: "Viewed page ID", example: "cm1page000001" })
  public pageId: string;

  @ApiProperty({ description: "Lesson the page belongs to", example: "cm1lesson00001", nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "When the user first viewed the page; repeated views keep it", example: "2026-10-05T14:20:00.000Z", type: Date })
  public firstViewedAt: Date;

  @ApiProperty({ description: "When the user last viewed the page", example: "2026-10-05T15:00:00.000Z", type: Date })
  public lastVisitedAt: Date;

  @ApiProperty({ description: "Whether the lesson is completed after this view", example: false })
  public lessonCompleted: boolean;

  @ApiProperty({ description: "Whether this view completed the lesson", example: false })
  public lessonJustCompleted: boolean;

  @ApiProperty({ description: "Published pages of the lesson viewed by the user", example: 3 })
  public viewedPages: number;

  @ApiProperty({ description: "Published pages of the lesson", example: 5 })
  public totalPages: number;

  public constructor({ pageId, lessonId, firstViewedAt, lastVisitedAt, lessonCompleted, lessonJustCompleted, viewedPages, totalPages }: PageViewResultDTO) {
    this.pageId = pageId;
    this.lessonId = lessonId;
    this.firstViewedAt = firstViewedAt;
    this.lastVisitedAt = lastVisitedAt;
    this.lessonCompleted = lessonCompleted;
    this.lessonJustCompleted = lessonJustCompleted;
    this.viewedPages = viewedPages;
    this.totalPages = totalPages;
  }
}

export class LessonPageProgressDTO {
  @ApiProperty({ description: "Lesson ID", example: "cm1lesson00001" })
  public lessonId: string;

  @ApiProperty({ description: "Published pages viewed by the user", example: 3 })
  public viewedPages: number;

  @ApiProperty({ description: "Published pages of the lesson; 0 means the lesson cannot be completed by pages", example: 5 })
  public totalPages: number;

  @ApiProperty({ description: "Whether every published page was viewed", example: false })
  public completedByPages: boolean;

  @ApiProperty({ description: "Whether the lesson is completed (all pages viewed or an earlier recorded completion)", example: false })
  public completed: boolean;

  public constructor({ lessonId, viewedPages, totalPages, completedByPages, completed }: LessonPageProgressDTO) {
    this.lessonId = lessonId;
    this.viewedPages = viewedPages;
    this.totalPages = totalPages;
    this.completedByPages = completedByPages;
    this.completed = completed;
  }
}

export class ModuleProgressItemDTO {
  @ApiProperty({ description: "Module ID", example: "cm1module00001" })
  public moduleId: string;

  @ApiProperty({ description: "Level the module belongs to", example: "cm1level000001", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Completed published lessons", example: 2 })
  public completedLessons: number;

  @ApiProperty({ description: "Published lessons", example: 4 })
  public totalLessons: number;

  @ApiProperty({ description: "Completed lessons over lessons, 0 to 100, rounded down", example: 50 })
  public percentage: number;

  @ApiProperty({ description: "Whether the module is at 100%", example: false })
  public completed: boolean;

  public constructor({ moduleId, levelId, completedLessons, totalLessons, percentage, completed }: ModuleProgressItemDTO) {
    this.moduleId = moduleId;
    this.levelId = levelId;
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.percentage = percentage;
    this.completed = completed;
  }
}

export class ModuleLearningProgressDTO extends ModuleProgressItemDTO {
  @ApiProperty({ description: "Per-lesson page progress", type: () => LessonPageProgressDTO, isArray: true })
  public lessons: LessonPageProgressDTO[];

  public constructor({ lessons, ...item }: ModuleLearningProgressDTO) {
    super(item);
    this.lessons = lessons;
  }
}

export class LevelProgressItemDTO {
  @ApiProperty({ description: "Level ID", example: "cm1level000001" })
  public levelId: string;

  @ApiProperty({ description: "Section the level belongs to", example: "cm1section0001", nullable: true, type: String })
  public sectionId: string | null;

  @ApiProperty({ description: "Completed published lessons in the level", example: 3 })
  public completedLessons: number;

  @ApiProperty({ description: "Published lessons in the level", example: 12 })
  public totalLessons: number;

  @ApiProperty({ description: "Lesson-weighted progress, 0 to 100, rounded down (not an average of module percentages)", example: 25 })
  public percentage: number;

  @ApiProperty({ description: "Whether the level is at 100%", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Completed published modules", example: 1 })
  public completedModules: number;

  @ApiProperty({ description: "Published modules", example: 3 })
  public totalModules: number;

  public constructor({ levelId, sectionId, completedLessons, totalLessons, percentage, completed, completedModules, totalModules }: LevelProgressItemDTO) {
    this.levelId = levelId;
    this.sectionId = sectionId;
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.percentage = percentage;
    this.completed = completed;
    this.completedModules = completedModules;
    this.totalModules = totalModules;
  }
}

export class LevelLearningProgressDTO extends LevelProgressItemDTO {
  @ApiProperty({ description: "Progress of each published module of the level", type: () => ModuleProgressItemDTO, isArray: true })
  public modules: ModuleProgressItemDTO[];

  public constructor({ modules, ...item }: LevelLearningProgressDTO) {
    super(item);
    this.modules = modules;
  }
}

export class SectionProgressItemDTO {
  @ApiProperty({ description: "Section ID", example: "cm1section0001" })
  public sectionId: string;

  @ApiProperty({ description: "Completed published lessons in the section", example: 3 })
  public completedLessons: number;

  @ApiProperty({ description: "Published lessons in the section", example: 30 })
  public totalLessons: number;

  @ApiProperty({ description: "Lesson-weighted progress, 0 to 100, rounded down", example: 10 })
  public percentage: number;

  @ApiProperty({ description: "Whether the section is at 100%", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Completed published levels", example: 0 })
  public completedLevels: number;

  @ApiProperty({ description: "Published levels", example: 4 })
  public totalLevels: number;

  public constructor({ sectionId, completedLessons, totalLessons, percentage, completed, completedLevels, totalLevels }: SectionProgressItemDTO) {
    this.sectionId = sectionId;
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.percentage = percentage;
    this.completed = completed;
    this.completedLevels = completedLevels;
    this.totalLevels = totalLevels;
  }
}

export class SectionLearningProgressDTO extends SectionProgressItemDTO {
  @ApiProperty({ description: "Progress of each published level of the section", type: () => LevelProgressItemDTO, isArray: true })
  public levels: LevelProgressItemDTO[];

  public constructor({ levels, ...item }: SectionLearningProgressDTO) {
    super(item);
    this.levels = levels;
  }
}

export class LearningProgressSummaryDTO {
  @ApiProperty({ description: "Completed published lessons", example: 8 })
  public completedLessons: number;

  @ApiProperty({ description: "Published lessons", example: 60 })
  public totalLessons: number;

  @ApiProperty({ description: "Lesson-weighted progress over all published content, 0 to 100, rounded down", example: 13 })
  public percentage: number;

  @ApiProperty({ description: "Whether every published lesson is completed", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Progress of each published section", type: () => SectionProgressItemDTO, isArray: true })
  public sections: SectionProgressItemDTO[];

  @ApiProperty({ description: "Progress of each published level", type: () => LevelProgressItemDTO, isArray: true })
  public levels: LevelProgressItemDTO[];

  @ApiProperty({ description: "Progress of each published module", type: () => ModuleProgressItemDTO, isArray: true })
  public modules: ModuleProgressItemDTO[];

  public constructor({ completedLessons, totalLessons, percentage, completed, sections, levels, modules }: LearningProgressSummaryDTO) {
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.percentage = percentage;
    this.completed = completed;
    this.sections = sections;
    this.levels = levels;
    this.modules = modules;
  }
}
