/*
 * Funcionalidad: DTOs step.dto
 * Descripción: Define los DTOs StepDTO, StepLessonDTO, StepListItemDTO, StepModuleDTO, StepDetailLessonDTO, StepDetailDTO de la feature de pasos (tarjetas), documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class StepDTO {
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

  public constructor({ id, lessonId, title, content, contentType, order, isActive, lastModifiedBy, lastModifiedAt, createdAt, updatedAt }: StepDTO) {
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

export class StepLessonDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  public id: string;

  @ApiProperty({ description: "Lesson title", example: "Introducción" })
  public title: string;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public moduleId: string;

  public constructor({ id, title, moduleId }: StepLessonDTO) {
    this.id = id;
    this.title = title;
    this.moduleId = moduleId;
  }
}

export class StepListItemDTO extends StepDTO {
  @ApiProperty({ description: "Lesson of the step", example: {}, type: StepLessonDTO })
  public lesson: StepLessonDTO;

  public constructor({ lesson, ...base }: StepListItemDTO) {
    super(base);
    this.lesson = lesson;
  }
}

export class StepModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  public constructor({ id, title, levelId }: StepModuleDTO) {
    this.id = id;
    this.title = title;
    this.levelId = levelId;
  }
}

export class StepDetailLessonDTO extends StepLessonDTO {
  @ApiProperty({ description: "Module of the lesson", example: {}, type: StepModuleDTO })
  public module: StepModuleDTO;

  public constructor({ module, ...base }: StepDetailLessonDTO) {
    super(base);
    this.module = module;
  }
}

export class StepDetailDTO extends StepDTO {
  @ApiProperty({ description: "Lesson of the step", example: {}, type: StepDetailLessonDTO })
  public lesson: StepDetailLessonDTO;

  public constructor({ lesson, ...base }: StepDetailDTO) {
    super(base);
    this.lesson = lesson;
  }
}
