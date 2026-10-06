/*
 * Funcionalidad: DTOs change-log-entry.dto
 * Descripción: Define los DTOs ChangeLogAuthorDTO, ChangeLogEntryDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class ChangeLogAuthorDTO {
  @ApiProperty({ description: "User ID", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Laura Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "teacher@ventylab.com" })
  public email: string;

  @ApiProperty({ description: "User role", example: "TEACHER" })
  public role: string;

  public constructor({ id, name, email, role }: ChangeLogAuthorDTO) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }
}

export class ChangeLogEntryDTO {
  @ApiProperty({ description: "Change log entry ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Changed entity type", example: "Level" })
  public entityType: string;

  @ApiProperty({ description: "Changed entity ID", example: "level-beginner" })
  public entityId: string;

  @ApiProperty({ description: "Action performed", example: "update" })
  public action: string;

  @ApiProperty({ description: "ID of the user who made the change", example: "cm5x2k9a00000abcd1234efgh" })
  public changedBy: string;

  @ApiProperty({ description: "When the change happened", example: "2026-03-10T14:20:00.000Z" })
  public changedAt: Date;

  @ApiProperty({
    description: "Changed fields as { field: { before, after } }",
    example: { title: { before: "Old", after: "New" } },
    nullable: true,
    type: Object,
  })
  public diff: Record<string, { before: unknown; after: unknown }> | null;

  @ApiProperty({ description: "Additional context", example: { studentId: "cm5x" }, nullable: true, type: Object })
  public metadata: Record<string, unknown> | null;

  @ApiProperty({ description: "User who made the change", type: ChangeLogAuthorDTO, nullable: true })
  public user: ChangeLogAuthorDTO | null;

  public constructor({ id, entityType, entityId, action, changedBy, changedAt, diff, metadata, user }: ChangeLogEntryDTO) {
    this.id = id;
    this.entityType = entityType;
    this.entityId = entityId;
    this.action = action;
    this.changedBy = changedBy;
    this.changedAt = changedAt;
    this.diff = diff;
    this.metadata = metadata;
    this.user = user;
  }
}
