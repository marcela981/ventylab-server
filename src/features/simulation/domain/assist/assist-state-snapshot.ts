/*
 * Funcionalidad: Estado actual para la asistencia de IA (versión 2)
 * Descripción: Arma el estado que reciben SIM_ASSIST 1.3.0 y SIM_ALARM_HELP 1.1.0, siempre del tiempo simulado actual de la sesión: primero lo crítico (tiempo simulado mm:ss, estado y gravedad del paciente con su etiqueta, alarmas activas con su prioridad, valor y umbral, gases y hemodinamia, mecánica del último ciclo, objetivos), luego los ajustes vigentes, los últimos cambios del usuario, las tendencias (pendientes de SpO2, PaCO2 y PAM por minuto simulado y puntos por minuto de paciente) y el resumen del caso; si no cabe en el límite se recorta por estructura (puntos de tendencia, resumen del caso, cambios más antiguos), nunca por caracteres, así el JSON es válido y las alarmas, los objetivos y los signos nunca se pierden
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";

import { type EngineMetrics, type PatientStatus, type VentilatorSettings } from "../engine";

import { type AssistParamChange, type AssistSnapshotInput, type AssistTrendPoint } from "./assist-snapshot";

export const ASSIST_STATE_MAX_LENGTH: number = 4000;
/** Window of the SpO2, PaCO2 and MAP slopes, in simulated minutes */
export const ASSIST_SLOPE_WINDOW_MIN: number = 5;
/** Severity from which the patient counts as critical for the prompt and the coherence check (also every CRITICAL status) */
export const CRITICAL_SEVERITY: number = 0.5;

const MS_PER_MINUTE: number = 60000;
const SUMMARY_MAX_LENGTH: number = 600;

export interface AssistSlopes {
  readonly windowMin: number;
  readonly spo2PerMin: number | null;
  readonly paco2PerMin: number | null;
  readonly mapPerMin: number | null;
}

