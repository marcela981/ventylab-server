/*
 * Funcionalidad: Pruebas de la rúbrica de simulación
 * Descripción: Verifica la validación de la rúbrica de simulación: criterios válidos, parámetros desconocidos, duplicados, tipos de valor esperado, rangos y prioridades
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type SimulationRubric,
  type SimulationRubricValidation,
  validateSimulationRubric,
} from "@/features/evaluation/domain/value-objects/simulation-rubric";

const VALID_RUBRIC: SimulationRubric = {
  criteria: [
    { parameter: "ventilationMode", expectedValue: "VCV", priority: "CRITICO" },
    { parameter: "tidalVolume", expectedValue: 420, min: 380, max: 460, priority: "CRITICO" },
    { parameter: "peep", expectedValue: 8, priority: "IMPORTANTE" },
    { parameter: "iERatio", expectedValue: "1:2" },
  ],
  justification: "Protective ventilation",
};

describe("validateSimulationRubric", () => {
  it("should accept a valid rubric and default missing priorities", () => {
    const result: SimulationRubricValidation = validateSimulationRubric(VALID_RUBRIC);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.rubric?.criteria[3].priority).toBe("OPCIONAL");
    expect(result.rubric?.justification).toBe("Protective ventilation");
  });

  it("should reject a value that is not an object or has no criteria", () => {
    expect(validateSimulationRubric(null).valid).toBe(false);
    expect(validateSimulationRubric("rubric").valid).toBe(false);
    expect(validateSimulationRubric({ criteria: [] }).errors).toContain("criteria must be a non-empty array");
  });

  it("should report unknown parameters, duplicates and wrong value types", () => {
    const result: SimulationRubricValidation = validateSimulationRubric({
      criteria: [
        { parameter: "heartRate", expectedValue: 80 },
        { parameter: "peep", expectedValue: 5 },
        { parameter: "peep", expectedValue: 6 },
        { parameter: "ventilationMode", expectedValue: 3 },
        { parameter: "fio2", expectedValue: "40" },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.rubric).toBeUndefined();
    expect(result.errors).toEqual([
      "criteria[0].parameter is not supported",
      "criteria[2].parameter is duplicated",
      "criteria[3].expectedValue must be a non-empty string",
      "criteria[4].expectedValue must be a finite number",
    ]);
  });

  it("should report invalid ranges and priorities", () => {
    const result: SimulationRubricValidation = validateSimulationRubric({
      criteria: [
        { parameter: "tidalVolume", expectedValue: 400, min: 450, max: 350 },
        { parameter: "peep", expectedValue: 5, min: 4 },
        { parameter: "respiratoryRate", expectedValue: 30, min: 12, max: 20 },
        { parameter: "fio2", expectedValue: 40, priority: "HIGH" },
        { parameter: "ventilationMode", expectedValue: "PCV", min: 1, max: 2 },
      ],
    });

    expect(result.errors).toEqual([
      "criteria[0].min must not be greater than max",
      "criteria[1] must define both min and max or neither",
      "criteria[2].expectedValue must be within min and max",
      "criteria[3].priority must be one of CRITICO, IMPORTANTE, OPCIONAL",
      "criteria[4] ranges are only allowed for numeric parameters",
    ]);
  });
});
