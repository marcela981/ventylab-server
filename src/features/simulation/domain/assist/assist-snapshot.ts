/*
 * Funcionalidad: Instantánea de la simulación para la asistencia
 * Descripción: Construye un resumen compacto y determinista (JSON de a lo sumo 3000 caracteres) del estado de una sesión de simulación para el asistente de IA: datos clínicos del caso ficticio, modo, ajustes del ventilador, métricas del último ciclo, gases, alarmas, objetivos y cambios recientes de parámetros. No admite ni incluye identificadores del estudiante; si excede el límite descarta primero los cambios más antiguos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Alarm, EngineMetrics, PatientSex, TargetStatus, VentilatorSettings } from "../engine";

export const ASSIST_SNAPSHOT_MAX_LENGTH: number = 3000;
export const ASSIST_MAX_RECENT_CHANGES: number = 10;

const TITLE_MAX_LENGTH: number = 120;
const SUMMARY_MAX_LENGTH: number = 600;

export type AssistMode = "FREE" | "EXAM";

export interface AssistCasePatient {
  readonly sex?: PatientSex;
  readonly ageYears?: number;
  readonly heightCm?: number;
  readonly weightKg?: number;
}

export interface AssistCaseSummary {
  readonly title: string;
  readonly pathology: string;
  readonly difficulty: string;
  readonly summary?: string;
  readonly patient?: AssistCasePatient;
}

export interface AssistParamChange {
  readonly simTimeMs: number;
  readonly changes: Partial<VentilatorSettings>;
  readonly previous?: Partial<VentilatorSettings>;
}

export interface AssistSnapshotInput {
  readonly caseSummary: AssistCaseSummary;
  readonly mode: AssistMode;
  readonly settings: VentilatorSettings;
  readonly metrics: EngineMetrics;
  readonly alarms: readonly Alarm[];
  readonly targets: readonly TargetStatus[];
  readonly recentChanges: readonly AssistParamChange[];
}

type SnapshotValue = string | number | boolean | null | SnapshotValue[] | { [key: string]: SnapshotValue };

type SnapshotObject = { [key: string]: SnapshotValue };

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

export function buildAssistSnapshot(input: AssistSnapshotInput): string {
  const changes: AssistParamChange[] = selectRecentChanges(input.recentChanges);
  let includeSummary: boolean = true;

  for (;;) {
    const text: string = JSON.stringify(snapshotObject(input, changes, includeSummary));

    if (text.length <= ASSIST_SNAPSHOT_MAX_LENGTH) {
      return text;
    }

    if (changes.length > 0) {
      changes.shift();
    } else if (includeSummary) {
      includeSummary = false;
    } else {
      // Bounded by construction (fixed fields, truncated free text); kept as a last guard so the contract never breaks.
      return text.slice(0, ASSIST_SNAPSHOT_MAX_LENGTH);
    }
  }
}

function selectRecentChanges(changes: readonly AssistParamChange[]): AssistParamChange[] {
  const ordered: AssistParamChange[] = changes
    .map((change: AssistParamChange, index: number): { change: AssistParamChange; index: number } => ({ change, index }))
    .sort((a: { change: AssistParamChange; index: number }, b: { change: AssistParamChange; index: number }): number =>
      a.change.simTimeMs === b.change.simTimeMs ? a.index - b.index : a.change.simTimeMs - b.change.simTimeMs,
    )
    .map((entry: { change: AssistParamChange; index: number }): AssistParamChange => entry.change);

  return ordered.slice(Math.max(0, ordered.length - ASSIST_MAX_RECENT_CHANGES));
}

function snapshotObject(input: AssistSnapshotInput, changes: readonly AssistParamChange[], includeSummary: boolean): SnapshotObject {
  const { metrics } = input;
  const cycle: EngineMetrics["lastCycle"] = metrics.lastCycle;

  return {
    case: caseObject(input.caseSummary, includeSummary),
    mode: input.mode,
    simTimeS: round(metrics.simTimeMs / 1000, 1),
    settings: settingsObject(input.settings),
    lastCycle:
      cycle === null
        ? null
        : {
          breathType: cycle.breathType,
          peakPressureCmH2O: round(cycle.peakPressureCmH2O, 1),
          plateauPressureCmH2O: round(cycle.plateauPressureCmH2O, 1),
          drivingPressureCmH2O: round(cycle.drivingPressureCmH2O, 1),
          totalPeepCmH2O: round(cycle.totalPeepCmH2O, 1),
          autoPeepCmH2O: round(cycle.autoPeepCmH2O, 1),
          meanAirwayPressureCmH2O: round(cycle.meanAirwayPressureCmH2O, 1),
          exhaledTidalVolumeMl: round(cycle.exhaledTidalVolumeMl, 0),
          tidalVolumePerKgPbw: round(cycle.tidalVolumePerKgPbw, 1),
          inspiratoryTimeS: round(cycle.inspiratoryTimeMs / 1000, 2),
          expiratoryTimeS: round(cycle.expiratoryTimeMs / 1000, 2),
          ieRatio: round(cycle.ieRatio, 2),
        },
    ventilation: {
      totalRateBpm: round(metrics.ventilation.totalRespiratoryRateBpm, 1),
      spontaneousRateBpm: round(metrics.ventilation.spontaneousRateBpm, 1),
      minuteVolumeLpm: round(metrics.ventilation.minuteVolumeLpm, 2),
      alveolarVentilationLpm: round(metrics.ventilation.alveolarVentilationLpm, 2),
    },
    gases: {
      spo2Percent: round(metrics.gasExchange.spo2Percent, 1),
      pao2MmHg: round(metrics.gasExchange.pao2MmHg, 0),
      paco2MmHg: round(metrics.gasExchange.paco2MmHg, 1),
      ph: round(metrics.gasExchange.ph, 2),
      shuntFraction: round(metrics.gasExchange.shuntFraction, 2),
    },
    mapMmHg: round(metrics.hemodynamics.meanArterialPressureMmHg, 0),
    mechanics: {
      complianceMlPerCmH2O: round(metrics.conditions.complianceMlPerCmH2O, 1),
      resistanceCmH2OPerLps: round(metrics.conditions.resistanceCmH2OPerLps, 1),
      disconnected: metrics.conditions.disconnected,
    },
    alarms: input.alarms.map(
      (alarm: Alarm): SnapshotObject => ({ code: alarm.code, severity: alarm.severity, value: round(alarm.value, 1), threshold: round(alarm.threshold, 1) }),
    ),
    targets: input.targets.map(
      (target: TargetStatus): SnapshotObject => ({
        id: target.id,
        status: target.status,
        value: nullableRound(target.value, 2),
        min: nullableRound(target.min, 2),
        max: nullableRound(target.max, 2),
      }),
    ),
    recentChanges: changes.map((change: AssistParamChange): SnapshotObject => {
      const entry: SnapshotObject = { atS: round(change.simTimeMs / 1000, 1), set: settingsObject(change.changes) };

      if (change.previous !== undefined) {
        entry.from = settingsObject(change.previous);
      }

      return entry;
    }),
  };
}

function caseObject(caseSummary: AssistCaseSummary, includeSummary: boolean): SnapshotObject {
  const result: SnapshotObject = {
    title: truncate(caseSummary.title, TITLE_MAX_LENGTH),
    pathology: caseSummary.pathology,
    difficulty: caseSummary.difficulty,
  };

  if (includeSummary && caseSummary.summary !== undefined && caseSummary.summary.trim().length > 0) {
    result.summary = truncate(caseSummary.summary, SUMMARY_MAX_LENGTH);
  }

  const patient: AssistCasePatient | undefined = caseSummary.patient;

  if (patient !== undefined) {
    const patientObject: SnapshotObject = {};

    if (patient.sex !== undefined) {
      patientObject.sex = patient.sex;
    }

    if (patient.ageYears !== undefined) {
      patientObject.ageYears = round(patient.ageYears, 0);
    }

    if (patient.heightCm !== undefined) {
      patientObject.heightCm = round(patient.heightCm, 0);
    }

    if (patient.weightKg !== undefined) {
      patientObject.weightKg = round(patient.weightKg, 1);
    }

    result.patient = patientObject;
  }

  return result;
}

function settingsObject(settings: Partial<VentilatorSettings>): SnapshotObject {
  const result: SnapshotObject = {};

  for (const key of SETTING_KEYS) {
    const value: VentilatorSettings[keyof VentilatorSettings] | undefined = settings[key];

    if (value !== undefined) {
      result[key] = typeof value === "number" ? round(value, 2) : value;
    }
  }

  return result;
}

function truncate(text: string, maxLength: number): string {
  const trimmed: string = text.trim();

  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 1)}…`;
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor: number = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function nullableRound(value: number | null, digits: number): number | null {
  return value === null ? null : round(value, digits);
}
