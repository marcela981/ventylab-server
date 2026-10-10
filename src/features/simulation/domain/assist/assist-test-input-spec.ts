/*
 * Funcionalidad: Datos de prueba de la asistencia de simulación
 * Descripción: Constructor de entradas de instantánea (caso clínico ficticio, ajustes, métricas del motor, alarmas y objetivos) con valores normales que cada prueba de la asistencia sobrescribe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Alarm, CycleMetrics, EngineMetrics, GasExchangeSnapshot, TargetStatus, VentilatorSettings } from "../engine";

import { AssistParamChange, AssistSnapshotInput } from "./assist-snapshot";

export interface AssistInputOverrides {
  readonly settings?: Partial<VentilatorSettings>;
  readonly cycle?: Partial<CycleMetrics> | null;
  readonly gas?: Partial<GasExchangeSnapshot>;
  readonly alarms?: readonly Alarm[];
  readonly targets?: readonly TargetStatus[];
  readonly recentChanges?: readonly AssistParamChange[];
  readonly summary?: string;
}

export const NORMAL_SETTINGS: VentilatorSettings = {
  mode: "VCV",
  tidalVolumeMl: 420,
  respiratoryRateBpm: 16,
  peepCmH2O: 5,
  fio2: 0.4,
  inspiratoryTimeS: 1,
  flowPattern: "SQUARE",
  inspiratoryPauseS: 0.2,
  inspiratoryPressureCmH2O: 15,
  pressureSupportCmH2O: 10,
  triggerType: "FLOW",
  flowTriggerLpm: 2,
  pressureTriggerCmH2O: -2,
  cycleOffPercent: 25,
  apneaTimeS: 20,
  simvMandatoryType: "VCV",
};

const NORMAL_CYCLE: CycleMetrics = {
  cycleIndex: 10,
  startMs: 36000,
  endMs: 39750,
  breathType: "MANDATORY",
  triggered: false,
  peakPressureCmH2O: 22,
  plateauPressureCmH2O: 18,
  totalPeepCmH2O: 5,
  autoPeepCmH2O: 0,
  drivingPressureCmH2O: 13,
  meanAirwayPressureCmH2O: 9,
  inspiredTidalVolumeMl: 420,
  exhaledTidalVolumeMl: 418,
  tidalVolumePerKgPbw: 6.5,
  inspiratoryTimeMs: 1200,
  expiratoryTimeMs: 2550,
  ieRatio: 0.47,
  totalRespiratoryRateBpm: 16,
  mandatoryRateBpm: 16,
  spontaneousRateBpm: 0,
  minuteVolumeLpm: 6.7,
  mechanicalPowerJPerMin: 9.4,
};

const NORMAL_GAS: GasExchangeSnapshot = {
  paco2MmHg: 40,
  paco2EquilibriumMmHg: 40,
  ph: 7.4,
  pao2MmHg: 95,
  pao2EquilibriumMmHg: 95,
  spo2Percent: 96,
  alveolarPo2MmHg: 230,
  shuntFraction: 0.08,
  alveolarVentilationLpm: 4.8,
};

export function buildAssistInput(overrides: AssistInputOverrides = {}): AssistSnapshotInput {
  const cycle: CycleMetrics | null = overrides.cycle === null ? null : { ...NORMAL_CYCLE, ...(overrides.cycle ?? {}) };
  const alarms: readonly Alarm[] = overrides.alarms ?? [];
  const targets: readonly TargetStatus[] = overrides.targets ?? [];
  const metrics: EngineMetrics = {
    engineVersion: "1.0.0",
    simTimeMs: 40000,
    lastCycle: cycle,
    ventilation: { totalRespiratoryRateBpm: 16, mandatoryRateBpm: 16, spontaneousRateBpm: 0, minuteVolumeLpm: 6.7, alveolarVentilationLpm: 4.8 },
    gasExchange: { ...NORMAL_GAS, ...(overrides.gas ?? {}) },
    hemodynamics: { meanArterialPressureMmHg: 85 },
    conditions: { resistanceCmH2OPerLps: 10, complianceMlPerCmH2O: 40, disconnected: false, deteriorationLevel: 0, appliedCaseEvents: [] },
    alarms,
    targets,
  };

  return {
    caseSummary: {
      title: "Síndrome de distrés respiratorio agudo moderado",
      pathology: "SDRA",
      difficulty: "INTERMEDIATE",
      summary: overrides.summary ?? "Paciente con neumonía bilateral e hipoxemia refractaria.",
      patient: { sex: "FEMALE", ageYears: 54, heightCm: 162, weightKg: 70 },
    },
    mode: "FREE",
    settings: { ...NORMAL_SETTINGS, ...(overrides.settings ?? {}) },
    metrics,
    alarms,
    targets,
    recentChanges: overrides.recentChanges ?? [],
  };
}
