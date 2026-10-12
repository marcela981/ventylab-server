/*
 * Funcionalidad: Valores por defecto de los ajustes de la plataforma
 * Descripción: Resuelve el valor por defecto de cada ajuste del registro con los lectores puros de configuración de cada feature (variables de entorno vigentes: AI_USE_CASE_SETTINGS, AI_QUOTAS, AI_PRICES, EVALUATION_PASSING_GRADE, SIMULATION_*, RESERVATION_*, VENTILATOR_*) o con las constantes del código (gracia de entrega, umbrales de la rúbrica, multiplicadores de tiempo, verificación de tema activa)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { AI_USE_CASE_VALUES, type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { type AiSettingsSnapshot, buildAiSettingsSnapshot, readAiSettingsSource } from "@/features/ai/infrastructure/config/ai-settings.provider";
import { ATTEMPT_SUBMIT_GRACE_MS } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { type PlatformSettingDefaults } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import { type AiUseCaseSettingKey, type AiUseCaseSettingValue } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { readReservationSettings } from "@/features/reservations/infrastructure/config/reservation-settings.config";
import { type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { MS_PER_MINUTE, readSimulationSessionSettings } from "@/features/simulation/infrastructure/config/simulation-session-config";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { readVentilatorCommandsSettings } from "@/features/ventilator-commands/infrastructure/config/ventilator-commands-config";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { readVentilatorTelemetrySettings } from "@/features/ventilator-telemetry/infrastructure/config/ventilator-telemetry-config";

const MS_PER_SECOND: number = 1000;

export function readPlatformSettingDefaults(configService: ConfigService<EnvironmentVariables, true>): PlatformSettingDefaults {
  const ai: AiSettingsSnapshot = buildAiSettingsSnapshot(readAiSettingsSource(configService));
  const simulation: SimulationSessionSettings = readSimulationSessionSettings(configService);
  const reservations: ReservationSettings = readReservationSettings(configService);
  const telemetry: VentilatorTelemetrySettings = readVentilatorTelemetrySettings(configService);
  const commands: VentilatorCommandsSettings = readVentilatorCommandsSettings(configService);
  const aiUseCases: Record<AiUseCaseSettingKey, AiUseCaseSettingValue> = Object.fromEntries(
    AI_USE_CASE_VALUES.map((useCase: AiUseCaseValue): [string, AiUseCaseSettingValue] => [`ai.useCase.${useCase}`, ai.useCases[useCase]]),
  ) as Record<AiUseCaseSettingKey, AiUseCaseSettingValue>;

  return {
    ...aiUseCases,
    "ai.quotas": ai.quotas,
    "ai.prices": ai.prices,
    "ai.tutor.topicCheck.enabled": true,
    "evaluation.passingGrade": configService.get("EVALUATION_PASSING_GRADE", { infer: true }),
    "evaluation.submitGraceSeconds": ATTEMPT_SUBMIT_GRACE_MS / MS_PER_SECOND,
    "simulation.rubric.defaultThresholds": simulation.defaultRubricThresholds,
    "simulation.allowedTimeMultipliers": simulation.allowedTimeMultipliers,
    "simulation.abandonAfterMinutes": simulation.abandonAfterMs / MS_PER_MINUTE,
    "reservations.maxDurationMinutes": reservations.maxDurationMinutes,
    "reservations.slotMinutes": reservations.slotMinutes,
    "reservations.maxAdvanceDays": reservations.maxAdvanceDays,
    "reservations.maxUpcomingPerStudent": reservations.maxUpcomingPerStudent,
    "reservations.maxUpcomingPerGroup": reservations.maxUpcomingPerGroup,
    "telemetry.flushIntervalMs": telemetry.flushIntervalMs,
    "telemetry.staleAfterMs": telemetry.staleAfterMs,
    "telemetry.recordingHz": telemetry.recordingHz,
    "telemetry.recordingFlushSeconds": telemetry.recordingFlushSeconds,
    "commands.ratePerSecond": commands.ratePerSecond,
    "commands.ackTimeoutMs": commands.timeoutMs,
    "commands.safety.maxPeep": commands.safety.maxPeep,
    "commands.safety.maxPressureLimit": commands.safety.maxPressureLimit,
    "commands.safety.maxTidalVolume": commands.safety.maxTidalVolume,
    "commands.safety.maxRespiratoryRate": commands.safety.maxRespiratoryRate,
    "commands.safety.maxIeRatio": commands.safety.maxIeRatio,
  };
}