export interface AssistStateInput extends AssistSnapshotInput {
  readonly slopes?: AssistSlopes;
  /** The client could not send its latest changes before asking (flush timed out) */
  readonly unsentChanges?: boolean;
  readonly language?: LanguageValue;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

const STATUS_LABELS: Readonly<Record<LanguageValue, Readonly<Record<PatientStatus, string>>>> = {
  es: { STABLE: "Estable", UNSTABLE: "Inestable", CRITICAL: "Crítico", ARREST: "Paro cardíaco", DECEASED: "Paciente fallecido" },
  en: { STABLE: "Stable", UNSTABLE: "Unstable", CRITICAL: "Critical", ARREST: "Cardiac arrest", DECEASED: "Deceased" },
};

const PRIORITY_LABELS: Readonly<Record<string, string>> = { HIGH: "HIGH", MEDIUM: "MEDIUM" };

const SETTING_KEYS: readonly (keyof VentilatorSettings)[] = [
  "mode",
  "tidalVolumeMl",
  "respiratoryRateBpm",
  "peepCmH2O",
  "fio2",
  "inspiratoryTimeS",
  "flowPattern",
  "inspiratoryPauseS",
  "inspiratoryPressureCmH2O",
  "pressureSupportCmH2O",
  "triggerType",
  "flowTriggerLpm",
  "pressureTriggerCmH2O",
  "cycleOffPercent",
  "apneaTimeS",
  "simvMandatoryType",
];

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor: number = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function nullableRound(value: number | null | undefined, digits: number): number | null {
  return value === null || value === undefined ? null : round(value, digits);
}

/** "mm:ss" of a simulated time (minutes keep growing past 59) */
export function formatSimTime(simTimeMs: number): string {
  const totalSeconds: number = Math.max(0, Math.floor(simTimeMs / 1000));
  const minutes: number = Math.floor(totalSeconds / 60);
  const seconds: number = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isCriticalState(metrics: EngineMetrics): boolean {
  const patient: EngineMetrics["patient"] = metrics.patient;
  const critical: boolean = patient !== null && (patient.status === "CRITICAL" || patient.status === "ARREST" || patient.status === "DECEASED" || patient.severity >= CRITICAL_SEVERITY);

  return critical || metrics.alarms.some((alarm: EngineMetrics["alarms"][number]): boolean => alarm.severity === "HIGH");
}

function slopeOf(points: readonly { x: number; y: number }[]): number | null {
  if (points.length < 2) {
    return null;
  }

  const meanX: number = points.reduce((sum: number, point: { x: number }) => sum + point.x, 0) / points.length;
  const meanY: number = points.reduce((sum: number, point: { y: number }) => sum + point.y, 0) / points.length;
  let numerator: number = 0;
  let denominator: number = 0;

  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }

  return denominator === 0 ? null : numerator / denominator;
}

/** Least-squares slopes per simulated minute over the last ASSIST_SLOPE_WINDOW_MIN simulated minutes of a metrics timeline */
export function buildAssistSlopes(timeline: readonly EngineMetrics[], windowMin: number = ASSIST_SLOPE_WINDOW_MIN): AssistSlopes {
  const last: EngineMetrics | undefined = timeline[timeline.length - 1];
  const fromMs: number = last === undefined ? 0 : last.simTimeMs - windowMin * MS_PER_MINUTE;
  const window: readonly EngineMetrics[] = timeline.filter((metrics: EngineMetrics): boolean => metrics.simTimeMs >= fromMs);
  const series = (value: (metrics: EngineMetrics) => number): number | null => {
    const slope: number | null = slopeOf(window.map((metrics: EngineMetrics) => ({ x: metrics.simTimeMs / MS_PER_MINUTE, y: value(metrics) })));

    return slope === null ? null : round(slope, 2);
  };

  return {
    windowMin,
    spo2PerMin: series((metrics: EngineMetrics) => metrics.gasExchange.spo2Percent),
    paco2PerMin: series((metrics: EngineMetrics) => metrics.gasExchange.paco2MmHg),
    mapPerMin: series((metrics: EngineMetrics) => metrics.hemodynamics.meanArterialPressureMmHg),
  };
}

function settingsObject(settings: Partial<VentilatorSettings>): JsonObject {
  const result: JsonObject = {};

  for (const key of SETTING_KEYS) {
    const value: VentilatorSettings[keyof VentilatorSettings] | undefined = settings[key];

    if (value !== undefined) {
      result[key] = typeof value === "number" ? round(value, 2) : value;
    }
  }

  return result;
}

function patientObject(metrics: EngineMetrics, language: LanguageValue): JsonObject | null {
  const patient: EngineMetrics["patient"] = metrics.patient;

  if (patient === null) {
    return null;
  }

  return {
    status: patient.status,
    statusLabel: STATUS_LABELS[language][patient.status],
    severityPercent: Math.round(Math.min(1, Math.max(0, patient.severity)) * 100),
    critical: isCriticalState(metrics),
    insults: [...patient.insults],
  };
}

function caseObject(input: AssistStateInput, includeSummary: boolean, includePatient: boolean): JsonObject {
  const { caseSummary } = input;
  const result: JsonObject = { title: caseSummary.title.trim().slice(0, 120), pathology: caseSummary.pathology, difficulty: caseSummary.difficulty };

  if (includeSummary && caseSummary.summary !== undefined && caseSummary.summary.trim().length > 0) {
    result.summary = caseSummary.summary.trim().slice(0, SUMMARY_MAX_LENGTH);
  }

  if (includePatient && caseSummary.patient !== undefined) {
    const patient: JsonObject = {};

    for (const [key, value] of Object.entries(caseSummary.patient)) {
      if (value !== undefined) {
        patient[key] = typeof value === "number" ? round(value, 1) : value;
      }
    }

    result.patient = patient;
  }

  return result;
}

interface StateParts {
  readonly trends: readonly AssistTrendPoint[];
  readonly changes: readonly AssistParamChange[];
  readonly includeSummary: boolean;
  readonly includeCasePatient: boolean;
}

function stateObject(input: AssistStateInput, parts: StateParts): JsonObject {
  const { metrics } = input;
  const language: LanguageValue = input.language ?? "es";
  const cycle: EngineMetrics["lastCycle"] = metrics.lastCycle;
  const result: JsonObject = {
    simTime: formatSimTime(metrics.simTimeMs),
    simTimeS: round(metrics.simTimeMs / 1000, 1),
    patient: patientObject(metrics, language),
    alarms: input.alarms.map((alarm: AssistSnapshotInput["alarms"][number]): JsonObject => ({
      code: alarm.code,
      priority: PRIORITY_LABELS[alarm.severity] ?? alarm.severity,
      value: round(alarm.value, 1),
      threshold: round(alarm.threshold, 1),
    })),
    vitals: {
      spo2Percent: round(metrics.gasExchange.spo2Percent, 1),
      pao2MmHg: round(metrics.gasExchange.pao2MmHg, 0),
      paco2MmHg: round(metrics.gasExchange.paco2MmHg, 1),
      ph: round(metrics.gasExchange.ph, 2),
      mapMmHg: round(metrics.hemodynamics.meanArterialPressureMmHg, 0),
      heartRateBpm: nullableRound(metrics.hemodynamics.heartRateBpm, 0),
      shuntFraction: round(metrics.gasExchange.shuntFraction, 2),
    },
    ventilation: {
      peakPressureCmH2O: nullableRound(cycle?.peakPressureCmH2O, 1),
      plateauPressureCmH2O: nullableRound(cycle?.plateauPressureCmH2O, 1),
      totalPeepCmH2O: nullableRound(cycle?.totalPeepCmH2O, 1),
      autoPeepCmH2O: nullableRound(cycle?.autoPeepCmH2O, 1),
      drivingPressureCmH2O: nullableRound(cycle?.drivingPressureCmH2O, 1),
      exhaledTidalVolumeMl: nullableRound(cycle?.exhaledTidalVolumeMl, 0),
      tidalVolumePerKgPbw: nullableRound(cycle?.tidalVolumePerKgPbw, 1),
      minuteVolumeLpm: round(metrics.ventilation.minuteVolumeLpm, 2),
      totalRateBpm: round(metrics.ventilation.totalRespiratoryRateBpm, 1),
      spontaneousRateBpm: round(metrics.ventilation.spontaneousRateBpm, 1),
      ieRatio: nullableRound(cycle?.ieRatio, 2),
      complianceMlPerCmH2O: round(metrics.conditions.complianceMlPerCmH2O, 1),
      resistanceCmH2OPerLps: round(metrics.conditions.resistanceCmH2OPerLps, 1),
      disconnected: metrics.conditions.disconnected,
    },
    targets: input.targets.map((target: AssistSnapshotInput["targets"][number]): JsonObject => ({
      id: target.id,
      status: target.status,
      value: nullableRound(target.value, 2),
      min: nullableRound(target.min, 2),
      max: nullableRound(target.max, 2),
    })),
    settings: settingsObject(input.settings),
    recentChanges: parts.changes.map((change: AssistParamChange): JsonObject => ({
      atS: round(change.simTimeMs / 1000, 1),
      set: settingsObject(change.changes),
      ...(change.previous === undefined ? {} : { from: settingsObject(change.previous) }),
    })),
  };

  if (input.unsentChanges === true) {
    result.unsentChanges = true;
  }

  if (input.slopes !== undefined) {
    result.trendSlopes = {
      windowSimMin: input.slopes.windowMin,
      spo2PercentPerMin: input.slopes.spo2PerMin,
      paco2MmHgPerMin: input.slopes.paco2PerMin,
      mapMmHgPerMin: input.slopes.mapPerMin,
    };
  }

  result.trends = parts.trends.map((point: AssistTrendPoint): JsonObject => ({
    atS: round(point.simTimeMs / 1000, 0),
    spo2: round(point.spo2Percent, 1),
    paco2: round(point.paco2MmHg, 0),
    ph: round(point.ph, 2),
    map: round(point.mapMmHg, 0),
    hr: nullableRound(point.heartRateBpm, 0),
    status: point.status,
  }));
  result.case = caseObject(input, parts.includeSummary, parts.includeCasePatient);
  result.mode = input.mode;

  return result;
}

/** Current-state JSON for the simulator prompts; always valid JSON within maxLength, critical fields never dropped */
export function buildAssistState(input: AssistStateInput, maxLength: number = ASSIST_STATE_MAX_LENGTH): string {
  const trends: AssistTrendPoint[] = [...(input.trends ?? [])];
  const changes: AssistParamChange[] = [...input.recentChanges].sort((a: AssistParamChange, b: AssistParamChange): number => a.simTimeMs - b.simTimeMs);
  let includeSummary: boolean = true;
  let includeCasePatient: boolean = true;

  for (;;) {
    const text: string = JSON.stringify(stateObject(input, { trends, changes, includeSummary, includeCasePatient }));

    if (text.length <= maxLength) {
      return text;
    }

    if (trends.length > 0) {
      trends.shift();
    } else if (includeSummary) {
      includeSummary = false;
    } else if (changes.length > 0) {
      changes.shift();
    } else if (includeCasePatient) {
      includeCasePatient = false;
    } else {
      // Every remaining field is bounded and critical: return it whole rather than an invalid JSON.
      return text;
    }
  }
}
