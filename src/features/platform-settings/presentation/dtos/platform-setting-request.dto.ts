/*
 * Funcionalidad: DTOs de solicitud de ajustes de la plataforma
 * Descripción: Filtro por categoría del listado, cuerpo de la actualización (valor de cualquier tipo JSON, también texto, validado por el registro según la clave, y versión leída) y cuerpo del restablecimiento (versión leída), validados con class-validator y mensajes i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsIn, IsInt, IsOptional, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { PLATFORM_SETTING_CATEGORY_VALUES } from "@/features/platform-settings/domain/registry/platform-setting-values";

export class GetPlatformSettingsQueryDTO {
  @ApiPropertyOptional({ description: "Only settings of this category", enum: PLATFORM_SETTING_CATEGORY_VALUES, example: "telemetry" })
  @IsOptional()
  @IsIn([...PLATFORM_SETTING_CATEGORY_VALUES], { message: i18nValidationMessage("platform-settings.validation.category_invalid") })
  public category?: string;
}

export class UpdatePlatformSettingDTO {
  @ApiProperty({
    description: "New value; its type and shape depend on the setting (see its type, limits and keySchema); the setting registry validates it per key",
    example: 50,
    oneOf: [{ type: "number" }, { type: "boolean" }, { type: "string" }, { type: "array", items: {} }, { type: "object" }],
  })
  @IsDefined({ message: i18nValidationMessage("platform-settings.validation.value_required") })
  public value: unknown;

  @ApiProperty({ description: "Version of the setting the change is based on (0 while it uses its default)", example: 0, minimum: 0 })
  @IsInt({ message: i18nValidationMessage("platform-settings.validation.version_invalid") })
  @Min(0, { message: i18nValidationMessage("platform-settings.validation.version_invalid") })
  public version: number;
}

export class ResetPlatformSettingDTO {
  @ApiProperty({ description: "Version of the setting the reset is based on", example: 3, minimum: 0 })
  @IsInt({ message: i18nValidationMessage("platform-settings.validation.version_invalid") })
  @Min(0, { message: i18nValidationMessage("platform-settings.validation.version_invalid") })
  public version: number;
}
