/*
 * Funcionalidad: Repositorio de sobrescrituras de ajustes de la plataforma
 * Descripción: Contrato para leer todas las sobrescrituras guardadas, leer una por clave, guardarla o borrarla y tomar el bloqueo transaccional de una clave
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PlatformSettingOverride } from "@/features/platform-settings/domain/registry/platform-setting-values";

export const PLATFORM_SETTINGS_REPOSITORY_TOKEN: unique symbol = Symbol("PLATFORM_SETTINGS_REPOSITORY_TOKEN");

export interface SavePlatformSettingOverride {
  readonly key: string;
  readonly value: unknown;
  readonly version: number;
  readonly updatedById?: string;
}

export interface IPlatformSettingsRepository {
  getAll(): Promise<PlatformSettingOverride[]>;
  getByKey(key: string, transaction?: unknown): Promise<PlatformSettingOverride | undefined>;
  save(override: SavePlatformSettingOverride, transaction?: unknown): Promise<PlatformSettingOverride>;
  delete(key: string, transaction?: unknown): Promise<void>;
  acquireTransactionLock(key: string, transaction: unknown): Promise<void>;
}
