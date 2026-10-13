/*
 * Funcionalidad: DTO de respuesta de un ajuste de la plataforma
 * Descripción: Serializa un ajuste para el administrador: clave, categoría, descripción, valor efectivo, valor por defecto, origen, límites duros, versión y última modificación; el valor y el valor por defecto se documentan como número, booleano, texto, arreglo u objeto según el ajuste
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, type SchemaObject } from "@nestjs/swagger";

import { PLATFORM_SETTING_CATEGORY_VALUES, PLATFORM_SETTING_ORIGIN_VALUES } from "@/features/platform-settings/domain/registry/platform-setting-values";

const SETTING_VALUE_SCHEMAS: SchemaObject[] = [{ type: "number" }, { type: "boolean" }, { type: "string" }, { type: "array", items: {} }, { type: "object" }];

export class PlatformSettingDTO {
  @ApiProperty({ description: "Setting key", example: "telemetry.flushIntervalMs" })
  public key: string;

  @ApiProperty({ description: "Setting category", enum: PLATFORM_SETTING_CATEGORY_VALUES, example: "telemetry" })
  public category: string;

  @ApiProperty({ description: "What the setting controls", example: "Interval at which buffered telemetry frames are sent to clients" })
  public description: string;

  @ApiProperty({ description: "Effective value (the override, or the default when there is none)", example: 33, oneOf: SETTING_VALUE_SCHEMAS })
  public value: unknown;

  @ApiProperty({ description: "Default value, from the server configuration or code", example: 33, oneOf: SETTING_VALUE_SCHEMAS })
  public defaultValue: unknown;

  @ApiProperty({ description: "Where the effective value comes from", enum: PLATFORM_SETTING_ORIGIN_VALUES, example: "DEFAULT" })
  public origin: string;

  @ApiProperty({
    description: "Hard limits no value may exceed (ranges, allowed values, required credentials)",
    type: "object",
    additionalProperties: true,
    example: { min: 5, max: 1000, integer: true },
  })
  public limits: Record<string, unknown>;

  @ApiProperty({ description: "Current version, sent back on update or reset (0 while the default applies)", example: 0 })
  public version: number;

  @ApiProperty({ description: "When the override was last changed", example: "2026-10-11T12:00:00.000Z", nullable: true, type: String })
  public updatedAt: string | null;

  @ApiProperty({ description: "Who last changed the override", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  public updatedById: string | null;

  public constructor({
    key,
    category,
    description,
    value,
    defaultValue,
    origin,
    limits,
    version,
    updatedAt,
    updatedById,
  }: {
    key: string;
    category: string;
    description: string;
    value: unknown;
    defaultValue: unknown;
    origin: string;
    limits: Record<string, unknown>;
    version: number;
    updatedAt: string | null;
    updatedById: string | null;
  }) {
    this.key = key;
    this.category = category;
    this.description = description;
    this.value = value;
    this.defaultValue = defaultValue;
    this.origin = origin;
    this.limits = limits;
    this.version = version;
    this.updatedAt = updatedAt;
    this.updatedById = updatedById;
  }
}
