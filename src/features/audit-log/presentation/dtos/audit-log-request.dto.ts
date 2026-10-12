/*
 * Funcionalidad: DTOs de petición de la bitácora de auditoría
 * Descripción: Valida los filtros de búsqueda y exportación de auditoría (actor, acción del catálogo, tipo e identificador de objetivo, rango ISO 8601), la paginación y los parámetros de ruta del historial de un objetivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { AUDIT_ACTION_VALUES } from "@/common/domain/audit/audit-action";

const MAX_FILTER_LENGTH: number = 100;

export class AuditLogPageQueryDTO {
  @ApiPropertyOptional({ description: "Page number (1-based)", example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.page.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.page.min") })
  public page: number = 1;

  @ApiPropertyOptional({ description: "Number of items per page", example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 20;

  @ApiPropertyOptional({ description: "Sort direction by performedAt (newest first by default)", enum: ["asc", "desc"], example: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"], { message: i18nValidationMessage("common.validation.sort_order.must_be_valid") })
  public sortOrder?: "asc" | "desc";
}

export class AuditLogFiltersQueryDTO {
  @ApiPropertyOptional({ description: "Only entries performed by this user", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("audit-log.validation.filter_too_long") })
  public actorId?: string;

  @ApiPropertyOptional({ description: "Only entries with this action", enum: AUDIT_ACTION_VALUES, example: "user_role_changed" })
  @IsOptional()
  @IsIn([...AUDIT_ACTION_VALUES], { message: i18nValidationMessage("audit-log.validation.action_invalid") })
  public action?: string;

  @ApiPropertyOptional({ description: "Only entries whose target entity type or collection matches", example: "user" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("audit-log.validation.filter_too_long") })
  public targetType?: string;

  @ApiPropertyOptional({ description: "Only entries about this target ID", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("audit-log.validation.filter_too_long") })
  public targetId?: string;

  @ApiPropertyOptional({ description: "Range start (inclusive, ISO 8601)", example: "2026-09-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("audit-log.validation.date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Range end (exclusive, ISO 8601)", example: "2026-10-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("audit-log.validation.date_invalid") })
  public to?: string;
}

export class SearchAuditLogsQueryDTO extends AuditLogFiltersQueryDTO {
  @ApiPropertyOptional({ description: "Page number (1-based)", example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.page.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.page.min") })
  public page: number = 1;

  @ApiPropertyOptional({ description: "Number of items per page", example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 20;

  @ApiPropertyOptional({ description: "Sort direction by performedAt (newest first by default)", enum: ["asc", "desc"], example: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"], { message: i18nValidationMessage("common.validation.sort_order.must_be_valid") })
  public sortOrder?: "asc" | "desc";
}

export class AuditTargetParamsDTO {
  @ApiProperty({ description: "Target entity type or collection", example: "user" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("audit-log.validation.target_required") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("audit-log.validation.filter_too_long") })
  public type: string;

  @ApiProperty({ description: "Target ID", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("audit-log.validation.target_required") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("audit-log.validation.filter_too_long") })
  public id: string;
}
