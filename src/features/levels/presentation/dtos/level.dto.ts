/*
 * Funcionalidad: DTOs level.dto
 * Descripción: Define los DTOs LevelDTO, LevelDetailModuleDTO, LevelDetailDTO, LevelModuleDTO, LevelPrerequisiteItemDTO, LevelPrerequisitesDTO y otros de la feature de niveles, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LevelDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public id: string;

  @ApiProperty({ description: "Level title", example: "Nivel principiante" })
  public title: string;

  @ApiProperty({ description: "Curriculum track", example: "mecanica" })
  public track: string;

  @ApiProperty({ description: "Level description", example: "Fundamentos", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the level is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Section ID", example: null, nullable: true, type: String })
  public sectionId: string | null;

  @ApiProperty({ description: "Card color derived from the difficulty of the first module", example: "#4CAF50" })
  public color: string;

  @ApiProperty({ description: "Tags", example: ["core"], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Parent level ID in the curriculum tree", example: null, nullable: true, type: String })
  public parentId: string | null;

  @ApiProperty({ description: "ID of the last user who modified the level", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public lastModifiedBy: string | null;

  @ApiProperty({ description: "Last modification timestamp", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastModifiedAt: Date | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Number of modules in the level, active or not", example: 6 })
  public moduleCount: number;

  public constructor({
    id,
    title,
    track,
    description,
    order,
    isActive,
    status,
    sectionId,
    color,
    tags,
    parentId,
    lastModifiedBy,
    lastModifiedAt,
    createdAt,
    updatedAt,
    moduleCount,
  }: LevelDTO) {
    this.id = id;
    this.title = title;
    this.track = track;
    this.description = description;
    this.order = order;
    this.isActive = isActive;
    this.status = status;
    this.sectionId = sectionId;
    this.color = color;
    this.tags = tags;
    this.parentId = parentId;
    this.lastModifiedBy = lastModifiedBy;
    this.lastModifiedAt = lastModifiedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.moduleCount = moduleCount;
  }
}

export class LevelDetailModuleDTO {
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

  @ApiProperty({ description: "Thumbnail URL", example: null, nullable: true, type: String })
  public thumbnail: string | null;

  @ApiProperty({ description: "Number of lessons", example: 4 })
  public lessonCount: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  public constructor({ id, title, description, difficulty, estimatedTime, order, thumbnail, status, lessonCount }: LevelDetailModuleDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.order = order;
    this.thumbnail = thumbnail;
    this.status = status;
    this.lessonCount = lessonCount;
  }
}

export class LevelDetailDTO extends LevelDTO {
  @ApiProperty({ description: "Active modules of the level", type: [LevelDetailModuleDTO] })
  public modules: LevelDetailModuleDTO[];

  public constructor({ modules, ...level }: LevelDetailDTO) {
    super(level);
    this.modules = modules;
  }
}

export class LevelModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: "Fundamentos", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module category", example: null, nullable: true, type: String })
  public category: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Thumbnail URL", example: null, nullable: true, type: String })
  public thumbnail: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the module is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Module color", example: null, nullable: true, type: String })
  public color: string | null;

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Number of lessons", example: 4 })
  public lessonCount: number;

  @ApiProperty({ description: "Prerequisite modules", example: [{ id: "respiratory-physiology", title: "Fisiología respiratoria" }] })
  public prerequisites: { id: string; title: string }[];

  @ApiProperty({ description: "Color derived from the module difficulty", example: "#4CAF50" })
  public levelColor: string;

  public constructor({
    id,
    levelId,
    title,
    description,
    category,
    difficulty,
    estimatedTime,
    thumbnail,
    order,
    isActive,
    status,
    color,
    tags,
    createdAt,
    updatedAt,
    lessonCount,
    prerequisites,
    levelColor,
  }: LevelModuleDTO) {
    this.id = id;
    this.levelId = levelId;
    this.title = title;
    this.description = description;
    this.category = category;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.thumbnail = thumbnail;
    this.order = order;
    this.isActive = isActive;
    this.status = status;
    this.color = color;
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lessonCount = lessonCount;
    this.prerequisites = prerequisites;
    this.levelColor = levelColor;
  }
}

export class LevelPrerequisiteItemDTO {
  @ApiProperty({ description: "Prerequisite relation ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Related level ID", example: "level-beginner" })
  public levelId: string;

  @ApiProperty({ description: "Related level title", example: "Nivel principiante" })
  public levelTitle: string;

  @ApiProperty({ description: "Related level order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the related level is active", example: true })
  public isActive: boolean;

  public constructor({ id, levelId, levelTitle, order, isActive }: LevelPrerequisiteItemDTO) {
    this.id = id;
    this.levelId = levelId;
    this.levelTitle = levelTitle;
    this.order = order;
    this.isActive = isActive;
  }
}

export class LevelPrerequisitesDTO {
  @ApiProperty({ description: "Level ID", example: "level-intermedio" })
  public levelId: string;

  @ApiProperty({ description: "Level title", example: "Nivel intermedio" })
  public levelTitle: string;

  @ApiProperty({ description: "Levels that must be completed first", type: [LevelPrerequisiteItemDTO] })
  public prerequisites: LevelPrerequisiteItemDTO[];

  @ApiProperty({ description: "Levels that require this level", type: [LevelPrerequisiteItemDTO] })
  public dependentLevels: LevelPrerequisiteItemDTO[];

  public constructor({ levelId, levelTitle, prerequisites, dependentLevels }: LevelPrerequisitesDTO) {
    this.levelId = levelId;
    this.levelTitle = levelTitle;
    this.prerequisites = prerequisites;
    this.dependentLevels = dependentLevels;
  }
}

export class CanDeleteLevelDTO {
  @ApiProperty({ description: "Whether the level can be deleted", example: false })
  public canDelete: boolean;

  @ApiProperty({ description: "Reason code when it cannot be deleted", example: "level_is_prerequisite", nullable: true, type: String })
  public reason: string | null;

  @ApiProperty({ description: "Titles of active levels that depend on this level", example: ["Nivel intermedio"], nullable: true, type: [String] })
  public dependentLevels: string[] | null;

  @ApiProperty({ description: "Whether students have progress in the level", example: false })
  public hasStudentProgress: boolean;

  public constructor({ canDelete, reason, dependentLevels, hasStudentProgress }: CanDeleteLevelDTO) {
    this.canDelete = canDelete;
    this.reason = reason;
    this.dependentLevels = dependentLevels;
    this.hasStudentProgress = hasStudentProgress;
  }
}
