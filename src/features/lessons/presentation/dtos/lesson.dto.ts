/*
 * Funcionalidad: DTOs lesson.dto
 * Descripción: Define los DTOs LessonDTO, LessonModuleDTO, LessonQuizDTO, LessonDetailDTO, LessonNeighborModuleDTO, LessonNeighborDTO y otros de la feature de lecciones, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LessonDTO {
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

  @ApiProperty({ description: "Display order within the module", example: 0 })
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

  @ApiProperty({ description: "ID of the last user who modified the lesson", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public lastModifiedBy: string | null;

  @ApiProperty({ description: "Last modification timestamp", example: "2026-03-10T14:20:00.000Z", nullable: true, type: Date })
  public lastModifiedAt: Date | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Number of content pages in the legacy JSON content", example: 5 })
  public pageCount: number;

  public constructor({ id, moduleId, title, slug, content, order, estimatedTime, aiGenerated, isActive, status, color, tags, hasRequiredQuiz, lastModifiedBy, lastModifiedAt, createdAt, updatedAt, pageCount }: LessonDTO) {
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
    this.lastModifiedBy = lastModifiedBy;
    this.lastModifiedAt = lastModifiedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.pageCount = pageCount;
  }
}

export class LessonModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Module order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the module is active", example: true })
  public isActive: boolean;

  public constructor({ id, levelId, title, difficulty, order, isActive }: LessonModuleDTO) {
    this.id = id;
    this.levelId = levelId;
    this.title = title;
    this.difficulty = difficulty;
    this.order = order;
    this.isActive = isActive;
  }
}

export class LessonQuizDTO {
  @ApiProperty({ description: "Quiz ID", example: "quiz-01" })
  public id: string;

  @ApiProperty({ description: "Quiz title", example: "Evaluación" })
  public title: string;

  @ApiProperty({ description: "Quiz description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Quiz questions as stored", example: [] })
  public questions: unknown;

  @ApiProperty({ description: "Passing score, 0 to 100", example: 70 })
  public passingScore: number;

  @ApiProperty({ description: "Time limit in minutes", example: null, nullable: true, type: Number })
  public timeLimit: number | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Whether the quiz is active", example: true })
  public isActive: boolean;

  public constructor({ id, title, description, questions, passingScore, timeLimit, order, isActive }: LessonQuizDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.questions = questions;
    this.passingScore = passingScore;
    this.timeLimit = timeLimit;
    this.order = order;
    this.isActive = isActive;
  }
}

export class LessonDetailDTO extends LessonDTO {
  @ApiProperty({ description: "Prompt used to generate the lesson", example: null, nullable: true, type: String })
  public sourcePrompt: string | null;

  @ApiProperty({ description: "Notion-style content blocks", example: null, nullable: true })
  public blocks: unknown;

  @ApiProperty({ description: "Module of the lesson", example: {}, type: LessonModuleDTO })
  public module: LessonModuleDTO;

  @ApiProperty({ description: "Quizzes ordered by position", example: [], type: [LessonQuizDTO] })
  public quizzes: LessonQuizDTO[];

  public constructor({ sourcePrompt, blocks, module, quizzes, ...base }: LessonDetailDTO) {
    super(base);
    this.sourcePrompt = sourcePrompt;
    this.blocks = blocks;
    this.module = module;
    this.quizzes = quizzes;
  }
}

export class LessonNeighborModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  public constructor({ id, title }: LessonNeighborModuleDTO) {
    this.id = id;
    this.title = title;
  }
}

export class LessonNeighborDTO extends LessonDTO {
  @ApiProperty({ description: "Module of the lesson", example: {}, type: LessonNeighborModuleDTO })
  public module: LessonNeighborModuleDTO;

  public constructor({ module, ...base }: LessonNeighborDTO) {
    super(base);
    this.module = module;
  }
}

export class LessonStepDTO {
  @ApiProperty({ description: "Step ID", example: "step-01" })
  public id: string;

  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public lessonId: string;

  @ApiProperty({ description: "Step title", example: "Concepto clave", nullable: true, type: String })
  public title: string | null;

  @ApiProperty({ description: "Step content, JSON or HTML", example: "<p>Contenido</p>" })
  public content: string;

  @ApiProperty({ description: "Content type", example: "text" })
  public contentType: string;

  @ApiProperty({ description: "Display order within the lesson", example: 0 })
  public order: number;

  @ApiProperty({ description: "Whether the step is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "ID of the last user who modified the step", example: null, nullable: true, type: String })
  public lastModifiedBy: string | null;

  @ApiProperty({ description: "Last modification timestamp", example: null, nullable: true, type: Date })
  public lastModifiedAt: Date | null;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  public constructor({ id, lessonId, title, content, contentType, order, isActive, lastModifiedBy, lastModifiedAt, createdAt, updatedAt }: LessonStepDTO) {
    this.id = id;
    this.lessonId = lessonId;
    this.title = title;
    this.content = content;
    this.contentType = contentType;
    this.order = order;
    this.isActive = isActive;
    this.lastModifiedBy = lastModifiedBy;
    this.lastModifiedAt = lastModifiedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class LessonContentDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public id: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Lesson slug", example: "introduccion", nullable: true, type: String })
  public slug: string | null;

  @ApiProperty({ description: "Lesson color", example: null, nullable: true, type: String })
  public color: string | null;

  @ApiProperty({ description: "Tags", example: [], type: [String] })
  public tags: string[];

  @ApiProperty({ description: "Notion-style content blocks", example: [], nullable: true })
  public blocks: unknown;

  @ApiProperty({ description: "Estimated time in minutes", example: 15, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Whether the lesson is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  public constructor({ id, title, slug, color, tags, blocks, estimatedTime, isActive, moduleId, updatedAt }: LessonContentDTO) {
    this.id = id;
    this.title = title;
    this.slug = slug;
    this.color = color;
    this.tags = tags;
    this.blocks = blocks;
    this.estimatedTime = estimatedTime;
    this.isActive = isActive;
    this.moduleId = moduleId;
    this.updatedAt = updatedAt;
  }
}
