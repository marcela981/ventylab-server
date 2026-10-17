/*
 * Funcionalidad: Adaptadores de ajustes de las features
 * Descripción: Construyen los objetos de ajustes que consumen reservas, telemetría y comandos del ventilador, sesiones de simulación, calificación de evaluaciones y analítica (nota aprobatoria y umbrales de riesgo): los campos editables son getters que leen el valor vigente de la fachada de ajustes de la plataforma en cada acceso y el resto sale de los lectores puros de configuración de cada feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AnalyticsSettings } from "@/features/analytics/application/ports/analytics-settings.interface";
import { type StudentRiskThresholds } from "@/features/analytics/domain/services/student-risk";
import { type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { PlatformSettingsFacade } from "@/features/platform-settings/application/services/platform-settings.facade";
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { type TimeMultiplier } from "@/features/simulation/domain/engine/engine.types";
import { type SimulationRubricThresholds } from "@/features/simulation/domain/scoring/simulation-rubric";
import { isTimeMultiplier } from "@/features/simulation/domain/value-objects/simulation-session-values";
import { MS_PER_MINUTE } from "@/features/simulation/infrastructure/config/simulation-session-config";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { clampSafetyLimits, type VentilatorCommandSafetyLimits } from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";

const MS_PER_SECOND: number = 1000;

export function createReservationSettings(settings: PlatformSettingsFacade, base: ReservationSettings): ReservationSettings {
  return {
    deviceId: base.deviceId,
    get maxDurationMinutes(): number {
      return settings.get("reservations.maxDurationMinutes");
    },
    get slotMinutes(): number {
      return settings.get("reservations.slotMinutes");
    },
    get maxAdvanceDays(): number {
      return settings.get("reservations.maxAdvanceDays");
    },
    get maxUpcomingPerStudent(): number {
      return settings.get("reservations.maxUpcomingPerStudent");
    },
    get maxUpcomingPerGroup(): number {
      return settings.get("reservations.maxUpcomingPerGroup");
    },
  };
}

export function createVentilatorTelemetrySettings(settings: PlatformSettingsFacade, base: VentilatorTelemetrySettings): VentilatorTelemetrySettings {
  return {
    ...base,
    get flushIntervalMs(): number {
      return settings.get("telemetry.flushIntervalMs");
    },
    get staleAfterMs(): number {
      return settings.get("telemetry.staleAfterMs");
    },
    get recordingHz(): number {
      return settings.get("telemetry.recordingHz");
    },
    get recordingFlushSeconds(): number {
      return settings.get("telemetry.recordingFlushSeconds");
    },
  };
}

export function createVentilatorCommandsSettings(settings: PlatformSettingsFacade, base: VentilatorCommandsSettings): VentilatorCommandsSettings {
  return {
    ...base,
    get timeoutMs(): number {
      return settings.get("commands.ackTimeoutMs");
    },
    get ratePerSecond(): number {
      return settings.get("commands.ratePerSecond");
    },
    get safety(): VentilatorCommandSafetyLimits {
      return clampSafetyLimits({
        maxPeep: settings.get("commands.safety.maxPeep"),
        maxPressureLimit: settings.get("commands.safety.maxPressureLimit"),
        maxTidalVolume: settings.get("commands.safety.maxTidalVolume"),
        maxRespiratoryRate: settings.get("commands.safety.maxRespiratoryRate"),
        maxIeRatio: settings.get("commands.safety.maxIeRatio"),
      });
    },
  };
}

export function createSimulationSessionSettings(settings: PlatformSettingsFacade, base: SimulationSessionSettings): SimulationSessionSettings {
  return {
    ...base,
    get abandonAfterMs(): number {
      return settings.get("simulation.abandonAfterMinutes") * MS_PER_MINUTE;
    },
    get defaultRubricThresholds(): SimulationRubricThresholds {
      return settings.get("simulation.rubric.defaultThresholds");
    },
    get allowedTimeMultipliers(): readonly TimeMultiplier[] {
      return settings.get("simulation.allowedTimeMultipliers").filter(isTimeMultiplier);
    },
  };
}

export function createEvaluationGradingConfig(settings: PlatformSettingsFacade): EvaluationGradingConfig {
  return {
    get passingGrade(): number {
      return settings.get("evaluation.passingGrade");
    },
    get submitGraceMs(): number {
      return settings.get("evaluation.submitGraceSeconds") * MS_PER_SECOND;
    },
  };
}

export function createAnalyticsSettings(settings: PlatformSettingsFacade): AnalyticsSettings {
  return {
    get passingGrade(): number {
      return settings.get("evaluation.passingGrade");
    },
    get riskThresholds(): StudentRiskThresholds {
      return {
        maxFailedEvaluations: settings.get("analytics.risk.maxFailedEvaluations"),
        minProgressPct: settings.get("analytics.risk.minProgressPct"),
        inactivityDays: settings.get("analytics.risk.inactivityDays"),
      };
    },
  };
}
