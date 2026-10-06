/*
 * Funcionalidad: DTOs content-override.dto
 * Descripción: Define los DTOs OverrideUserDTO, ContentOverrideDTO, ContentOverridesListDTO de la feature de personalizaciones de contenido por estudiante, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class OverrideUserDTO {
  @ApiProperty({ description: "User ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana María Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "student@ventylab.com" })
  public email: string;

  public constructor({ id, name, email }: OverrideUserDTO) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

export class ContentOverrideDTO {
  @ApiProperty({ description: "Override ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Student ID", example: "cm5x2k9a00000abcd1234efgh" })
  public studentId: string;

  @ApiProperty({ description: "Overridden entity type", example: "LESSON" })
  public entityType: string;

  @ApiProperty({ description: "Overridden entity ID", example: "lesson-01" })
  public entityId: string;

  @ApiProperty({ description: "Override data: fieldOverrides, extraCards, hiddenCardIds", example: { hiddenCardIds: ["step-03"] }, type: Object })
  public overrideData: Record<string, unknown>;

  @ApiProperty({ description: "ID of the user who created the override", example: "cm5x2k9a00000abcd1234efgi" })
  public createdBy: string;

  @ApiProperty({ description: "Creation timestamp", example: "2026-01-10T14:20:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Update timestamp", example: "2026-03-10T14:20:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Whether the override is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Student", example: null, nullable: true, type: OverrideUserDTO })
  public student: OverrideUserDTO | null;

  @ApiProperty({ description: "Creator", example: null, nullable: true, type: OverrideUserDTO })
  public creator: OverrideUserDTO | null;

  public constructor({ id, studentId, entityType, entityId, overrideData, createdBy, createdAt, updatedAt, isActive, student, creator }: ContentOverrideDTO) {
    this.id = id;
    this.studentId = studentId;
    this.entityType = entityType;
    this.entityId = entityId;
    this.overrideData = overrideData;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isActive = isActive;
    this.student = student;
    this.creator = creator;
  }
}

export class ContentOverridesListDTO {
  @ApiProperty({ description: "Student ID", example: "cm5x2k9a00000abcd1234efgh" })
  public studentId: string;

  @ApiProperty({ description: "Number of overrides", example: 1 })
  public count: number;

  @ApiProperty({ description: "Overrides, newest first", example: [], type: [ContentOverrideDTO] })
  public overrides: ContentOverrideDTO[];

  public constructor({ studentId, count, overrides }: ContentOverridesListDTO) {
    this.studentId = studentId;
    this.count = count;
    this.overrides = overrides;
  }
}
