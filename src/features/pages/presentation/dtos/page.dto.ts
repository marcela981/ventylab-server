/*
 * Funcionalidad: DTOs page.dto
 * Descripción: Define los DTOs PageSectionDTO, PageModuleDTO, PageDTO, PageSummaryDTO, PageLookupDTO, LessonContentSourceDTO de la feature de páginas, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class PageSectionDTO {
  @ApiProperty({ description: "Section ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Page ID", example: "cm5x2k9a00000abcd1234efgi" })
  public pageId: string;

  @ApiProperty({ description: "Display order within the page", example: 0 })
  public order: number;

  @ApiProperty({ description: "Section type", example: "THEORY" })
  public type: string;

  @ApiProperty({ description: "Section title", example: "Conceptos", nullable: true, type: String })
  public title: string | null;

  @ApiProperty({ description: "Section content as stored", example: { markdown: "## Conceptos" } })
  public content: unknown;

  @ApiProperty({ description: "Original JSON section ID", example: "m1-intro-a", nullable: true, type: String })
  public sectionId: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 5, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Whether the section is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Creator user ID", example: null, nullable: true, type: String })
  public createdBy: string | null;

  @ApiProperty({ description: "Last updater user ID", example: null, nullable: true, type: String })
  public updatedBy: string | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Media ID for image, video or file blocks", example: null, nullable: true, type: String })
  public mediaId: string | null;

  @ApiProperty({ description: "Resolved media URL, null when there is no media or it cannot be resolved", example: null, nullable: true, type: String })
  public mediaUrl: string | null;

  public constructor({ id, pageId, order, type, title, content, sectionId, estimatedTime, isActive, mediaId, mediaUrl, createdBy, updatedBy, createdAt, updatedAt }: PageSectionDTO) {
    this.id = id;
    this.pageId = pageId;
    this.order = order;
    this.type = type;
    this.title = title;
    this.content = content;
    this.sectionId = sectionId;
    this.estimatedTime = estimatedTime;
    this.isActive = isActive;
    this.mediaId = mediaId;
    this.mediaUrl = mediaUrl;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class PageModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Whether the module is active", example: true })
  public isActive: boolean;

  public constructor({ id, title, levelId, isActive }: PageModuleDTO) {
    this.id = id;
    this.title = title;
    this.levelId = levelId;
    this.isActive = isActive;
  }
}

export class PageDTO {
  @ApiProperty({ description: "Page ID", example: "cm5x2k9a00000abcd1234efgi" })
  public id: string;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Lesson ID", example: null, nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Page title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Page slug", example: "inversion-fisiologica" })
  public slug: string;

  @ApiProperty({ description: "Display order within the module", example: 1 })
  public order: number;

  @ApiProperty({ description: "Page type", example: "THEORY" })
  public type: string;

  @ApiProperty({ description: "Page description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Page difficulty", example: "INTERMEDIATE" })
  public difficulty: string;

  @ApiProperty({ description: "Bloom taxonomy level", example: "understand", nullable: true, type: String })
  public bloomLevel: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 20, nullable: true, type: Number })
  public estimatedMinutes: number | null;

  @ApiProperty({ description: "Learning objectives", example: [], type: [String] })
  public learningObjectives: string[];

  @ApiProperty({ description: "Prerequisites", example: [], type: [String] })
  public prerequisites: string[];

  @ApiProperty({ description: "Key takeaways", example: [], type: [String] })
  public keyTakeaways: string[];

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Whether a quiz is required", example: false })
  public hasRequiredQuiz: boolean;

  @ApiProperty({ description: "Minimum quiz score", example: null, nullable: true, type: Number })
  public minQuizScore: number | null;

  @ApiProperty({ description: "AI configuration as stored", example: null, nullable: true })
  public aiConfig: unknown;

  @ApiProperty({ description: "Resources as stored", example: null, nullable: true })
  public resources: unknown;

  @ApiProperty({ description: "Content version", example: 1 })
  public version: number;

  @ApiProperty({ description: "Whether the page is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Whether the page is published", example: true })
  public isPublished: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Linked legacy lesson ID", example: null, nullable: true, type: String })
  public legacyLessonId: string | null;

  @ApiProperty({ description: "Original JSON file ID", example: "module-01-inversion-fisiologica", nullable: true, type: String })
  public legacyJsonId: string | null;

  @ApiProperty({ description: "Creator user ID", example: "cm5x2k9a00000abcd1234efgh" })
  public createdBy: string;

  @ApiProperty({ description: "Last updater user ID", example: null, nullable: true, type: String })
  public updatedBy: string | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Publication timestamp", example: null, nullable: true, type: Date })
  public publishedAt: Date | null;

  @ApiProperty({ description: "Active sections ordered by position", example: [], type: [PageSectionDTO] })
  public sections: PageSectionDTO[];

  @ApiProperty({ description: "Module of the page", example: {}, type: PageModuleDTO })
  public module: PageModuleDTO;

  public constructor({ id, moduleId, lessonId, title, slug, order, type, description, difficulty, bloomLevel, estimatedMinutes, learningObjectives, prerequisites, keyTakeaways, tags, hasRequiredQuiz, minQuizScore, aiConfig, resources, version, isActive, isPublished, status, legacyLessonId, legacyJsonId, createdBy, updatedBy, createdAt, updatedAt, publishedAt, sections, module }: PageDTO) {
    this.id = id;
    this.moduleId = moduleId;
    this.lessonId = lessonId;
    this.title = title;
    this.slug = slug;
    this.order = order;
    this.type = type;
    this.description = description;
    this.difficulty = difficulty;
    this.bloomLevel = bloomLevel;
    this.estimatedMinutes = estimatedMinutes;
    this.learningObjectives = learningObjectives;
    this.prerequisites = prerequisites;
    this.keyTakeaways = keyTakeaways;
    this.tags = tags;
    this.hasRequiredQuiz = hasRequiredQuiz;
    this.minQuizScore = minQuizScore;
    this.aiConfig = aiConfig;
    this.resources = resources;
    this.version = version;
    this.isActive = isActive;
    this.isPublished = isPublished;
    this.status = status;
    this.legacyLessonId = legacyLessonId;
    this.legacyJsonId = legacyJsonId;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.publishedAt = publishedAt;
    this.sections = sections;
    this.module = module;
  }
}

export class PageSummaryDTO {
  @ApiProperty({ description: "Page ID", example: "cm5x2k9a00000abcd1234efgi" })
  public id: string;

  @ApiProperty({ description: "Lesson ID", example: null, nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Page title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Page slug", example: "inversion-fisiologica" })
  public slug: string;

  @ApiProperty({ description: "Display order within the module", example: 1 })
  public order: number;

  @ApiProperty({ description: "Page type", example: "THEORY" })
  public type: string;

  @ApiProperty({ description: "Page difficulty", example: "INTERMEDIATE" })
  public difficulty: string;

  @ApiProperty({ description: "Estimated time in minutes", example: 20, nullable: true, type: Number })
  public estimatedMinutes: number | null;

  @ApiProperty({ description: "Learning objectives", example: [], type: [String] })
  public learningObjectives: string[];

  @ApiProperty({ description: "Whether a quiz is required", example: false })
  public hasRequiredQuiz: boolean;

  @ApiProperty({ description: "Linked legacy lesson ID", example: null, nullable: true, type: String })
  public legacyLessonId: string | null;

  @ApiProperty({ description: "Original JSON file ID", example: "module-01-inversion-fisiologica", nullable: true, type: String })
  public legacyJsonId: string | null;

  public constructor({ id, lessonId, status, title, slug, order, type, difficulty, estimatedMinutes, learningObjectives, hasRequiredQuiz, legacyLessonId, legacyJsonId }: PageSummaryDTO) {
    this.id = id;
    this.lessonId = lessonId;
    this.status = status;
    this.title = title;
    this.slug = slug;
    this.order = order;
    this.type = type;
    this.difficulty = difficulty;
    this.estimatedMinutes = estimatedMinutes;
    this.learningObjectives = learningObjectives;
    this.hasRequiredQuiz = hasRequiredQuiz;
    this.legacyLessonId = legacyLessonId;
    this.legacyJsonId = legacyJsonId;
  }
}

export class PageLookupDTO {
  @ApiProperty({ description: "Whether the legacy JSON lesson was migrated to a published page", example: true })
  public migrated: boolean;

  @ApiProperty({ description: "Requested legacy JSON ID", example: "module-01-inversion-fisiologica" })
  public legacyJsonId: string;

  @ApiProperty({ description: "Published page, when migrated", example: null, nullable: true, type: PageDTO })
  public page: PageDTO | null;

  public constructor({ migrated, legacyJsonId, page }: PageLookupDTO) {
    this.migrated = migrated;
    this.legacyJsonId = legacyJsonId;
    this.page = page;
  }
}

export class LessonContentSourceDTO {
  @ApiProperty({ description: "Where the lesson content comes from: page or lesson", example: "page", enum: ["page", "lesson"] })
  public source: string;

  @ApiProperty({ description: "Requested lesson ID", example: "module-01-inversion-fisiologica" })
  public lessonId: string;

  @ApiProperty({ description: "Published page, when the source is page", example: null, nullable: true, type: PageDTO })
  public page: PageDTO | null;

  public constructor({ source, lessonId, page }: LessonContentSourceDTO) {
    this.source = source;
    this.lessonId = lessonId;
    this.page = page;
  }
}
