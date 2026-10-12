/*
 * Funcionalidad: Mapper de presentación de ajustes de la plataforma
 * Descripción: Convierte las vistas de ajustes del caso de uso en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { PlatformSettingDTO } from "@/features/platform-settings/presentation/dtos/platform-setting.dto";

export class PlatformSettingsMapper {
  public static toDTO(view: PlatformSettingView): PlatformSettingDTO {
    return new PlatformSettingDTO({
      key: view.key,
      category: view.category,
      description: view.description,
      value: view.value,
      defaultValue: view.defaultValue,
      origin: view.origin,
      limits: { ...view.limits },
      version: view.version,
      updatedAt: view.updatedAt?.toISOString() ?? null,
      updatedById: view.updatedById ?? null,
    });
  }

  public static toDTOList(views: readonly PlatformSettingView[]): PlatformSettingDTO[] {
    return views.map(PlatformSettingsMapper.toDTO);
  }
}
