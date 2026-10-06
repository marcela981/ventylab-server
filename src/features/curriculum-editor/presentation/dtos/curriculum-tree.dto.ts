/*
 * Funcionalidad: DTO del árbol del currículo
 * Descripción: Define la forma documentada en Swagger del árbol recursivo de niveles, módulos y lecciones que consume el editor del currículo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class CurriculumTreeLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public id: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Lesson slug", example: "introduccion", nullable: true, type: String })
  public slug: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Lesson color", example: null, nullable: true, type: String })
  public color: string | null;

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Whether the lesson is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Estimated time in minutes", example: 15, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Notion-style content blocks", example: [], nullable: true })
  public blocks: unknown;

  public constructor({ id, title, slug, order, color, tags, isActive, status, estimatedTime, blocks }: CurriculumTreeLessonDTO) {
    this.id = id;
    this.title = title;
    this.slug = slug;
    this.order = order;
    this.color = color;
    this.tags = tags;
    this.isActive = isActive;
    this.status = status;
    this.estimatedTime = estimatedTime;
    this.blocks = blocks;
  }
}

export class CurriculumTreeModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Owning level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module category", example: null, nullable: true, type: String })
  public category: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 60, nullable: true, type: Number })
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

  @ApiProperty({ description: "Creation timestamp", example: "2026-03-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Lessons of the module", type: [CurriculumTreeLessonDTO] })
  public lessons: CurriculumTreeLessonDTO[];

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
    lessons,
  }: CurriculumTreeModuleDTO) {
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
    this.lessons = lessons;
  }
}

export class CurriculumTreeLevelDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public id: string;

  @ApiProperty({ description: "Level title", example: "Nivel principiante" })
  public title: string;

  @ApiProperty({ description: "Curriculum track", example: "mecanica" })
  public track: string;

  @ApiProperty({ description: "Level description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Whether the level is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Level color", example: null, nullable: true, type: String })
  public color: string | null;

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Parent level ID", example: null, nullable: true, type: String })
  public parentId: string | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-03-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Modules owned by the level", type: [CurriculumTreeModuleDTO] })
  public modules: CurriculumTreeModuleDTO[];

  @ApiProperty({ description: "Sublevels, with the same recursive shape", type: "array", items: { type: "object" } })
  public children: CurriculumTreeLevelDTO[];

  public constructor({
    id,
    title,
    track,
    description,
    order,
    isActive,
    status,
    color,
    tags,
    parentId,
    createdAt,
    updatedAt,
    modules,
    children,
  }: CurriculumTreeLevelDTO) {
    this.id = id;
    this.title = title;
    this.track = track;
    this.description = description;
    this.order = order;
    this.isActive = isActive;
    this.status = status;
    this.color = color;
    this.tags = tags;
    this.parentId = parentId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.modules = modules;
    this.children = children;
  }
}
