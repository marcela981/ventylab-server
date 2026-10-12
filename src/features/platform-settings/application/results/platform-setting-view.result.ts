/*
 * Funcionalidad: Vista de un ajuste de la plataforma
 * Descripción: Resultado de la consulta de ajustes: clave, categoría, descripción, valor efectivo, valor por defecto, origen, límites duros, versión y última modificación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PlatformSettingCategoryValue, type PlatformSettingOriginValue } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { type PlatformSettingLimits } from "@/features/platform-settings/domain/registry/platform-settings.registry";

export class PlatformSettingView {
  public readonly key: string;
  public readonly category: PlatformSettingCategoryValue;
  public readonly description: string;
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
    category: PlatformSettingCategoryValue;
    description: string;
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
