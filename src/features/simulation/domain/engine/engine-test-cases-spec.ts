/*
 * Funcionalidad: Casos de prueba del motor fisiológico
 * Descripción: Constructor de casos clínicos sintéticos y utilidades (tolerancia relativa, hash FNV-1a) compartidas por las pruebas del motor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CaseEvent,
  DeteriorationProfile,
  EngineCase,
  EngineMechanics,
  EngineTargets,
  GasExchangeProfile,
  PatientEffortProfile,
  VentilatorSettings,
} from "./engine.types";

export interface TestCaseOverrides {
  readonly mechanics?: Partial<EngineMechanics>;
  readonly settings?: Partial<VentilatorSettings>;
  readonly gasExchange?: Partial<GasExchangeProfile>;
  readonly effort?: Partial<PatientEffortProfile>;
  readonly deterioration?: Partial<DeteriorationProfile>;
  readonly targets?: EngineTargets;
  readonly events?: readonly CaseEvent[];
}

export function buildTestCase(overrides: TestCaseOverrides = {}): EngineCase {
  return {
    id: "test-case",
    patient: { sex: "MALE", heightCm: 175 },
    mechanics: { complianceMlPerCmH2O: 50, resistanceCmH2OPerLps: 10, ...overrides.mechanics },
    effort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35, ...overrides.effort },
    gasExchange: {
      vco2MlPerMin: 200,
      deadSpaceMl: 150,
      bicarbonateMmolPerL: 24,
      hemoglobinGPerDl: 14,
      arteriovenousO2DifferenceMlPerDl: 5,
      initialPaco2MmHg: 40,
      initialPao2MmHg: 90,
      paco2TimeConstantMin: 3,
      oxygenTimeConstantS: 10,
      shuntCurve: [{ peepCmH2O: 0, shuntFraction: 0.05 }],
      ...overrides.gasExchange,
    },
    hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 2 },
    deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0.3, maxShuntIncrease: 0.2, ...overrides.deterioration },
    initialSettings: {
      mode: "VCV",
      tidalVolumeMl: 500,
      respiratoryRateBpm: 12,
      peepCmH2O: 5,
      fio2: 0.4,
      inspiratoryTimeS: 1,
      flowPattern: "SQUARE",
      inspiratoryPauseS: 0,
      ...overrides.settings,
    },
    events: overrides.events ?? [],
    targets: overrides.targets ?? {},
  };
}

export function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.abs(expected);
}

export function fnv1aHash(text: string): number {
  let hash: number = 0x811c9dc5;

  for (let index: number = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}
