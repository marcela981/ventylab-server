/*
 * Funcionalidad: Configuración del estado del sistema
 * Descripción: Lee de ConfigService los segundos de caché del estado (SYSTEM_STATUS_CACHE_SECONDS, 5–10), el tiempo máximo por chequeo (HEALTH_CHECK_TIMEOUT_MS), la versión y el commit de la aplicación, y fija el intervalo de reevaluación en segundo plano (30 s) y la ventana de métricas de IA (15 min); registra SYSTEM_STATUS_SETTINGS_TOKEN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { SYSTEM_STATUS_SETTINGS_TOKEN, type SystemStatusSettings } from "@/features/system-status/application/tokens/system-status-settings.token";

export const SYSTEM_STATUS_REEVALUATE_INTERVAL_MS: number = 30_000;

export const SYSTEM_STATUS_AI_WINDOW_MINUTES: number = 15;

export const UNKNOWN_APP_VERSION: string = "unknown";

export function readSystemStatusSettings(configService: ConfigService<EnvironmentVariables, true>): SystemStatusSettings {
  return {
    cacheSeconds: configService.get("SYSTEM_STATUS_CACHE_SECONDS", { infer: true }),
    checkTimeoutMs: configService.get("HEALTH_CHECK_TIMEOUT_MS", { infer: true }),
    reevaluateIntervalMs: SYSTEM_STATUS_REEVALUATE_INTERVAL_MS,
    aiWindowMinutes: SYSTEM_STATUS_AI_WINDOW_MINUTES,
    appVersion: configService.get("APP_VERSION", { infer: true }) ?? UNKNOWN_APP_VERSION,
    appCommit: configService.get("APP_COMMIT_SHA", { infer: true }),
  };
}

export const SYSTEM_STATUS_SETTINGS_PROVIDER: FactoryProvider<SystemStatusSettings> = {
  provide: SYSTEM_STATUS_SETTINGS_TOKEN,
  inject: [ConfigService],
  useFactory: readSystemStatusSettings,
};
