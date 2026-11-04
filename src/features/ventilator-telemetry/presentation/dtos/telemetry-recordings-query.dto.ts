/*
 * Funcionalidad: DTO de consulta del listado de grabaciones de telemetría
 * Descripción: Valida y documenta los parámetros de GET /api/ventilator/telemetry/recordings: usuario (por defecto el solicitante) y rango from/to ISO 8601 del inicio de la reserva (por defecto los últimos 90 días, como máximo 366)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ListTelemetryRecordingsQueryDTO {
  @ApiPropertyOptional({ description: "User whose recordings are listed; defaults to the caller. Staff only for another user (a teacher only for students of the groups they created or supervise)", example: "cm5student01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public userId?: string;

  @ApiPropertyOptional({ description: "Reservation start lower bound (inclusive, ISO 8601); defaults to 90 days before `to`", example: "2026-08-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ventilator-telemetry.validation.date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Reservation start upper bound (exclusive, ISO 8601); defaults to now. The range spans at most 366 days", example: "2026-11-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ventilator-telemetry.validation.date_invalid") })
  public to?: string;
}
