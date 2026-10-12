/*
 * Funcionalidad: Fachada de ajustes de la plataforma
 * Descripción: API pública de la feature para la raíz de composición: valor efectivo de un ajuste leído de la caché en memoria (sobrescritura o valor por defecto) y suscripción a sus cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type PlatformSettingListener, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { type PlatformSettingKey, type PlatformSettingValues } from "@/features/platform-settings/domain/registry/platform-setting-values";

@Injectable()
export class PlatformSettingsFacade {
  public constructor(private readonly _store: PlatformSettingsStore) {}

  public get<K extends PlatformSettingKey>(key: K): PlatformSettingValues[K] {
    return this._store.get(key);
  }

  public subscribe<K extends PlatformSettingKey>(key: K, listener: PlatformSettingListener<PlatformSettingValues[K]>): () => void {
    return this._store.subscribe(key, listener);
  }
}
