/*
 * Funcionalidad: DTOs del árbol curricular del estudiante
 * Descripción: Define las respuestas HTTP del árbol Sección, Nivel, Módulo con locked, completed y missingPrerequisites, documentadas con Swagger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class NamedReferenceDTO {
  @ApiProperty({ description: "Referenced entity ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Referenced entity title", example: "Fundamentos" })
  public title: string;

  public constructor({ id, title }: NamedReferenceDTO) {
    this.id = id;
    this.title = title;
  }
}

export class StudentTreeModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Number of lessons", example: 4 })
  public lessonCount: number;

  @ApiProperty({ description: "Whether the module is locked for the current user", example: false })
  public locked: boolean;

  @ApiProperty({ description: "Whether the current user completed the module", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Prerequisites still missing", type: [NamedReferenceDTO] })
  public missingPrerequisites: NamedReferenceDTO[];

  public constructor({ id, title, description, order, status, lessonCount, locked, completed, missingPrerequisites }: StudentTreeModuleDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = order;
    this.status = status;
    this.lessonCount = lessonCount;
    this.locked = locked;
    this.completed = completed;
    this.missingPrerequisites = missingPrerequisites;
  }
}

export class StudentTreeLevelDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public id: string;

  @ApiProperty({ description: "Section ID", example: null, nullable: true, type: String })
  public sectionId: string | null;

  @ApiProperty({ description: "Level title", example: "Principiante" })
  public title: string;

  @ApiProperty({ description: "Level description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Curriculum track", example: "mecanica" })
  public track: string;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Whether the level is locked for the current user", example: false })
  public locked: boolean;

  @ApiProperty({ description: "Whether the current user completed every module of the level", example: false })
  public completed: boolean;

  @ApiProperty({ description: "Prerequisite levels still missing", type: [NamedReferenceDTO] })
  public missingPrerequisites: NamedReferenceDTO[];

  @ApiProperty({ description: "Modules of the level", type: [StudentTreeModuleDTO] })
  public modules: StudentTreeModuleDTO[];

  public constructor({ id, sectionId, title, description, track, order, status, locked, completed, missingPrerequisites, modules }: StudentTreeLevelDTO) {
    this.id = id;
    this.sectionId = sectionId;
    this.title = title;
    this.description = description;
    this.track = track;
    this.order = order;
    this.status = status;
    this.locked = locked;
    this.completed = completed;
    this.missingPrerequisites = missingPrerequisites;
    this.modules = modules;
  }
}

export class StudentTreeSectionDTO {
  @ApiProperty({ description: "Section ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Section slug", example: "mecanica" })
  public slug: string;

  @ApiProperty({ description: "Section title", example: "Mecánica ventilatoria" })
  public title: string;

  @ApiProperty({ description: "Section description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Levels of the section", type: [StudentTreeLevelDTO] })
  public levels: StudentTreeLevelDTO[];

  public constructor({ id, slug, title, description, order, status, levels }: StudentTreeSectionDTO) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.order = order;
    this.status = status;
    this.levels = levels;
  }
}

export class StudentCurriculumTreeDTO {
  @ApiProperty({ description: "Sections with their levels and modules", type: [StudentTreeSectionDTO] })
  public sections: StudentTreeSectionDTO[];

  @ApiProperty({ description: "Levels that do not belong to any visible section", type: [StudentTreeLevelDTO] })
  public unsectionedLevels: StudentTreeLevelDTO[];

  public constructor({ sections, unsectionedLevels }: StudentCurriculumTreeDTO) {
    this.sections = sections;
    this.unsectionedLevels = unsectionedLevels;
  }
}
