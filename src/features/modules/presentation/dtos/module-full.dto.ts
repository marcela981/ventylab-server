/*
 * Funcionalidad: DTOs del contenido completo de un módulo
 * Descripción: Define ModuleFullDTO con sus lecciones, páginas y bloques (incluida la URL de media resuelta), documentados para Swagger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class ModuleFullBlockDTO {
  @ApiProperty({ description: "Block ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Display order within the page", example: 0 })
  public order: number;

  @ApiProperty({ description: "Block type", example: "TEXT" })
  public type: string;

  @ApiProperty({ description: "Block title", example: null, nullable: true, type: String })
  public title: string | null;

  @ApiProperty({ description: "Block content as stored", example: { doc: { type: "doc", content: [] } } })
  public content: unknown;

  @ApiProperty({ description: "Estimated time in minutes", example: null, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Media ID for image, video or file blocks", example: null, nullable: true, type: String })
  public mediaId: string | null;

  @ApiProperty({ description: "Resolved media URL, null when there is no media or it cannot be resolved", example: null, nullable: true, type: String })
  public mediaUrl: string | null;

  public constructor({ id, order, type, title, content, estimatedTime, mediaId, mediaUrl }: ModuleFullBlockDTO) {
    this.id = id;
    this.order = order;
    this.type = type;
    this.title = title;
    this.content = content;
    this.estimatedTime = estimatedTime;
    this.mediaId = mediaId;
    this.mediaUrl = mediaUrl;
  }
}

export class ModuleFullPageDTO {
  @ApiProperty({ description: "Page ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Lesson ID", example: null, nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Page title", example: "Conceptos" })
  public title: string;

  @ApiProperty({ description: "Page slug", example: "conceptos" })
  public slug: string;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Page type", example: "THEORY" })
  public type: string;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Estimated minutes", example: 10, nullable: true, type: Number })
  public estimatedMinutes: number | null;

  @ApiProperty({ description: "Content blocks", type: [ModuleFullBlockDTO] })
  public blocks: ModuleFullBlockDTO[];

  public constructor({ id, lessonId, title, slug, order, type, status, estimatedMinutes, blocks }: ModuleFullPageDTO) {
    this.id = id;
    this.lessonId = lessonId;
    this.title = title;
    this.slug = slug;
    this.order = order;
    this.type = type;
    this.status = status;
    this.estimatedMinutes = estimatedMinutes;
    this.blocks = blocks;
  }
}

export class ModuleFullLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Lesson slug", example: null, nullable: true, type: String })
  public slug: string | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Estimated time in minutes", example: 15, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Pages of the lesson", type: [ModuleFullPageDTO] })
  public pages: ModuleFullPageDTO[];

  public constructor({ id, title, slug, order, status, estimatedTime, pages }: ModuleFullLessonDTO) {
    this.id = id;
    this.title = title;
    this.slug = slug;
    this.order = order;
    this.status = status;
    this.estimatedTime = estimatedTime;
    this.pages = pages;
  }
}

export class ModuleFullDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Thumbnail URL", example: null, nullable: true, type: String })
  public thumbnail: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Lessons with their pages and blocks", type: [ModuleFullLessonDTO] })
  public lessons: ModuleFullLessonDTO[];

  @ApiProperty({ description: "Pages of the module that are not linked to a lesson", type: [ModuleFullPageDTO] })
  public unassignedPages: ModuleFullPageDTO[];

  public constructor({ id, levelId, title, description, difficulty, estimatedTime, thumbnail, order, status, lessons, unassignedPages }: ModuleFullDTO) {
    this.id = id;
    this.levelId = levelId;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.thumbnail = thumbnail;
    this.order = order;
    this.status = status;
    this.lessons = lessons;
    this.unassignedPages = unassignedPages;
  }
}
