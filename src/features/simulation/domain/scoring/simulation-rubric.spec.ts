/*
 * Funcionalidad: Pruebas del validador de rúbricas de simulación
 * Descripción: Verifica que la rúbrica por defecto es válida y que el validador rechaza con errores tipados criterios desconocidos o duplicados, pesos no positivos, listas vacías, umbrales y parámetros inválidos y políticas de asistencia desconocidas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DEFAULT_SIMULATION_RUBRIC, SimulationRubricValidationResult, validateSimulationRubric } from "./simulation-rubric";
import { SimulationRubricIssue, SimulationRubricIssueCode } from "./simulation-scoring.errors";

function issueCodes(result: SimulationRubricValidationResult): SimulationRubricIssueCode[] {
  if (result.valid) {
    return [];
  }

  return result.issues.map((issue: SimulationRubricIssue): SimulationRubricIssueCode => issue.code);
}

describe("validateSimulationRubric", () => {
  it("accepts the default rubric and defaults the assistance policy to DISABLED", () => {
    const input: unknown = { criteria: [{ type: "TARGETS_REACHED", weight: 1 }] };

    const defaultResult: SimulationRubricValidationResult = validateSimulationRubric(DEFAULT_SIMULATION_RUBRIC);
    const minimalResult: SimulationRubricValidationResult = validateSimulationRubric(input);

    expect(defaultResult.valid).toBe(true);
    expect(minimalResult.valid && minimalResult.rubric.assistancePolicy).toBe("DISABLED");
  });

  it.each<[string, unknown, SimulationRubricIssueCode]>([
    ["a non-object rubric", "rubric", "INVALID_SHAPE"],
    ["missing criteria", {}, "INVALID_SHAPE"],
    ["an unknown criterion", { criteria: [{ type: "HEART_RATE", weight: 1 }] }, "UNKNOWN_CRITERION"],
    ["a zero weight", { criteria: [{ type: "TARGETS_REACHED", weight: 0 }] }, "NON_POSITIVE_WEIGHT"],
    ["a negative weight", { criteria: [{ type: "TARGETS_REACHED", weight: -1 }] }, "NON_POSITIVE_WEIGHT"],
    ["an empty criteria list", { criteria: [] }, "ZERO_TOTAL_WEIGHT"],
    ["a fraction threshold above 1", { criteria: [{ type: "TARGETS_REACHED", weight: 1, threshold: 1.5 }] }, "INVALID_THRESHOLD"],
    ["a percentage threshold above 100", { criteria: [{ type: "TIME_IN_RANGE", weight: 1, threshold: 120 }] }, "INVALID_THRESHOLD"],
    ["a non-positive stabilization limit", { criteria: [{ type: "TIME_TO_STABILIZE", weight: 1, threshold: 0 }] }, "INVALID_THRESHOLD"],
    ["a fractional free-use count", { criteria: [{ type: "AI_ASSIST_USAGE", weight: 1, threshold: 1.5 }] }, "INVALID_THRESHOLD"],
    [
      "a negative safety limit",
      { criteria: [{ type: "SAFETY_VIOLATIONS", weight: 1, params: { limits: { plateauPressureMaxCmH2O: -30 } } }] },
      "INVALID_PARAM",
    ],
    ["an unknown assistance policy", { criteria: [{ type: "TARGETS_REACHED", weight: 1 }], assistancePolicy: "ALWAYS" }, "INVALID_ASSISTANCE_POLICY"],
    [
      "a duplicated criterion",
      { criteria: [{ type: "TARGETS_REACHED", weight: 1 }, { type: "TARGETS_REACHED", weight: 2 }] },
      "DUPLICATE_CRITERION",
    ],
  ])("rejects %s", (_label: string, input: unknown, expectedCode: SimulationRubricIssueCode) => {
    const result: SimulationRubricValidationResult = validateSimulationRubric(input);

    expect(result.valid).toBe(false);
    expect(issueCodes(result)).toContain(expectedCode);
  });
});
