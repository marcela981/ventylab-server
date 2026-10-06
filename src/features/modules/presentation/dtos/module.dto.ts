/*
 * Funcionalidad: DTOs module.dto
 * Descripción: Define los DTOs ModulePrerequisiteDTO, ModuleDTO, ModuleListItemDTO, ModuleDependentDTO, ModuleDetailDTO, ModuleLessonDTO y otros de la feature de módulos, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class ModulePrerequisiteDTO {
  @ApiProperty({ description: "Prerequisite module ID", example: "respiratory-physiology" })
  public id: string;

  @ApiProperty({ description: "Prerequisite module title", example: "Fisiología respiratoria" })
  public title: string;

  @ApiProperty({ description: "Prerequisite module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Prerequisite module difficulty", example: "prerequisitos", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Prerequisite module category", example: null, nullable: true, type: String })
  public category: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 30, nullable: true, type: Number })
  public estimatedTime: number | null;

  public constructor({ id, title, description, difficulty, category, estimatedTime }: ModulePrerequisiteDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.category = category;
    this.estimatedTime = estimatedTime;
  }
}

export class ModuleDTO {
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

  @ApiProperty({ description: "ID of the last user who modified the module", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public lastModifiedBy: string | null;

  @ApiProperty({ description: "Last modification timestamp", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastModifiedAt: Date | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Number of lessons, active or not", example: 4 })
  public lessonCount: number;

  @ApiProperty({ description: "Color derived from the module difficulty", example: "#4CAF50" })
  public levelColor: string;

  public constructor({ id, levelId, title, description, category, difficulty, estimatedTime, thumbnail, order, isActive, status, color, tags, lastModifiedBy, lastModifiedAt, createdAt, updatedAt, lessonCount, levelColor }: ModuleDTO) {
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
    this.lastModifiedBy = lastModifiedBy;
    this.lastModifiedAt = lastModifiedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lessonCount = lessonCount;
    this.levelColor = levelColor;
  }
}

export class ModuleListItemDTO extends ModuleDTO {
  @ApiProperty({ description: "Prerequisite modules", example: [], type: [ModulePrerequisiteDTO] })
  public prerequisites: ModulePrerequisiteDTO[];

  public constructor({ prerequisites, ...base }: ModuleListItemDTO) {
    super(base);
    this.prerequisites = prerequisites;
  }
}

export class ModuleDependentDTO {
  @ApiProperty({ description: "Dependent module ID", example: "module-02-ecuacion-movimiento" })
  public id: string;

  @ApiProperty({ description: "Dependent module title", example: "Ecuación de movimiento" })
  public title: string;

  public constructor({ id, title }: ModuleDependentDTO) {
    this.id = id;
    this.title = title;
  }
}

export class ModuleDetailDTO extends ModuleDTO {
  @ApiProperty({ description: "Prerequisite modules", example: [], type: [ModulePrerequisiteDTO] })
  public prerequisites: ModulePrerequisiteDTO[];

  @ApiProperty({ description: "Modules that require this module", example: [], type: [ModuleDependentDTO] })
  public dependentModules: ModuleDependentDTO[];

  public constructor({ prerequisites, dependentModules, ...base }: ModuleDetailDTO) {
    super(base);
    this.prerequisites = prerequisites;
    this.dependentModules = dependentModules;
  }
}

export class ModuleLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public id: string;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Lesson slug", example: "introduccion", nullable: true, type: String })
  public slug: string | null;

  @ApiProperty({ description: "Legacy JSON content", example: null, nullable: true, type: String })
  public content: string | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Estimated time in minutes", example: 15, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Whether the lesson was generated with AI", example: false })
  public aiGenerated: boolean;

  @ApiProperty({ description: "Whether the lesson is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Lesson color", example: null, nullable: true, type: String })
  public color: string | null;

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Whether a quiz is required to complete the lesson", example: false })
  public hasRequiredQuiz: boolean;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Number of quizzes", example: 1 })
  public quizCount: number;

  @ApiProperty({ description: "Number of content pages in the legacy JSON content", example: 5 })
  public pageCount: number;

  public constructor({ id, moduleId, title, slug, content, order, estimatedTime, aiGenerated, isActive, status, color, tags, hasRequiredQuiz, createdAt, updatedAt, quizCount, pageCount }: ModuleLessonDTO) {
    this.id = id;
    this.moduleId = moduleId;
    this.title = title;
    this.slug = slug;
    this.content = content;
    this.order = order;
    this.estimatedTime = estimatedTime;
    this.aiGenerated = aiGenerated;
    this.isActive = isActive;
    this.status = status;
    this.color = color;
    this.tags = tags;
    this.hasRequiredQuiz = hasRequiredQuiz;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.quizCount = quizCount;
    this.pageCount = pageCount;
  }
}

export class ModuleLessonsCountDTO {
  @ApiProperty({ description: "Number of lessons in the module", example: 4 })
  public count: number;

  public constructor({ count }: ModuleLessonsCountDTO) {
    this.count = count;
  }
}
