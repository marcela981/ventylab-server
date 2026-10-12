/*
 * Funcionalidad: Caso de uso GetPlatformSettings
 * Descripción: Lista los ajustes del registro, opcionalmente de una categoría, con su valor efectivo, valor por defecto, origen, límites duros, descripción y versión leídos de la caché en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { type PlatformSettingEntry, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { type PlatformSettingCategoryValue, type PlatformSettingKey } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { PLATFORM_SETTING_KEYS, PLATFORM_SETTINGS_REGISTRY, type PlatformSettingDefinition } from "@/features/platform-settings/domain/registry/platform-settings.registry";

@Injectable()
export class GetPlatformSettingsUseCase {
  public constructor(private readonly _store: PlatformSettingsStore) {}

  public execute(category?: PlatformSettingCategoryValue): PlatformSettingView[] {
    return PLATFORM_SETTING_KEYS.filter((key: PlatformSettingKey): boolean => category === undefined || PLATFORM_SETTINGS_REGISTRY[key].category === category).map(
      (key: PlatformSettingKey): PlatformSettingView => {
        const definition: PlatformSettingDefinition = PLATFORM_SETTINGS_REGISTRY[key];
        const entry: PlatformSettingEntry = this._store.getEntry(key);

        return new PlatformSettingView({
          key,
          category: definition.category,
          description: definition.description,
          value: entry.value,
          defaultValue: entry.defaultValue,
          origin: entry.origin,
          limits: definition.limits,
          version: entry.version,
          updatedAt: entry.updatedAt,
          updatedById: entry.updatedById,
        });
      },
    );
  }
}
