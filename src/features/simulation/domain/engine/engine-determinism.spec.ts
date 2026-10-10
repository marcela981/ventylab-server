/*
 * Funcionalidad: Pruebas de determinismo y rendimiento del motor fisiológico
 * Descripción: Verifica que dos repeticiones con el mismo caso, semilla y eventos producen el mismo hash FNV-1a de la línea de tiempo de métricas, que otra semilla con ruido lo cambia y que diez minutos simulados se repiten en menos de 500 ms
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildTestCase, fnv1aHash } from "./engine-test-cases-spec";
import { EngineCase, EngineEvent, ReplayResult } from "./engine.types";
import { replay } from "./simulation";

const TEN_MINUTES_MS: number = 600000;

const ACTIVE_CASE: EngineCase = buildTestCase({
  mechanics: { resistanceCmH2OPerLps: 12, complianceMlPerCmH2O: 40 },
  effort: { amplitudeCmH2O: 6, rateBpm: 18, inspiratoryFraction: 0.35 },
  deterioration: { ratePerMin: 0.05 },
  targets: { spo2Percent: { min: 92, max: 98 }, paco2MmHg: { min: 35, max: 45 } },
  settings: { mode: "PSV", pressureSupportCmH2O: 10 },
  events: [{ simTimeMs: 200000, type: "BRONCHOSPASM", resistanceFactor: 2 }],
});

const SESSION_EVENTS: EngineEvent[] = [
  { type: "PARAM_CHANGE", simTimeMs: 60000, changes: { pressureSupportCmH2O: 12 } },
  { type: "PARAM_CHANGE", simTimeMs: 120000, changes: { fio2: 0.5 } },
  { type: "PARAM_CHANGE", simTimeMs: 300000, changes: { mode: "SIMV", respiratoryRateBpm: 10 } },
  { type: "PARAM_CHANGE", simTimeMs: 420000, changes: { mode: "PCV", inspiratoryPressureCmH2O: 14 } },
];

function timelineHash(result: ReplayResult): number {
  return fnv1aHash(JSON.stringify(result.metricsTimeline));
}

describe("engine determinism", () => {
  it("produces an identical metrics timeline hash for the same case, seed and events", () => {
    const first: ReplayResult = replay(ACTIVE_CASE, 42, SESSION_EVENTS, TEN_MINUTES_MS);
    const second: ReplayResult = replay(ACTIVE_CASE, 42, [...SESSION_EVENTS].reverse(), TEN_MINUTES_MS);

    expect(first.metricsTimeline).toHaveLength(600);
    expect(timelineHash(second)).toBe(timelineHash(first));
  });

  it("changes the hash with a different seed when noise is on and keeps it when noise is off", () => {
    const seedA: number = timelineHash(replay(ACTIVE_CASE, 1, SESSION_EVENTS, 120000));
    const seedB: number = timelineHash(replay(ACTIVE_CASE, 2, SESSION_EVENTS, 120000));
    const quietA: number = timelineHash(replay(ACTIVE_CASE, 1, SESSION_EVENTS, 120000, { noise: false }));
    const quietB: number = timelineHash(replay(ACTIVE_CASE, 2, SESSION_EVENTS, 120000, { noise: false }));

    expect(seedB).not.toBe(seedA);
    expect(quietB).toBe(quietA);
  });

  it("replays ten simulated minutes at 50 Hz sampling in under 500 ms", () => {
    replay(ACTIVE_CASE, 7, SESSION_EVENTS, 60000, { sampleRateHz: 50 });
    const startedAt: bigint = process.hrtime.bigint();

    replay(ACTIVE_CASE, 7, SESSION_EVENTS, TEN_MINUTES_MS, { sampleRateHz: 50 });
    const elapsedMs: number = Number(process.hrtime.bigint() - startedAt) / 1e6;

    expect(elapsedMs).toBeLessThan(500);
  });
});
