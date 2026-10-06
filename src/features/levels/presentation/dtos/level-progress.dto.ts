/*
 * Funcionalidad: DTOs level-progress.dto
 * Descripción: Define los DTOs LevelCurriculumModuleDTO, LevelCurriculumDTO, PrerequisiteStatusDTO, LevelUnlockStatusDTO, LevelRoadmapNodeDTO de la feature de niveles, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LevelCurriculumModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: "Fundamentos", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Module category", example: "pathologies", nullable: true, type: String })
  public category: string | null;

  @ApiProperty({ description: "User progress in the module, 0 to 100", example: 50 })
  public progressPercentage: number;

  @ApiProperty({ description: "Whether the user completed the module", example: false })
  public isCompleted: boolean;

  @ApiProperty({ description: "Number of active lessons", example: 4 })
  public lessonCount: number;

  public constructor({
    id,
    title,
    description,
    difficulty,
    estimatedTime,
    order,
    category,
    progressPercentage,
    isCompleted,
    lessonCount,
  }: LevelCurriculumModuleDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.order = order;
    this.category = category;
    this.progressPercentage = progressPercentage;
    this.isCompleted = isCompleted;
    this.lessonCount = lessonCount;
  }
}

export class LevelCurriculumDTO {
  @ApiProperty({ description: "Frontend level slug", example: "beginner" })
  public id: string;

  @ApiProperty({ description: "Database level ID", example: "level-beginner" })
  public dbId: string;

  @ApiProperty({ description: "Curriculum track", example: "mecanica" })
  public track: string;

  @ApiProperty({ description: "Level title", example: "Nivel principiante" })
  public title: string;

  @ApiProperty({ description: "Level description", example: "Fundamentos", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Level color", example: "#4CAF50" })
  public color: string;

  @ApiProperty({ description: "Level emoji", example: "🌱" })
  public emoji: string;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Active modules with user progress", type: [LevelCurriculumModuleDTO] })
  public modules: LevelCurriculumModuleDTO[];

  @ApiProperty({ description: "Number of active modules", example: 6 })
  public totalModules: number;

  @ApiProperty({ description: "Number of completed modules", example: 2 })
  public completedModules: number;

  @ApiProperty({ description: "Average module progress, 0 to 100", example: 33 })
  public progressPercentage: number;

  @ApiProperty({ description: "Whether every module is completed", example: false })
  public isCompleted: boolean;

  @ApiProperty({ description: "Whether every prerequisite level is completed", example: true })
  public isUnlocked: boolean;

  public constructor({
    id,
    dbId,
    track,
    title,
    description,
    color,
    emoji,
    order,
    modules,
    totalModules,
    completedModules,
    progressPercentage,
    isCompleted,
    isUnlocked,
  }: LevelCurriculumDTO) {
    this.id = id;
    this.dbId = dbId;
    this.track = track;
    this.title = title;
    this.description = description;
    this.color = color;
    this.emoji = emoji;
    this.order = order;
    this.modules = modules;
    this.totalModules = totalModules;
    this.completedModules = completedModules;
    this.progressPercentage = progressPercentage;
    this.isCompleted = isCompleted;
    this.isUnlocked = isUnlocked;
  }
}

export class PrerequisiteStatusDTO {
  @ApiProperty({ description: "Prerequisite level ID", example: "level-beginner" })
  public levelId: string;

  @ApiProperty({ description: "Prerequisite level title", example: "Nivel principiante" })
  public levelTitle: string;

  @ApiProperty({ description: "Whether the user completed the prerequisite", example: false })
  public isCompleted: boolean;

  @ApiProperty({ description: "Completed modules over total modules, 0 to 100", example: 50 })
  public completionPercentage: number;

  @ApiProperty({ description: "Completion timestamp", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor({ levelId, levelTitle, isCompleted, completionPercentage, completedAt }: PrerequisiteStatusDTO) {
    this.levelId = levelId;
    this.levelTitle = levelTitle;
    this.isCompleted = isCompleted;
    this.completionPercentage = completionPercentage;
    this.completedAt = completedAt;
  }
}

export class LevelUnlockStatusDTO {
  @ApiProperty({ description: "Whether the level is locked", example: true })
  public isLocked: boolean;

  @ApiProperty({ description: "When the level was unlocked", example: null, nullable: true, type: Date })
  public unlockedAt: Date | null;

  @ApiProperty({ description: "When the level was completed", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  @ApiProperty({ description: "Status of each active prerequisite", type: [PrerequisiteStatusDTO] })
  public prerequisites: PrerequisiteStatusDTO[];

  @ApiProperty({ description: "Why the level is locked", example: "Complete the following levels: Nivel principiante", nullable: true, type: String })
  public lockReason: string | null;

  public constructor({ isLocked, unlockedAt, completedAt, prerequisites, lockReason }: LevelUnlockStatusDTO) {
    this.isLocked = isLocked;
    this.unlockedAt = unlockedAt;
    this.completedAt = completedAt;
    this.prerequisites = prerequisites;
    this.lockReason = lockReason;
  }
}

export class LevelRoadmapNodeDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public levelId: string;

  @ApiProperty({ description: "Level title", example: "Nivel principiante" })
  public levelTitle: string;

  @ApiProperty({ description: "Level description", example: "Fundamentos", nullable: true, type: String })
  public levelDescription: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the level is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Unlock status of the level", type: LevelUnlockStatusDTO })
  public unlockStatus: LevelUnlockStatusDTO;

  @ApiProperty({ description: "Number of modules in the level", example: 6 })
  public moduleCount: number;

  @ApiProperty({ description: "Number of completed modules", example: 2 })
  public completedModules: number;

  @ApiProperty({ description: "Level progress, 0 to 100", example: 33 })
  public levelProgress: number;

  public constructor({
    levelId,
    levelTitle,
    levelDescription,
    order,
    isActive,
    unlockStatus,
    moduleCount,
    completedModules,
    levelProgress,
  }: LevelRoadmapNodeDTO) {
    this.levelId = levelId;
    this.levelTitle = levelTitle;
    this.levelDescription = levelDescription;
    this.order = order;
    this.isActive = isActive;
    this.unlockStatus = unlockStatus;
    this.moduleCount = moduleCount;
    this.completedModules = completedModules;
    this.levelProgress = levelProgress;
  }
}
