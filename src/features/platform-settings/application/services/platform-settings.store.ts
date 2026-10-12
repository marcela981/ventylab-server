/*
 * Funcionalidad: Caché de ajustes de la plataforma
 * Descripción: Mantiene en memoria las filas guardadas validadas contra el registro (cargadas al iniciar el módulo; si la tabla no existe o la base no responde, registra una advertencia y sirve los valores por defecto), resuelve el valor efectivo (sobrescritura o valor por defecto, con su origen y su versión real en la base, también para marcas de restablecimiento y sobrescrituras que ya no son válidas), aplica tras confirmar la transacción solo filas con una versión mayor a la cacheada y notifica a los suscriptores de cada clave
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { PLATFORM_SETTING_DEFAULTS_TOKEN, type PlatformSettingDefaults } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import {
  isResetPlatformSetting,
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

interface CachedRow {
  readonly isOverride: boolean;
  readonly value: unknown;
  readonly version: number;
  readonly updatedAt: Date;
  readonly updatedById?: string;
}

@Injectable()
export class PlatformSettingsStore implements OnModuleInit {
  private readonly _logger: Logger = new Logger(PlatformSettingsStore.name);
  private readonly _rows: Map<PlatformSettingKey, CachedRow> = new Map<PlatformSettingKey, CachedRow>();
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

    const previous: Map<PlatformSettingKey, CachedRow> = new Map<PlatformSettingKey, CachedRow>(this._rows);

    this._rows.clear();

    for (const row of rows) {
      this._cache(row);
    }

    for (const key of PLATFORM_SETTING_KEYS) {
      if (previous.get(key)?.version !== this._rows.get(key)?.version) {
        this._notify(key);
      }
    }
  }

  public get<K extends PlatformSettingKey>(key: K): PlatformSettingValues[K] {
    const row: CachedRow | undefined = this._rows.get(key);

    return row?.isOverride === true ? (row.value as PlatformSettingValues[K]) : this._defaults[key];
  }

  public getEntry(key: PlatformSettingKey): PlatformSettingEntry {
    const row: CachedRow | undefined = this._rows.get(key);
    const defaultValue: unknown = this._defaults[key];

    if (row === undefined) {
      return { key, value: defaultValue, defaultValue, origin: "DEFAULT", version: DEFAULT_SETTING_VERSION };
    }

    return {
      key,
      value: row.isOverride ? row.value : defaultValue,
      defaultValue,
      origin: row.isOverride ? "OVERRIDE" : "DEFAULT",
      version: row.version,
      updatedAt: row.updatedAt,
      updatedById: row.updatedById,
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

    const cachedVersion: number = this._rows.get(row.key)?.version ?? DEFAULT_SETTING_VERSION;

    if (row.version <= cachedVersion) {
      return false;
    }

    this._rows.set(row.key, { ...this._resolveStoredValue(row.key, row), version: row.version, updatedAt: row.updatedAt, updatedById: row.updatedById });

    return true;
  }

  private _resolveStoredValue(key: PlatformSettingKey, row: PlatformSettingOverride): Pick<CachedRow, "isOverride" | "value"> {
    if (isResetPlatformSetting(row)) {
      return { isOverride: false, value: undefined };
    }

    try {
      return { isOverride: true, value: getPlatformSettingDefinition(key).parse(row.value) };
    } catch (error: unknown) {
      this._logger.warn(
        `Serving the default of platform setting ${key} because its stored override (version ${row.version}) is invalid: ${error instanceof Error ? error.message : "invalid value"}`,
      );

      return { isOverride: false, value: undefined };
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
