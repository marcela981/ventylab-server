/*
 * Funcionalidad: Configuración de las sesiones de simulación
 * Descripción: Lector puro de los ajustes de las sesiones con eventos desde ConfigService (tolerancia del tiempo simulado, minutos de inactividad para el abandono y tamaño máximo de lote) más los umbrales de la rúbrica por defecto y los multiplicadores de tiempo del motor, usado como valores por defecto de los ajustes de la plataforma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { DEFAULT_SIMULATION_RUBRIC_THRESHOLDS } from "@/features/simulation/domain/scoring/simulation-rubric";
import { TIME_MULTIPLIER_VALUES } from "@/features/simulation/domain/value-objects/simulation-session-values";

export const MS_PER_MINUTE: number = 60_000;

export function readSimulationSessionSettings(configService: ConfigService<EnvironmentVariables, true>): SimulationSessionSettings {
  return {
    eventTimeToleranceMs: configService.get("SIMULATION_EVENT_TIME_TOLERANCE_MS", { infer: true }),
    abandonAfterMs: configService.get("SIMULATION_ABANDON_AFTER_MINUTES", { infer: true }) * MS_PER_MINUTE,
    maxEventBatchSize: configService.get("SIMULATION_MAX_EVENT_BATCH_SIZE", { infer: true }),
    defaultRubricThresholds: DEFAULT_SIMULATION_RUBRIC_THRESHOLDS,
    allowedTimeMultipliers: TIME_MULTIPLIER_VALUES,
  };
}
