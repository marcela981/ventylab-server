/*
 * Funcionalidad: Pruebas de la evolución del paciente en los casos sembrados
 * Descripción: Recorre todos los casos sembrados (julio y listos para el motor) con el mapeo del motor 2.0.0 y verifica que, con los ajustes iniciales y sin intervención, ningún caso estable al inicio llega a crítico en 60 minutos del paciente y los inestables al inicio dejan al menos 30 minutos antes del fallecimiento; que el caso inestable de SDRA llega al fallecimiento sin intervención y mejora con PEEP según la tabla de ARDSNet y volumen protector; que las sesiones del motor 1.0.0 no reciben evolución; y que los casos sembrados pasan la validación de rangos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseSnapshot } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { assertValidClinicalCaseDefinition } from "@/features/clinical-cases/domain/services/clinical-case-definition-validator";
import {
  ENGINE_READY_CLINICAL_CASES,
  type EngineReadySeedCase,
  UNSTABLE_ARDS_CASE_ID,
} from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";
import { JULY_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/persistence/seed/july-clinical-cases.data";
import { SimulationCaseMapper, type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { type EngineEvent, type EngineMetrics, type PatientStatus, replay, type ReplayResult, type TimeMultiplier } from "@/features/simulation/domain/engine";

const SEED_CASES: readonly EngineReadySeedCase[] = [...JULY_CLINICAL_CASES, ...ENGINE_READY_CLINICAL_CASES];
const PATIENT_MINUTES: number = 60;
const MULTIPLIER: TimeMultiplier = 4;

function snapshotOf(seed: EngineReadySeedCase): ClinicalCaseSnapshot {
  return {
    id: seed.id,
    title: seed.content.title,
    status: "PUBLISHED",
    validatedByExpert: false,
    difficulty: seed.content.difficulty,
    pathology: seed.content.pathology,
    patientAge: seed.content.patientAge,
    patientWeightKg: seed.content.patientWeight,
    simulationReady: true,
    simulation: seed.content.simulation,
  };
}

function definitionOf(seed: EngineReadySeedCase, engineVersion?: string): SimulationCaseDefinition {
  const definition: SimulationCaseDefinition | undefined = SimulationCaseMapper.toDefinition(snapshotOf(seed), engineVersion);

  if (definition === undefined) {
    throw new Error(`Seed case ${seed.id} is not simulation ready`);
  }

  return definition;
}

function runPatientMinutes(seed: EngineReadySeedCase, minutes: number, events: readonly EngineEvent[] = []): ReplayResult {
  return replay(definitionOf(seed).engineCase, 7, events, (minutes * 60000) / MULTIPLIER, {
    noise: false,
    timeMultiplier: MULTIPLIER,
  });
}

function unstableSeed(): EngineReadySeedCase {
  const seed: EngineReadySeedCase | undefined = SEED_CASES.find((candidate: EngineReadySeedCase): boolean => candidate.id === UNSTABLE_ARDS_CASE_ID);

  if (seed === undefined) {
    throw new Error("Unstable ARDS seed case missing");
  }

  return seed;
}

describe("seeded clinical cases with the patient evolution (engine 2.0.0)", () => {
  const stableSeeds: EngineReadySeedCase[] = SEED_CASES.filter(
    (seed: EngineReadySeedCase): boolean => seed.content.simulation.mechanics !== undefined && seed.id !== UNSTABLE_ARDS_CASE_ID,
  );

  it.each(stableSeeds.map((seed: EngineReadySeedCase): [string, EngineReadySeedCase] => [seed.id, seed]))(
    "never lets %s die by waiting: stable at start never turns critical, unstable at start leaves at least 30 min",
    (_id: string, seed: EngineReadySeedCase) => {
      const result: ReplayResult = runPatientMinutes(seed, PATIENT_MINUTES);
      const statuses: PatientStatus[] = result.metricsTimeline.map(
        (metrics: EngineMetrics): PatientStatus => metrics.patient?.status ?? "STABLE",
      );
      // One snapshot per simulated second = MULTIPLIER patient-seconds: the first two patient-minutes.
      const stableAtStart: boolean = statuses.slice(0, (2 * 60) / MULTIPLIER).every((status: PatientStatus): boolean => status === "STABLE");
      const worst: PatientStatus[] = statuses.filter(
        (status: PatientStatus): boolean => status === "CRITICAL" || status === "ARREST" || status === "DECEASED",
      );
      const firstDeceasedIndex: number = statuses.indexOf("DECEASED");

      if (stableAtStart) {
        expect(worst).toHaveLength(0);
      } else {
        expect(firstDeceasedIndex === -1 || firstDeceasedIndex * MULTIPLIER >= 30 * 60).toBe(true);
      }
    },
  );

  it("keeps every seeded case within the physiological ranges", () => {
    for (const seed of SEED_CASES) {
      expect(() => assertValidClinicalCaseDefinition(seed.content)).not.toThrow();
    }
  });

  it("lets the untreated unstable ARDS patient die within its case time", () => {
    const final: EngineMetrics = runPatientMinutes(unstableSeed(), 20).final;

    expect(final.patient?.status).toBe("DECEASED");
    expect((final.patient?.deceasedAtMs ?? 0) * MULTIPLIER).toBeLessThan(18 * 60000);
    expect((final.patient?.deceasedAtMs ?? 0) * MULTIPLIER).toBeGreaterThan(8 * 60000);
  });

  it("recovers the unstable ARDS patient with PEEP per the ARDSNet table and a protective tidal volume", () => {
    const correction: EngineEvent[] = [
      { type: "PARAM_CHANGE", simTimeMs: 15000, changes: { peepCmH2O: 12, fio2: 0.8, tidalVolumeMl: 380 } },
    ];
    const final: EngineMetrics = runPatientMinutes(unstableSeed(), 20, correction).final;

    expect(final.patient?.status).toBe("STABLE");
    expect(final.gasExchange.spo2Percent).toBeGreaterThanOrEqual(88);
    expect(final.patient?.severity ?? 1).toBeLessThan(0.3);
  });

  it("gives no evolution to sessions recorded with the engine 1.0.0", () => {
    const legacy: SimulationCaseDefinition = definitionOf(unstableSeed(), "1.0.0");
    const current: SimulationCaseDefinition = definitionOf(unstableSeed());

    expect(legacy.engineCase.evolution).toBeUndefined();
    expect(current.engineCase.evolution).toBeDefined();
  });
});
