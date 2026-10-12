/*
 * Funcionalidad: Caché de ajustes de la plataforma
 * Descripción: Mantiene en memoria las sobrescrituras validadas contra el registro (cargadas al iniciar el módulo; si la tabla no existe o la base no responde, registra una advertencia y sirve los valores por defecto), resuelve el valor efectivo (sobrescritura o valor por defecto, con su origen y versión), aplica o retira sobrescrituras tras confirmar la transacción y notifica a los suscriptores de cada clave
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { PLATFORM_SETTING_DEFAULTS_TOKEN, type PlatformSettingDefaults } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import {
  type PlatformSettingKey,
  type PlatformSettingOriginValue,
  type PlatformSettingOverride,
  type PlatformSettingValues,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import { getPlatformSettingDefinition, isPlatformSettingKey, PLATFORM_SETTING_KEYS } from "@/features/platform-settings/domain/registry/platform-settings.registry";
import { type IPlatformSettingsRepository, PLATFORM_SETTINGS_REPOSITORY_TOKEN } from "@/features/platform-settings/domain/repositories/platform-settings.repository";

export const DEFAULT_SETTING_VERSION: number = 0;

export type PlatformSettingListener<V> = (value: V) => void;

export interface PlatformSettingEntry {
  readonly key: PlatformSettingKey;
  readonly value: unknown;
  readonly defaultValue: unknown;
  readonly origin: PlatformSettingOriginValue;
  readonly version: number;
  readonly updatedAt?: Date;
  readonly updatedById?: string;
}

interface CachedOverride {
  readonly value: unknown;
  readonly version: number;
  readonly updatedAt: Date;
  readonly updatedById?: string;
}

@Injectable()
export class PlatformSettingsStore implements OnModuleInit {
  private readonly _logger: Logger = new Logger(PlatformSettingsStore.name);
  private readonly _overrides: Map<PlatformSettingKey, CachedOverride> = new Map<PlatformSettingKey, CachedOverride>();
  private readonly _listeners: Map<PlatformSettingKey, Set<PlatformSettingListener<unknown>>> = new Map<PlatformSettingKey, Set<PlatformSettingListener<unknown>>>();

  public constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY_TOKEN)
    private readonly _repository: IPlatformSettingsRepository,
    @Inject(PLATFORM_SETTING_DEFAULTS_TOKEN)
    private readonly _defaults: PlatformSettingDefaults,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.reload();
  }

  public async reload(): Promise<void> {
    let rows: PlatformSettingOverride[];

    try {
      rows = await this._repository.getAll();
    } catch (error: unknown) {
      this._logger.warn(`Platform setting overrides could not be loaded (${error instanceof Error ? error.name : "unknown error"}); serving defaults`);

      return;
    }

    const previous: Map<PlatformSettingKey, CachedOverride> = new Map<PlatformSettingKey, CachedOverride>(this._overrides);

    this._overrides.clear();

    for (const row of rows) {
      this._cache(row);
    }

    for (const key of PLATFORM_SETTING_KEYS) {
      if (previous.get(key)?.version !== this._overrides.get(key)?.version) {
        this._notify(key);
      }
    }
  }

  public get<K extends PlatformSettingKey>(key: K): PlatformSettingValues[K] {
    const override: CachedOverride | undefined = this._overrides.get(key);

    return override === undefined ? this._defaults[key] : (override.value as PlatformSettingValues[K]);
  }

  public getEntry(key: PlatformSettingKey): PlatformSettingEntry {
    const override: CachedOverride | undefined = this._overrides.get(key);
    const defaultValue: unknown = this._defaults[key];

    if (override === undefined) {
      return { key, value: defaultValue, defaultValue, origin: "DEFAULT", version: DEFAULT_SETTING_VERSION };
    }

    return {
      key,
      value: override.value,
      defaultValue,
      origin: "OVERRIDE",
      version: override.version,
      updatedAt: override.updatedAt,
      updatedById: override.updatedById,
    };
  }

  public getDefault<K extends PlatformSettingKey>(key: K): PlatformSettingValues[K] {
    return this._defaults[key];
  }

  public applyOverride(override: PlatformSettingOverride): void {
    if (this._cache(override)) {
      this._notify(override.key as PlatformSettingKey);
    }
  }

  public removeOverride(key: PlatformSettingKey): void {
    if (this._overrides.delete(key)) {
      this._notify(key);
    }
  }

  public subscribe<K extends PlatformSettingKey>(key: K, listener: PlatformSettingListener<PlatformSettingValues[K]>): () => void {
    const listeners: Set<PlatformSettingListener<unknown>> = this._listeners.get(key) ?? new Set<PlatformSettingListener<unknown>>();
    const untyped: PlatformSettingListener<unknown> = listener;

    listeners.add(untyped);
    this._listeners.set(key, listeners);

    return (): void => {
      listeners.delete(untyped);
    };
  }

  private _cache(row: PlatformSettingOverride): boolean {
    if (!isPlatformSettingKey(row.key)) {
      this._logger.warn(`Ignoring stored override of unknown platform setting ${row.key}`);

      return false;
    }

    try {
      const value: unknown = getPlatformSettingDefinition(row.key).parse(row.value);

      this._overrides.set(row.key, { value, version: row.version, updatedAt: row.updatedAt, updatedById: row.updatedById });

      return true;
    } catch (error: unknown) {
      this._logger.warn(`Ignoring invalid stored override of platform setting ${row.key}: ${error instanceof Error ? error.message : "invalid value"}`);

      return false;
    }
  }

  private _notify(key: PlatformSettingKey): void {
    const listeners: Set<PlatformSettingListener<unknown>> | undefined = this._listeners.get(key);

    if (listeners === undefined || listeners.size === 0) {
      return;
    }

    const value: unknown = this.get(key);

    for (const listener of listeners) {
      try {
        listener(value);
      } catch (error: unknown) {
        this._logger.error(`A subscriber of platform setting ${key} failed`, error instanceof Error ? error.stack : undefined);
      }
    }
  }
}
