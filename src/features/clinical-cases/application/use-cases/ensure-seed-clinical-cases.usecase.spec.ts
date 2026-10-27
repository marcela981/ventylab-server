/*
 * Funcionalidad: Pruebas de EnsureSeedClinicalCasesUseCase y de los casos de siembra
 * Descripción: Verifica que los casos que faltan se inserten PUBLISHED y sin validar, que una segunda ejecución no cambie nada, que un caso existente (aunque haya sido editado) no se toque y que un caso inválido se rechace; y que los casos de julio conserven sus valores de julio, pasen el validador, el motor los acepte y cubran, con los casos del motor, todos los casos base del paciente propio
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildCase, buildDoubles, type ClinicalCasesDoubles, validContent } from "@/features/clinical-cases/application/testing/clinical-cases-test-doubles-spec";
import { EnsureSeedClinicalCasesUseCase, type SeedClinicalCasesOutcome } from "@/features/clinical-cases/application/use-cases/ensure-seed-clinical-cases.usecase";
import { ClinicalCasePhysiologicalRangeError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseSnapshot } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { BOOTSTRAP_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/bootstrap/clinical-cases-bootstrap.service";
import { type EngineReadySeedCase } from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";
import { JULY_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/persistence/seed/july-clinical-cases.data";
import { SimulationCaseMapper, type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { createSimulation } from "@/features/simulation/domain/engine";
import { BASE_CASE_BY_CONDITION } from "@/features/simulation/domain/patient/patient-overrides";

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

function julyCase(id: string): EngineReadySeedCase {
  const found: EngineReadySeedCase | undefined = JULY_CLINICAL_CASES.find((seed: EngineReadySeedCase): boolean => seed.id === id);

  if (!found) {
    throw new Error(`Missing July case ${id}`);
  }

  return found;
}

describe("EnsureSeedClinicalCasesUseCase", () => {
  it("inserts the missing cases as published and not validated by an expert", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const useCase: EnsureSeedClinicalCasesUseCase = new EnsureSeedClinicalCasesUseCase(doubles.repository);

    const outcome: SeedClinicalCasesOutcome = await useCase.execute(JULY_CLINICAL_CASES);
    const inserted: ClinicalCase[] = doubles.insertCaseIfMissing.mock.calls.map((call: unknown[]): ClinicalCase => call[0] as ClinicalCase);

    expect(outcome).toEqual({ inserted: ["july-neumonia-grave", "july-epoc-descompensado", "july-sdra-sepsis"], existing: [] });
    expect(inserted.map((clinicalCase: ClinicalCase): [string, boolean] => [clinicalCase.status, clinicalCase.validatedByExpert])).toEqual([
      ["PUBLISHED", false],
      ["PUBLISHED", false],
      ["PUBLISHED", false],
    ]);
  });

  it("changes nothing when it runs twice", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const useCase: EnsureSeedClinicalCasesUseCase = new EnsureSeedClinicalCasesUseCase(doubles.repository);

    await useCase.execute(BOOTSTRAP_CLINICAL_CASES);
    const second: SeedClinicalCasesOutcome = await useCase.execute(BOOTSTRAP_CLINICAL_CASES);

    expect(second.inserted).toEqual([]);
    expect(second.existing).toHaveLength(BOOTSTRAP_CLINICAL_CASES.length);
    expect(doubles.saveCase).not.toHaveBeenCalled();
  });

  it("never touches an existing case, even one a teacher edited", async () => {
    const edited: ClinicalCase = buildCase({ id: "july-sdra-sepsis", status: "ARCHIVED", content: validContent({ title: "Edited by a teacher" }) });
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [edited] });

    const outcome: SeedClinicalCasesOutcome = await new EnsureSeedClinicalCasesUseCase(doubles.repository).execute(JULY_CLINICAL_CASES);

    expect(outcome.existing).toEqual(["july-sdra-sepsis"]);
    expect(await doubles.repository.getCaseById("july-sdra-sepsis")).toBe(edited);
    expect([edited.content.title, edited.status]).toEqual(["Edited by a teacher", "ARCHIVED"]);
  });

  it("rejects a seed case outside the physiological ranges", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const invalid: EngineReadySeedCase = { id: "broken", content: validContent({ patientAge: 130 }) };

    await expect(new EnsureSeedClinicalCasesUseCase(doubles.repository).execute([invalid])).rejects.toBeInstanceOf(ClinicalCasePhysiologicalRangeError);
    expect(doubles.insertCaseIfMissing).not.toHaveBeenCalled();
  });
});

describe("July seed clinical cases", () => {
  it.each(JULY_CLINICAL_CASES.map((seed: EngineReadySeedCase): [string, EngineReadySeedCase] => [seed.id, seed]))(
    "%s is a valid case the engine can simulate",
    (_id: string, seed: EngineReadySeedCase) => {
      const definition: SimulationCaseDefinition | undefined = SimulationCaseMapper.toDefinition(snapshotOf(seed));

      expect(definition).toBeDefined();
      expect(() => createSimulation((definition as SimulationCaseDefinition).engineCase, 1)).not.toThrow();
    },
  );

  it("keeps the July values as they were, including the COPD Vt of 480 mL and FiO2 as a fraction", () => {
    const pneumonia: EngineReadySeedCase = julyCase("july-neumonia-grave");
    const copd: EngineReadySeedCase = julyCase("july-epoc-descompensado");
    const ards: EngineReadySeedCase = julyCase("july-sdra-sepsis");

    expect([pneumonia.content.patientAge, pneumonia.content.simulation.patientSex, pneumonia.content.patientWeight, pneumonia.content.simulation.patientHeightCm]).toEqual([60, "MALE", 70, 175]);
    expect(pneumonia.content.simulation.initialVentilatorSettings).toMatchObject({ mode: "VCV", tidalVolumeMl: 420, respiratoryRateBpm: 20, fio2: 1, peepCmH2O: 8 });
    expect(copd.content.simulation.initialVentilatorSettings).toMatchObject({ tidalVolumeMl: 480, respiratoryRateBpm: 12, fio2: 0.35, peepCmH2O: 5, inspiratoryTimeS: 1 });
    expect(copd.content.simulation.initialState).toEqual({ paco2MmHg: 75, pao2MmHg: 58 });
    expect(ards.content.simulation.initialVentilatorSettings).toMatchObject({ tidalVolumeMl: 420, respiratoryRateBpm: 22, fio2: 0.9, peepCmH2O: 11 });
    expect(ards.content.initialVitals).toEqual({ heartRateBpm: 128, respiratoryRateBpm: 32, spo2Percent: 89, temperatureC: 38.8, systolicMmHg: 85, diastolicMmHg: 45, glasgow: 12 });
    expect(JULY_CLINICAL_CASES.map((seed: EngineReadySeedCase): string => `${seed.content.difficulty}/${seed.content.pathology}`)).toEqual([
      "INTERMEDIATE/NEUMONIA",
      "INTERMEDIATE/EPOC",
      "ADVANCED/SDRA",
    ]);
  });

  it("covers every base case of the own patient", () => {
    const seededIds: string[] = BOOTSTRAP_CLINICAL_CASES.map((seed: { id: string }): string => seed.id);

    expect(seededIds).toEqual(expect.arrayContaining([...new Set(Object.values(BASE_CASE_BY_CONDITION))]));
  });
});
