/*
 * Funcionalidad: Vista de un ajuste de la plataforma
 * Descripción: Resultado de la consulta de ajustes: clave, categoría, tipo de valor, etiqueta, unidad, descripción, esquema de claves de los mapas, valor efectivo, valor por defecto, origen, límites duros, versión y última modificación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type PlatformSettingCategoryValue,
  type PlatformSettingKeySchema,
  type PlatformSettingOriginValue,
  type PlatformSettingValueTypeValue,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import { type PlatformSettingLimits } from "@/features/platform-settings/domain/registry/platform-settings.registry";

export class PlatformSettingView {
  public readonly key: string;
  public readonly category: PlatformSettingCategoryValue;
  public readonly type: PlatformSettingValueTypeValue;
  public readonly label: string;
  public readonly unit?: string;
  public readonly description: string;
  public readonly keySchema?: PlatformSettingKeySchema;
  public readonly value: unknown;
  public readonly defaultValue: unknown;
  public readonly origin: PlatformSettingOriginValue;
  public readonly limits: PlatformSettingLimits;
  public readonly version: number;
  public readonly updatedAt?: Date;
  public readonly updatedById?: string;

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
    category: PlatformSettingCategoryValue;
    type: PlatformSettingValueTypeValue;
    label: string;
    unit?: string;
    description: string;
    keySchema?: PlatformSettingKeySchema;
    value: unknown;
    defaultValue: unknown;
    origin: PlatformSettingOriginValue;
    limits: PlatformSettingLimits;
    version: number;
    updatedAt?: Date;
    updatedById?: string;
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
