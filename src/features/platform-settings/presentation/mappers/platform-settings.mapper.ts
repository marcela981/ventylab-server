/*
 * Funcionalidad: Mapper de presentación de ajustes de la plataforma
 * Descripción: Convierte las vistas de ajustes del caso de uso en DTOs de respuesta, con unidad y esquema de claves ausentes como null y el esquema de claves anidado convertido de forma recursiva
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { type PlatformSettingKeySchema } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { PlatformSettingDTO, PlatformSettingKeySchemaDTO } from "@/features/platform-settings/presentation/dtos/platform-setting.dto";

export class PlatformSettingsMapper {
  public static toDTO(view: PlatformSettingView): PlatformSettingDTO {
    return new PlatformSettingDTO({
      key: view.key,
      category: view.category,
      type: view.type,
      label: view.label,
      unit: view.unit ?? null,
      description: view.description,
      keySchema: view.keySchema === undefined ? null : PlatformSettingsMapper.toKeySchemaDTO(view.keySchema),
      value: view.value,
      defaultValue: view.defaultValue,
      origin: view.origin,
      limits: { ...view.limits },
      version: view.version,
      updatedAt: view.updatedAt?.toISOString() ?? null,
      updatedById: view.updatedById ?? null,
    });
  }

  public static toKeySchemaDTO(schema: PlatformSettingKeySchema): PlatformSettingKeySchemaDTO {
    return new PlatformSettingKeySchemaDTO({
      path: schema.path,
      keyLabel: schema.keyLabel,
      allowedKeys: schema.allowedKeys === null ? null : [...schema.allowedKeys],
      valueType: schema.valueType,
      valueLimits: schema.valueLimits === null ? null : { ...schema.valueLimits },
      valueKeySchema: schema.valueKeySchema === null ? null : PlatformSettingsMapper.toKeySchemaDTO(schema.valueKeySchema),
    });
  }

  public static toDTOList(views: readonly PlatformSettingView[]): PlatformSettingDTO[] {
    return views.map(PlatformSettingsMapper.toDTO);
  }
}
