/*
 * Funcionalidad: DTOs del resumen general de progreso
 * Descripción: Define la respuesta del panel del estudiante (estadísticas, módulos, lecciones y niveles con su avance)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class OverviewStatsDTO {
  @ApiProperty({ description: "Number of completed lessons", example: 3 })
  public completedLessons: number;

  @ApiProperty({ description: "Number of active lessons in the listed modules", example: 12 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed modules", example: 1 })
  public modulesCompleted: number;

  @ApiProperty({ description: "Number of listed modules", example: 6 })
  public totalModules: number;

  @ApiProperty({ description: "Experience points from completed lessons", example: 300 })
  public xpTotal: number;

  @ApiProperty({ description: "Current level derived from the experience points", example: 1 })
  public level: number;

  @ApiProperty({ description: "Experience points needed for the next level", example: 500 })
  public nextLevelXp: number;

  @ApiProperty({ description: "Consecutive study days", example: 0 })
  public streakDays: number;

  public constructor({ completedLessons, totalLessons, modulesCompleted, totalModules, xpTotal, level, nextLevelXp, streakDays }: OverviewStatsDTO) {
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.modulesCompleted = modulesCompleted;
    this.totalModules = totalModules;
    this.xpTotal = xpTotal;
    this.level = level;
    this.nextLevelXp = nextLevelXp;
    this.streakDays = streakDays;
  }
}

export class OverviewModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Display order within the level", example: 1 })
  public order: number;

  @ApiProperty({ description: "Number of active lessons", example: 1 })
  public lessonsTotal: number;

  @ApiProperty({ description: "Number of completed lessons", example: 0 })
  public lessonsCompleted: number;

  @ApiProperty({ description: "Progress including partial step progress, 0 to 100", example: 40 })
  public percent: number;

  @ApiProperty({ description: "Whether the module is available (first of its level or previous module completed)", example: true })
  public isAvailable: boolean;

  @ApiProperty({ description: "Whether every active lesson is completed", example: false })
  public completed: boolean;

  public constructor({
    moduleId,
    title,
    levelId,
    description,
    difficulty,
    estimatedTime,
    order,
    lessonsTotal,
    lessonsCompleted,
    percent,
    isAvailable,
    completed,
  }: OverviewModuleDTO) {
    this.moduleId = moduleId;
    this.title = title;
    this.levelId = levelId;
    this.description = description;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.order = order;
    this.lessonsTotal = lessonsTotal;
    this.lessonsCompleted = lessonsCompleted;
    this.percent = percent;
    this.isAvailable = isAvailable;
    this.completed = completed;
  }
}

export class OverviewLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-inversion-fisiologica" })
  public lessonId: string;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Whether the lesson is completed", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Continuous progress from 0 to 1, capped at 0.99 until completed", example: 0.4 })
  public progress: number;

  @ApiProperty({ description: "Experience points earned in the lesson", example: 0 })
  public xpEarned: number;

  @ApiProperty({ description: "When the lesson was last visited", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastVisitedAt: Date | null;

  @ApiProperty({ description: "When the lesson progress was last updated", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public updatedAt: Date | null;

  public constructor({ lessonId, moduleId, completed, progress, xpEarned, lastVisitedAt, updatedAt }: OverviewLessonDTO) {
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.completed = completed;
    this.progress = progress;
    this.xpEarned = xpEarned;
    this.lastVisitedAt = lastVisitedAt;
    this.updatedAt = updatedAt;
  }
}

export class OverviewLevelDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public levelId: string;

  @ApiProperty({ description: "Frontend level key", example: "beginner" })
  public slug: string;

  @ApiProperty({ description: "Level title", example: "Principiante" })
  public title: string;

  @ApiProperty({ description: "Level order", example: 1 })
  public order: number;

  @ApiProperty({ description: "IDs of the level modules", example: ["module-01-inversion-fisiologica"], type: String, isArray: true })
  public moduleIds: string[];

  @ApiProperty({ description: "Number of modules in the level", example: 6 })
  public totalModules: number;

  @ApiProperty({ description: "Number of completed modules", example: 1 })
  public completedModules: number;

  @ApiProperty({ description: "Average of the stored module percentages, 0 to 100", example: 17 })
  public progressPercentage: number;

  @ApiProperty({ description: "Number of active lessons in the level", example: 6 })
  public totalLessons: number;

  @ApiProperty({ description: "Number of completed lessons in the level", example: 1 })
  public completedLessons: number;

  public constructor({ levelId, slug, title, order, moduleIds, totalModules, completedModules, progressPercentage, totalLessons, completedLessons }: OverviewLevelDTO) {
    this.levelId = levelId;
    this.slug = slug;
    this.title = title;
    this.order = order;
    this.moduleIds = moduleIds;
    this.totalModules = totalModules;
    this.completedModules = completedModules;
    this.progressPercentage = progressPercentage;
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
  }
}

export class ProgressOverviewDTO {
  @ApiProperty({ description: "Aggregated statistics", type: () => OverviewStatsDTO })
  public overview: OverviewStatsDTO;

  @ApiProperty({ description: "Active modules ordered by level and module order", type: () => OverviewModuleDTO, isArray: true })
  public modules: OverviewModuleDTO[];

  @ApiProperty({ description: "Active lessons of the listed modules", type: () => OverviewLessonDTO, isArray: true })
  public lessons: OverviewLessonDTO[];

  @ApiProperty({ description: "Hierarchical progress per level", type: () => OverviewLevelDTO, isArray: true })
  public levels: OverviewLevelDTO[];

  public constructor({ overview, modules, lessons, levels }: ProgressOverviewDTO) {
    this.overview = overview;
    this.modules = modules;
    this.lessons = lessons;
    this.levels = levels;
  }
}
