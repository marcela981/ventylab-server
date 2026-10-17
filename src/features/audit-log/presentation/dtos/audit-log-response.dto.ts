/*
 * Funcionalidad: DTO de respuesta AuditLogEntryDTO
 * Descripción: Representa un registro de auditoría en las respuestas HTTP: acción, objetivo, actor y su rol, estado anterior y posterior protegidos, motivo, metadatos, petición e IP, y el catálogo para filtrar (acciones, tipos de objetivo y tope de filas de la exportación)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class AuditLogEntryDTO {
  @ApiProperty({ description: "Audit entry ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Action performed", example: "user_role_changed" })
  public action: string;

  @ApiProperty({ description: "Target entity collection", example: "users" })
  public targetCollection: string;

  @ApiProperty({ description: "Target entity type", example: "user" })
  public targetType: string;

  @ApiProperty({ description: "Target entity ID", example: "cm5x2k9a00000abcd1234efgh" })
  public targetId: string;

  @ApiProperty({ description: "ID of the user who performed the action (null for system actions)", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public actorId: string | null;

  @ApiProperty({ description: "Role of the actor when the action was performed", example: "ADMIN", nullable: true, type: String })
  public actorRole: string | null;

  @ApiProperty({ description: "Human-readable context", example: "Role changed by an administrator", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Reason given for the action", example: "Requested by the course coordinator", nullable: true, type: String })
  public reason: string | null;

  @ApiProperty({ description: "Changed fields before the action (secrets redacted, long text as sha256 and length)", example: { role: "STUDENT" }, nullable: true, type: Object })
  public before: Record<string, unknown> | null;

  @ApiProperty({ description: "Changed fields after the action (secrets redacted, long text as sha256 and length)", example: { role: "TEACHER" }, nullable: true, type: Object })
  public after: Record<string, unknown> | null;

  @ApiProperty({ description: "Additional context", example: { agent: { userAgent: "Mozilla/5.0" } }, nullable: true, type: Object })
  public metadata: Record<string, unknown> | null;

  @ApiProperty({ description: "Trace ID of the request that performed the action", example: "4f1c2a9e-0b7d-4c55-9f3e-1a2b3c4d5e6f", nullable: true, type: String })
  public requestId: string | null;

  @ApiProperty({ description: "Client IP of the request", example: "203.0.113.10", nullable: true, type: String })
  public ip: string | null;

  @ApiProperty({ description: "When the action was performed", example: "2026-10-11T14:20:00.000Z" })
  public performedAt: Date;

  public constructor(props: AuditLogEntryDTO) {
    this.id = props.id;
    this.action = props.action;
    this.targetCollection = props.targetCollection;
    this.targetType = props.targetType;
    this.targetId = props.targetId;
    this.actorId = props.actorId;
    this.actorRole = props.actorRole;
    this.description = props.description;
    this.reason = props.reason;
    this.before = props.before;
    this.after = props.after;
    this.metadata = props.metadata;
    this.requestId = props.requestId;
    this.ip = props.ip;
    this.performedAt = props.performedAt;
  }
}

export class AuditLogCatalogDTO {
  @ApiProperty({ description: "Every action of the audit action catalog, sorted", example: ["user_role_changed", "user_status_changed"], type: String, isArray: true })
  public actions: string[];

  @ApiProperty({ description: "Target entity types present in the audit log, sorted", example: ["page", "user"], type: String, isArray: true })
  public targetTypes: string[];

  @ApiProperty({ description: "Maximum number of rows of one CSV export (GET /api/audit/export)", example: 50000 })
  public exportRowLimit: number;

  public constructor(props: AuditLogCatalogDTO) {
    this.actions = props.actions;
    this.targetTypes = props.targetTypes;
    this.exportRowLimit = props.exportRowLimit;
  }
}
