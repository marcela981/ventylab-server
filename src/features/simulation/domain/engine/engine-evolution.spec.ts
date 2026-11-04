/*
 * Funcionalidad: Pruebas de propiedades fisiológicas y de evolución del motor 2.0.0
 * Descripción: Verifica propiedades fisiológicas esperadas (la PEEP en SDRA mejora la PaO2 hasta un punto y baja la PAM; bajar la FR en EPOC reduce la auto-PEEP; un Vt alto sube la presión meseta y la de distensión) y el modelo de evolución: deterioro por inacción en un caso inestable hasta el fallecimiento, mejoría con el ajuste correcto, paciente estable que nunca llega a crítico por esperar, determinismo con evolución, alarmas del paciente y eventos ignorados tras el fallecimiento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildTestCase, fnv1aHash, TestCaseOverrides } from "./engine-test-cases-spec";
import {
  Alarm,
  EngineCase,
  EngineEvent,
  EngineMetrics,
  EvolutionProfile,
  PatientStatus,
  ReplayResult,
  ShuntCurvePoint,
} from "./engine.types";
import { replay } from "./simulation";

const ARDS_SHUNT_CURVE: ShuntCurvePoint[] = [
  { peepCmH2O: 0, shuntFraction: 0.45 },
  { peepCmH2O: 5, shuntFraction: 0.35 },
  { peepCmH2O: 10, shuntFraction: 0.22 },
  { peepCmH2O: 15, shuntFraction: 0.14 },
  { peepCmH2O: 20, shuntFraction: 0.11 },
];

const NEUTRAL_EVOLUTION: EvolutionProfile = {
  initialSeverity: 0,
  minSeverity: 0,
  progressionRatePerMin: 0,
  viliRatePerMin: 0,
  recoveryRatePerMin: 0,
  arrestAfterCriticalMin: 10,
  deathAfterArrestMin: 2,
  baselineHeartRateBpm: 90,
};

const UNSTABLE_EVOLUTION: EvolutionProfile = {
  initialSeverity: 0.3,
  minSeverity: 0.1,
  progressionRatePerMin: 0.06,
  viliRatePerMin: 0.02,
  recoveryRatePerMin: 0.04,
  arrestAfterCriticalMin: 4,
  deathAfterArrestMin: 2,
  baselineHeartRateBpm: 100,
};

const FAST: { noise: boolean; timeMultiplier: 4 } = { noise: false, timeMultiplier: 4 };

function ardsCase(evolution: EvolutionProfile, overrides: TestCaseOverrides = {}): EngineCase {
  return buildTestCase({
    mechanics: { complianceMlPerCmH2O: 30, resistanceCmH2OPerLps: 12 },
    gasExchange: { shuntCurve: ARDS_SHUNT_CURVE, initialPao2MmHg: 60, deadSpaceMl: 150 },
    deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0.3, maxShuntIncrease: 0.3 },
    hemodynamics: { baselineMapMmHg: 80, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1.5 },
    settings: { tidalVolumeMl: 420, respiratoryRateBpm: 22, peepCmH2O: 5, fio2: 0.9, inspiratoryTimeS: 0.8 },
    evolution,
    ...overrides,
  });
}

function statusesOf(result: ReplayResult): PatientStatus[] {
  return result.metricsTimeline.map((metrics: EngineMetrics): PatientStatus => metrics.patient?.status ?? "STABLE");
}

describe("engine physiology properties", () => {
  it("improves PaO2 with PEEP in ARDS only up to a point and lowers MAP as PEEP rises", () => {
    const peeps: number[] = [5, 10, 15, 20];
    const finals: EngineMetrics[] = peeps.map(
      (peepCmH2O: number): EngineMetrics =>
        replay(ardsCase(NEUTRAL_EVOLUTION, { settings: { tidalVolumeMl: 420, respiratoryRateBpm: 22, peepCmH2O, fio2: 0.6, inspiratoryTimeS: 0.8 } }), 1, [], 120000, FAST).final,
    );
    const pao2: number[] = finals.map((metrics: EngineMetrics): number => metrics.gasExchange.pao2MmHg);
    const map: number[] = finals.map((metrics: EngineMetrics): number => metrics.hemodynamics.meanArterialPressureMmHg);

    expect(pao2[1]).toBeGreaterThan(pao2[0]);
    expect(pao2[2]).toBeGreaterThan(pao2[1]);
    // Beyond the plateau limit, overdistension cancels the recruitment gain.
    expect(pao2[3]).toBeLessThan(pao2[2]);
    expect(map[1]).toBeLessThanOrEqual(map[0]);
    expect(map[2]).toBeLessThan(map[1]);
    expect(map[3]).toBeLessThan(map[2]);
  });

  it("reduces auto-PEEP in COPD when the respiratory rate goes down", () => {
    const copd = (respiratoryRateBpm: number): EngineCase =>
      buildTestCase({
        mechanics: { complianceMlPerCmH2O: 60, resistanceCmH2OPerLps: 25 },
        settings: { tidalVolumeMl: 500, respiratoryRateBpm, inspiratoryTimeS: 1, peepCmH2O: 5 },
        evolution: NEUTRAL_EVOLUTION,
      });

    const fast: EngineMetrics = replay(copd(22), 1, [], 30000, { noise: false }).final;
    const slow: EngineMetrics = replay(copd(10), 1, [], 30000, { noise: false }).final;

    expect(fast.lastCycle?.autoPeepCmH2O ?? 0).toBeGreaterThan(1);
    expect(slow.lastCycle?.autoPeepCmH2O ?? 0).toBeLessThan(fast.lastCycle?.autoPeepCmH2O ?? 0);
  });

  it("raises plateau and driving pressure with a higher tidal volume", () => {
    const withVt = (tidalVolumeMl: number): EngineMetrics =>
      replay(buildTestCase({ settings: { tidalVolumeMl, inspiratoryPauseS: 0.3 }, evolution: NEUTRAL_EVOLUTION }), 1, [], 20000, {
        noise: false,
      }).final;

    const low: EngineMetrics = withVt(400);
    const high: EngineMetrics = withVt(700);

    expect(high.lastCycle?.plateauPressureCmH2O ?? 0).toBeGreaterThan((low.lastCycle?.plateauPressureCmH2O ?? 0) + 4);
    expect(high.lastCycle?.drivingPressureCmH2O ?? 0).toBeGreaterThan((low.lastCycle?.drivingPressureCmH2O ?? 0) + 4);
  });
});

describe("engine patient evolution (2.0.0)", () => {
  it("keeps the 1.0.0 behaviour without an evolution block", () => {
    const metrics: EngineMetrics = replay(buildTestCase(), 1, [], 10000, { noise: false }).final;

    expect(metrics.patient).toBeNull();
    expect(metrics.hemodynamics.heartRateBpm).toBeNull();
    expect(metrics.conditions.deteriorationLevel).toBe(0);
  });

  it("progresses to cardiac arrest and death when an unstable patient is left untreated", () => {
    const result: ReplayResult = replay(ardsCase(UNSTABLE_EVOLUTION), 3, [], 6 * 60000, FAST);
    const statuses: PatientStatus[] = statusesOf(result);
    const final: EngineMetrics = result.final;

    expect(statuses).toContain("UNSTABLE");
    expect(statuses).toContain("CRITICAL");
    expect(final.patient?.status).toBe("DECEASED");
    expect(final.patient?.heartRateBpm).toBe(0);
    expect(final.alarms.map((alarm: Alarm): string => alarm.code)).toContain("CARDIAC_ARREST");

    const firstCritical: number = final.patient?.firstCriticalAtMs ?? -1;
    const arrestAt: number = final.patient?.arrestAtMs ?? -1;
    const deceasedAt: number = final.patient?.deceasedAtMs ?? -1;

    expect(firstCritical).toBeGreaterThan(0);
    expect(arrestAt).toBeGreaterThan(firstCritical);
    // Death follows the arrest after deathAfterArrestMin patient minutes (sim minutes / multiplier).
    expect(deceasedAt - arrestAt).toBeGreaterThanOrEqual((2 * 60000) / 4 - 200);
  });

  it("improves severity and SpO2 when the ventilation is corrected", () => {
    const correction: EngineEvent[] = [
      { type: "PARAM_CHANGE", simTimeMs: 15000, changes: { peepCmH2O: 12, fio2: 0.8, tidalVolumeMl: 380 } },
    ];
    const untreated: EngineMetrics = replay(ardsCase(UNSTABLE_EVOLUTION), 3, [], 3 * 60000, FAST).final;
    const treated: ReplayResult = replay(ardsCase(UNSTABLE_EVOLUTION), 3, correction, 3 * 60000, FAST);
    const afterCorrection: EngineMetrics = treated.metricsTimeline[30];

    expect(treated.final.patient?.status).toBe("STABLE");
    expect(treated.final.patient?.severity ?? 1).toBeLessThan(afterCorrection.patient?.severity ?? 0);
    expect(treated.final.gasExchange.spo2Percent).toBeGreaterThan(untreated.gasExchange.spo2Percent + 5);
    expect(treated.final.gasExchange.spo2Percent).toBeGreaterThanOrEqual(88);
  });

  it("never turns critical when a stable patient is left at adequate settings", () => {
    const stable: EngineCase = buildTestCase({
      targets: { spo2Percent: { min: 92, max: 98 } },
      evolution: { ...UNSTABLE_EVOLUTION, initialSeverity: 0, minSeverity: 0 },
    });
    const result: ReplayResult = replay(stable, 5, [], 15 * 60000, { noise: true, timeMultiplier: 4 });

    expect(statusesOf(result).every((status: PatientStatus): boolean => status === "STABLE")).toBe(true);
    expect(result.final.patient?.severity).toBe(0);
    expect(result.final.hemodynamics.heartRateBpm).toBeGreaterThan(60);
  });

  it("is deterministic with evolution for the same seed and events", () => {
    const events: EngineEvent[] = [{ type: "PARAM_CHANGE", simTimeMs: 30000, changes: { peepCmH2O: 10 } }];
    const hash = (seed: number): number =>
      fnv1aHash(JSON.stringify(replay(ardsCase(UNSTABLE_EVOLUTION), seed, events, 120000, { timeMultiplier: 4 }).metricsTimeline));

    expect(hash(11)).toBe(hash(11));
  });

  it("raises the patient alarms from the same state", () => {
    const metrics: EngineMetrics = replay(ardsCase(UNSTABLE_EVOLUTION), 3, [], 60000, FAST).final;
    const codes: string[] = metrics.alarms.map((alarm: Alarm): string => alarm.code);

    expect(metrics.gasExchange.spo2Percent).toBeLessThan(90);
    expect(codes).toContain("LOW_SPO2");
    expect(metrics.hemodynamics.heartRateBpm ?? 0).toBeGreaterThan(100);
  });

  it("ignores ventilator changes after death", () => {
    const late: EngineEvent[] = [{ type: "PARAM_CHANGE", simTimeMs: 5.5 * 60000, changes: { peepCmH2O: 14, fio2: 1 } }];
    const result: ReplayResult = replay(ardsCase(UNSTABLE_EVOLUTION), 3, late, 6 * 60000, FAST);

    expect(result.final.patient?.status).toBe("DECEASED");
  });
});
