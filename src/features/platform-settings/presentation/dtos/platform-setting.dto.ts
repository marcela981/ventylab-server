/*
 * Funcionalidad: DTO de respuesta de un ajuste de la plataforma
 * Descripción: Serializa un ajuste para el administrador: clave, categoría, tipo de valor, etiqueta y unidad en español, descripción en español, esquema de claves de los ajustes con forma de mapa (recursivo), valor efectivo, valor por defecto, origen, límites duros, versión y última modificación; el valor y el valor por defecto se documentan como número, booleano, texto, arreglo u objeto según el ajuste
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, type SchemaObject } from "@nestjs/swagger";

import {
  PLATFORM_SETTING_CATEGORY_VALUES,
  PLATFORM_SETTING_ORIGIN_VALUES,
  PLATFORM_SETTING_VALUE_TYPE_VALUES,
} from "@/features/platform-settings/domain/registry/platform-setting-values";

const SETTING_VALUE_SCHEMAS: SchemaObject[] = [{ type: "number" }, { type: "boolean" }, { type: "string" }, { type: "array", items: {} }, { type: "object" }];

export class PlatformSettingKeySchemaDTO {
  @ApiProperty({ description: "Field of the value that holds the map (null when the whole value is the map)", example: null, nullable: true, type: String })
  public path: string | null;

  @ApiProperty({ description: "Label of the map keys, in Spanish", example: "Proveedor" })
  public keyLabel: string;

  @ApiProperty({
    description: "Keys a form may add (for AI provider maps, the providers the AI feature registers); null when any key is accepted",
    example: ["gemini", "openai", "anthropic", "custom"],
    nullable: true,
    type: String,
    isArray: true,
  })
  public allowedKeys: string[] | null;

  @ApiProperty({ description: "Type of the value under each key", enum: PLATFORM_SETTING_VALUE_TYPE_VALUES, example: "map" })
  public valueType: string;

  @ApiProperty({
    description: "Hard limits of the value under each key (per field for object values); null when the value is a nested map",
    type: "object",
    additionalProperties: true,
    nullable: true,
    example: { inputPer1kUsd: { min: 0, max: 1, integer: false }, outputPer1kUsd: { min: 0, max: 1, integer: false } },
  })
  public valueLimits: Record<string, unknown> | null;

  @ApiProperty({ description: "Key schema of the nested map when valueType is map; null otherwise", type: () => PlatformSettingKeySchemaDTO, nullable: true })
  public valueKeySchema: PlatformSettingKeySchemaDTO | null;

  public constructor({
    path,
    keyLabel,
    allowedKeys,
    valueType,
    valueLimits,
    valueKeySchema,
  }: {
    path: string | null;
    keyLabel: string;
    allowedKeys: string[] | null;
    valueType: string;
    valueLimits: Record<string, unknown> | null;
    valueKeySchema: PlatformSettingKeySchemaDTO | null;
  }) {
    this.path = path;
    this.keyLabel = keyLabel;
    this.allowedKeys = allowedKeys;
    this.valueType = valueType;
    this.valueLimits = valueLimits;
    this.valueKeySchema = valueKeySchema;
  }
}

export class PlatformSettingDTO {
  @ApiProperty({ description: "Setting key", example: "telemetry.flushIntervalMs" })
  public key: string;

  @ApiProperty({ description: "Setting category", enum: PLATFORM_SETTING_CATEGORY_VALUES, example: "telemetry" })
  public category: string;

  @ApiProperty({ description: "Type of the value, so a generic form can pick its input", enum: PLATFORM_SETTING_VALUE_TYPE_VALUES, example: "integer" })
  public type: string;

  @ApiProperty({ description: "Short name of the setting, in Spanish", example: "Intervalo de envío de telemetría" })
  public label: string;

  @ApiProperty({ description: "Unit of the value, in Spanish; null when it has none", example: "milisegundos", nullable: true, type: String })
  public unit: string | null;

  @ApiProperty({
    description: "What the setting controls, in Spanish",
    example: "Intervalo con el que se envían a los clientes los fotogramas de telemetría acumulados; un cambio reprograma el temporizador sin reiniciar",
  })
  public description: string;

  @ApiProperty({
    description: "Keys of a map-like setting (or of its map field) a form can add or remove; null for other settings",
    type: () => PlatformSettingKeySchemaDTO,
    nullable: true,
  })
  public keySchema: PlatformSettingKeySchemaDTO | null;

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
    type,
    label,
    unit,
    description,
    keySchema,
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
    type: string;
    label: string;
    unit: string | null;
    description: string;
    keySchema: PlatformSettingKeySchemaDTO | null;
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
    this.type = type;
    this.label = label;
    this.unit = unit;
    this.description = description;
    this.keySchema = keySchema;
    this.value = value;
    this.defaultValue = defaultValue;
    this.origin = origin;
    this.limits = limits;
    this.version = version;
    this.updatedAt = updatedAt;
    this.updatedById = updatedById;
  }
}
