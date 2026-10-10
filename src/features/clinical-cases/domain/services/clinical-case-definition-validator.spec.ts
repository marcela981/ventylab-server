/*
 * Funcionalidad: Pruebas del validador de definición de casos clínicos
 * Descripción: Verifica que los casos sembrados para el motor respetan los rangos fisiológicos, que C = 0 y R negativa se rechazan como implausibles (422) y que eventos, objetivos y rúbricas inconsistentes se rechazan como definición inválida (400)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ClinicalCasePhysiologicalRangeError, InvalidClinicalCaseDefinitionError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { ClinicalCase, type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type ClinicalCaseEvent,
  type ClinicalCaseMechanics,
  type ClinicalCaseRubric,
  type ClinicalCaseSimulationProfile,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { assertValidClinicalCaseDefinition } from "@/features/clinical-cases/domain/services/clinical-case-definition-validator";
import {
  ENGINE_READY_CLINICAL_CASES,
  type EngineReadySeedCase,
} from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";

const BASE: ClinicalCaseContent = ENGINE_READY_CLINICAL_CASES[0].content;

function withSimulation(overrides: Partial<ClinicalCaseSimulationProfile>): ClinicalCaseContent {
  return { ...BASE, simulation: { ...BASE.simulation, ...overrides } };
}

function withMechanics(overrides: Partial<ClinicalCaseMechanics>): ClinicalCaseContent {
  const mechanics: ClinicalCaseMechanics | undefined = BASE.simulation.mechanics;

  if (!mechanics) {
    throw new Error("The base seed case must define mechanics");
  }

  return withSimulation({ mechanics: { ...mechanics, ...overrides } });
}

function withRubric(overrides: Partial<ClinicalCaseRubric>): ClinicalCaseContent {
  const rubric: ClinicalCaseRubric | undefined = BASE.simulation.defaultRubric;

  if (!rubric) {
    throw new Error("The base seed case must define a rubric");
  }

  return withSimulation({ defaultRubric: { ...rubric, ...overrides } });
}

function captureError(content: ClinicalCaseContent): unknown {
  try {
    assertValidClinicalCaseDefinition(content);
  } catch (error) {
    return error;
  }

  return undefined;
}

describe("assertValidClinicalCaseDefinition", () => {
  it.each(ENGINE_READY_CLINICAL_CASES.map((seedCase: EngineReadySeedCase): [string, EngineReadySeedCase] => [seedCase.id, seedCase]))(
    "accepts the seeded engine-ready case %s and marks it simulation ready",
    (_id: string, seedCase: EngineReadySeedCase) => {
      const clinicalCase: ClinicalCase = ClinicalCase.create({ content: seedCase.content, createdById: "teacher-1" });

      expect(clinicalCase.isSimulationReady).toBe(true);
    },
  );

  it("rejects a compliance of 0 as a physiological range violation", () => {
    const content: ClinicalCaseContent = withMechanics({ complianceMlPerCmH2O: 0 });

    const error: unknown = captureError(content);

    expect(error).toBeInstanceOf(ClinicalCasePhysiologicalRangeError);
    expect((error as ClinicalCasePhysiologicalRangeError).field).toBe("mechanics.complianceMlPerCmH2O");
  });

  it("rejects a negative resistance as a physiological range violation", () => {
    const content: ClinicalCaseContent = withMechanics({ resistanceCmH2OPerLps: -5 });

    const error: unknown = captureError(content);

    expect(error).toBeInstanceOf(ClinicalCasePhysiologicalRangeError);
    expect((error as ClinicalCasePhysiologicalRangeError).i18nArgs).toEqual(
      expect.objectContaining({ field: "mechanics.resistanceCmH2OPerLps", value: -5 }),
    );
  });

  it("rejects a recruitment curve whose PEEP does not increase", () => {
    const content: ClinicalCaseContent = withMechanics({
      recruitmentCurve: [
        { peepCmH2O: 10, shuntFraction: 0.2 },
        { peepCmH2O: 5, shuntFraction: 0.3 },
      ],
    });

    const error: unknown = captureError(content);

    expect(error).toBeInstanceOf(InvalidClinicalCaseDefinitionError);
  });

  it("rejects an event with a negative time", () => {
    const events: ClinicalCaseEvent[] = [{ simTimeMs: -1, type: "BRONCHOSPASM", resistanceFactor: 2 }];

    const error: unknown = captureError(withSimulation({ events }));

    expect(error).toBeInstanceOf(InvalidClinicalCaseDefinitionError);
  });

  it("rejects an event carrying a parameter its type does not use", () => {
    const events: ClinicalCaseEvent[] = [{ simTimeMs: 1000, type: "BRONCHOSPASM", complianceFactor: 0.5 }];

    const error: unknown = captureError(withSimulation({ events }));

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("events[0].complianceFactor");
  });

  it("rejects an event factor outside its range as a physiological range violation", () => {
    const events: ClinicalCaseEvent[] = [{ simTimeMs: 1000, type: "BRONCHOSPASM", resistanceFactor: 20 }];

    const error: unknown = captureError(withSimulation({ events }));

    expect(error).toBeInstanceOf(ClinicalCasePhysiologicalRangeError);
  });

  it("rejects a target whose minimum exceeds its maximum", () => {
    const content: ClinicalCaseContent = withSimulation({ targets: { spo2Percent: { min: 96, max: 90 } } });

    const error: unknown = captureError(content);

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("targets.spo2Percent");
  });

  it("rejects a rubric whose weights do not add up to 100", () => {
    const content: ClinicalCaseContent = withRubric({ criteria: [{ type: "TARGETS_REACHED", weight: 60, threshold: 1 }] });

    const error: unknown = captureError(content);

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("defaultRubric.criteria.weight");
  });

  it("rejects a rubric with an unknown assistance policy", () => {
    const content: ClinicalCaseContent = withRubric({ assistancePolicy: "ALWAYS" as ClinicalCaseRubric["assistancePolicy"] });

    const error: unknown = captureError(content);

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("defaultRubric.assistancePolicy");
  });

  it("rejects a time-in-range criterion without an evaluation window", () => {
    const content: ClinicalCaseContent = withRubric({ criteria: [{ type: "TIME_IN_RANGE", weight: 100, threshold: 80 }] });

    const error: unknown = captureError(content);

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("defaultRubric.criteria[0].windowMinutes");
  });

  it("rejects an inspiratory time that leaves no time to exhale", () => {
    const content: ClinicalCaseContent = withSimulation({ initialVentilatorSettings: { mode: "VCV", respiratoryRateBpm: 30, inspiratoryTimeS: 2 } });

    const error: unknown = captureError(content);

    expect((error as InvalidClinicalCaseDefinitionError).field).toBe("initialVentilatorSettings.inspiratoryTimeS");
  });
});
