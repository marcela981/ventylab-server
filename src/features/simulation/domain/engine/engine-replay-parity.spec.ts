/*
 * Funcionalidad: Pruebas de paridad entre la repetición del servidor y el worker del navegador
 * Descripción: En un caso de SDRA inestable que se deteriora sin ningún evento (el estudiante no toca nada), la repetición del servidor hasta un tiempo simulado arbitrario da exactamente las mismas métricas que avanzar el motor por tramos como lo hace el worker de la consola (mismo caso, semilla y multiplicador, con ruido), el paciente ya está crítico a ese tiempo y no es el paciente inicial; la huella de esas métricas está fijada aquí y en la prueba equivalente del worker en ventilab-web, así ambos repositorios comparan el mismo resultado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildTestCase, fnv1aHash } from "./engine-test-cases-spec";
import { EngineCase, EngineMetrics, EngineState, EvolutionProfile } from "./engine.types";
import { createSimulation, getMetrics, replay, step } from "./simulation";

const PARITY_SEED: number = 1984941366;
const PARITY_SIM_TIME_MS: number = 76200;
const PARITY_METRICS_HASH: number = 3221113573;

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

function parityCase(): EngineCase {
  return buildTestCase({
    mechanics: { complianceMlPerCmH2O: 30, resistanceCmH2OPerLps: 12 },
    gasExchange: {
      shuntCurve: [
        { peepCmH2O: 0, shuntFraction: 0.45 },
        { peepCmH2O: 5, shuntFraction: 0.35 },
        { peepCmH2O: 10, shuntFraction: 0.22 },
        { peepCmH2O: 15, shuntFraction: 0.14 },
        { peepCmH2O: 20, shuntFraction: 0.11 },
      ],
      initialPao2MmHg: 60,
      deadSpaceMl: 150,
    },
    deterioration: { ratePerMin: 0.06, maxComplianceLossFraction: 0.3, maxShuntIncrease: 0.3 },
    evolution: UNSTABLE_EVOLUTION,
  });
}

/** The worker advances the engine tick by tick (50 Hz at ×4: 80 simulated ms per tick, with uneven ticks) */
function workerStyle(engineCase: EngineCase, untilMs: number): EngineMetrics {
  const state: EngineState = createSimulation(engineCase, PARITY_SEED, { timeMultiplier: 4 });
  const ticks: readonly number[] = [80, 80, 75, 85, 80, 160, 40];
  let index: number = 0;

  while (state.simTimeMs < untilMs) {
    step(state, Math.min(ticks[index % ticks.length], untilMs - state.simTimeMs));
    index += 1;
  }

  return getMetrics(state);
}

describe("server replay parity with the console worker", () => {
  it("rebuilds the deterioration without events at an arbitrary simulated time exactly as the worker computed it", () => {
    const engineCase: EngineCase = parityCase();
    const replayed: EngineMetrics = replay(engineCase, PARITY_SEED, [], PARITY_SIM_TIME_MS, { timeMultiplier: 4 }).final;

    expect(replayed).toEqual(workerStyle(engineCase, PARITY_SIM_TIME_MS));
    expect(replayed.simTimeMs).toBe(PARITY_SIM_TIME_MS);
    // Pinned in ventilab-web too (sim-engine runtime parity test): same engine, case, seed and time in both repositories.
    expect(fnv1aHash(JSON.stringify(replayed))).toBe(PARITY_METRICS_HASH);
  });

  it("is no longer the initial patient: the old replay up to the last event (t = 0) showed a stable one", () => {
    const engineCase: EngineCase = parityCase();
    const initial: EngineMetrics = replay(engineCase, PARITY_SEED, [], 0, { timeMultiplier: 4 }).final;
    const current: EngineMetrics = replay(engineCase, PARITY_SEED, [], PARITY_SIM_TIME_MS, { timeMultiplier: 4 }).final;

    expect(initial.patient?.status).toBe("STABLE");
    expect(current.patient?.status).toBe("CRITICAL");
    expect(current.gasExchange.spo2Percent).toBeLessThan(initial.gasExchange.spo2Percent - 10);
    expect(current.alarms.map((alarm: EngineMetrics["alarms"][number]) => alarm.code)).toContain("LOW_SPO2");
  });
});
