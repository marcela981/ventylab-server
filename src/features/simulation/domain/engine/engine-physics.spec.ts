/*
 * Funcionalidad: Pruebas físicas del motor fisiológico
 * Descripción: Contrasta el motor con soluciones analíticas (VCV y PCV pasivos, espiración exponencial, auto-PEEP, PaCO2 de equilibrio y SpO2 según la curva de reclutamiento) con tolerancia de 2 %
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildTestCase, relativeError } from "./engine-test-cases-spec";
import { CycleMetrics, EngineCase, EngineMetrics, EngineState, ShuntCurvePoint, WaveformSample } from "./engine.types";
import { alveolarPo2, equilibriumPao2, severinghausSaturation, shuntFractionAtPeep } from "./gas-exchange";
import { createSimulation, getMetrics, getWaveformBuffer, replay, step } from "./simulation";

const TOLERANCE: number = 0.02;

function requireCycle(state: EngineState): CycleMetrics {
  const cycle: CycleMetrics | null = getMetrics(state).lastCycle;

  if (cycle === null) {
    throw new Error("Expected a closed cycle");
  }

  return cycle;
}

function sampleAt(samples: readonly WaveformSample[], simTimeMs: number): WaveformSample {
  const sample: WaveformSample | undefined = samples.find((item: WaveformSample): boolean => item.simTimeMs === simTimeMs);

  if (sample === undefined) {
    throw new Error(`No sample at ${simTimeMs} ms`);
  }

  return sample;
}

describe("engine physics", () => {
  it("matches Ppeak = PEEP + Vt/C + R·Flow and Pplat = PEEP + Vt/C in passive square-flow VCV", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false });

    step(state, 5001);
    const cycle: CycleMetrics = requireCycle(state);

    expect(relativeError(cycle.peakPressureCmH2O, 5 + 500 / 50 + 10 * 0.5)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(cycle.plateauPressureCmH2O, 5 + 500 / 50)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(cycle.drivingPressureCmH2O, 500 / 50)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(cycle.inspiredTidalVolumeMl, 500)).toBeLessThanOrEqual(TOLERANCE);
  });

  it("delivers Vt = C·ΔP·(1 − e^(−Ti/τ)) in passive PCV", () => {
    const state: EngineState = createSimulation(
      buildTestCase({ settings: { mode: "PCV", inspiratoryPressureCmH2O: 15, respiratoryRateBpm: 10 } }),
      1,
      { noise: false },
    );
    const expectedTidalVolumeMl: number = 50 * 15 * (1 - Math.exp(-1000 / 500));

    step(state, 6001);
    const cycle: CycleMetrics = requireCycle(state);

    expect(relativeError(cycle.inspiredTidalVolumeMl, expectedTidalVolumeMl)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(cycle.peakPressureCmH2O, 20)).toBeLessThanOrEqual(TOLERANCE);
  });

  it("keeps 37 % of the tidal volume one time constant into passive expiration", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false });

    step(state, 2000);
    const samples: WaveformSample[] = getWaveformBuffer(state).samples;
    const endInspiration: WaveformSample = sampleAt(samples, 1000);
    const oneTimeConstant: WaveformSample = sampleAt(samples, 1500);

    expect(relativeError(endInspiration.volumeMl, 500)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(oneTimeConstant.volumeMl / endInspiration.volumeMl, Math.exp(-1))).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(sampleAt(samples, 500).flowLpm, 30)).toBeLessThanOrEqual(TOLERANCE);
  });

  it("produces emergent auto-PEEP with high resistance and high rate, and none at a low rate", () => {
    const fastCase: EngineCase = buildTestCase({
      mechanics: { resistanceCmH2OPerLps: 30 },
      settings: { respiratoryRateBpm: 30, inspiratoryTimeS: 0.8 },
    });
    const slowCase: EngineCase = buildTestCase({
      mechanics: { resistanceCmH2OPerLps: 30 },
      settings: { respiratoryRateBpm: 10, inspiratoryTimeS: 0.8 },
    });
    const decay: number = Math.exp(-1200 / 1500);
    const expectedAutoPeepCmH2O: number = (500 * decay) / (1 - decay) / 50;

    const fast: EngineMetrics = replay(fastCase, 1, [], 60000, { noise: false }).final;
    const slow: EngineMetrics = replay(slowCase, 1, [], 60000, { noise: false }).final;

    expect(fast.lastCycle?.autoPeepCmH2O ?? 0).toBeGreaterThan(5);
    expect(relativeError(fast.lastCycle?.autoPeepCmH2O ?? 0, expectedAutoPeepCmH2O)).toBeLessThanOrEqual(TOLERANCE);
    expect(slow.lastCycle?.autoPeepCmH2O ?? 1).toBeLessThan(0.5);
  });

  it("halves the equilibrium PaCO2 when alveolar ventilation doubles", () => {
    const gasExchange: { paco2TimeConstantMin: number } = { paco2TimeConstantMin: 1 };
    const baseCase: EngineCase = buildTestCase({
      gasExchange,
      settings: { respiratoryRateBpm: 12, inspiratoryTimeS: 0.8 },
    });
    const doubledCase: EngineCase = buildTestCase({
      gasExchange,
      settings: { respiratoryRateBpm: 24, inspiratoryTimeS: 0.8 },
    });

    const base: EngineMetrics = replay(baseCase, 1, [], 300000, { noise: false, timeMultiplier: 4 }).final;
    const doubled: EngineMetrics = replay(doubledCase, 1, [], 300000, { noise: false, timeMultiplier: 4 }).final;

    expect(relativeError(doubled.gasExchange.alveolarVentilationLpm / base.gasExchange.alveolarVentilationLpm, 2)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(base.gasExchange.paco2MmHg, (0.863 * 200) / 4.2)).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(doubled.gasExchange.paco2MmHg / base.gasExchange.paco2MmHg, 0.5)).toBeLessThanOrEqual(TOLERANCE);
  });

  it("raises SpO2 with PEEP as the recruitment curve of the case dictates", () => {
    const shuntCurve: ShuntCurvePoint[] = [
      { peepCmH2O: 0, shuntFraction: 0.4 },
      { peepCmH2O: 5, shuntFraction: 0.3 },
      { peepCmH2O: 15, shuntFraction: 0.1 },
      { peepCmH2O: 20, shuntFraction: 0.08 },
    ];
    const lowPeepCase: EngineCase = buildTestCase({
      gasExchange: { shuntCurve, initialPaco2MmHg: 41.1 },
      settings: { peepCmH2O: 5 },
    });
    const highPeepCase: EngineCase = buildTestCase({
      gasExchange: { shuntCurve, initialPaco2MmHg: 41.1 },
      settings: { peepCmH2O: 15 },
    });
    const expectedSpo2 = (metrics: EngineMetrics): number =>
      severinghausSaturation(
        equilibriumPao2(alveolarPo2(0.4, metrics.gasExchange.paco2MmHg), metrics.gasExchange.shuntFraction, 14, 5),
      );

    const low: EngineMetrics = replay(lowPeepCase, 1, [], 120000, { noise: false }).final;
    const high: EngineMetrics = replay(highPeepCase, 1, [], 120000, { noise: false }).final;

    expect(relativeError(low.gasExchange.shuntFraction, shuntFractionAtPeep(shuntCurve, 5))).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(high.gasExchange.shuntFraction, shuntFractionAtPeep(shuntCurve, 15))).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(low.gasExchange.spo2Percent, expectedSpo2(low))).toBeLessThanOrEqual(TOLERANCE);
    expect(relativeError(high.gasExchange.spo2Percent, expectedSpo2(high))).toBeLessThanOrEqual(TOLERANCE);
    expect(high.gasExchange.spo2Percent).toBeGreaterThan(low.gasExchange.spo2Percent + 2);
  });
});
