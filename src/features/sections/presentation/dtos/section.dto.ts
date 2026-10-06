/*
 * Funcionalidad: DTOs de respuesta de secciones
 * Descripción: Define SectionDTO y SectionLevelDTO de la feature de secciones, documentados para Swagger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class SectionDTO {
  @ApiProperty({ description: "Section ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Unique slug", example: "mecanica" })
  public slug: string;

  @ApiProperty({ description: "Section title", example: "Mecánica ventilatoria" })
  public title: string;

  @ApiProperty({ description: "Section description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Publication status", example: "PUBLISHED", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] })
  public status: string;

  @ApiProperty({ description: "Number of levels in the section", example: 4 })
  public levelCount: number;

  @ApiProperty({ description: "Creation timestamp", example: "2026-10-05T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-10-05T14:20:00.000Z" })
  public updatedAt: Date;

  public constructor({ id, slug, title, description, order, status, levelCount, createdAt, updatedAt }: SectionDTO) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.order = order;
    this.status = status;
    this.levelCount = levelCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class SectionLevelDTO {
  @ApiProperty({ description: "Level ID", example: "level-beginner" })
  public id: string;

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

  @ApiProperty({ description: "Number of modules", example: 6 })
  public moduleCount: number;

  public constructor({ id, title, description, track, order, status, moduleCount }: SectionLevelDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.track = track;
    this.order = order;
    this.status = status;
    this.moduleCount = moduleCount;
  }
}
