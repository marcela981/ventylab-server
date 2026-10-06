/*
 * Funcionalidad: Pruebas del proveedor de puntaje práctico por comparación clínica
 * Descripción: Verifica que el proveedor tome el último comando del registro de parámetros de la sesión, lo compare con la rúbrica y devuelva el puntaje como fracción, o que informe no disponible ante sesión inexistente, registro vacío, comando inválido o rúbrica inválida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  EMPTY_PARAMETERS_LOG_REASON,
  INVALID_LAST_COMMAND_REASON,
  INVALID_RUBRIC_REASON,
  type PracticalScoreResult,
  SESSION_NOT_FOUND_REASON,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { type SimulationRubric } from "@/features/evaluation/domain/value-objects/simulation-rubric";
import { type ISimulatorSessionReader } from "@/features/evaluation/infrastructure/persistence/prisma/simulator-session-reader";
import { ClinicalComparisonPracticalScoreProvider } from "@/features/evaluation/infrastructure/simulation/clinical-comparison-practical-score-provider";

const RUBRIC: SimulationRubric = {
  criteria: [
    { parameter: "ventilationMode", expectedValue: "VCV", priority: "CRITICO" },
    { parameter: "tidalVolume", expectedValue: 420, min: 380, max: 460, priority: "CRITICO" },
    { parameter: "fio2", expectedValue: 40, priority: "IMPORTANTE" },
  ],
};

const FIRST_COMMAND: Record<string, unknown> = { mode: "PCV", tidalVolume: 600, respiratoryRate: 20, peep: 5, fio2: 1 };
const LAST_COMMAND: Record<string, unknown> = { mode: "VCV", tidalVolume: 420, respiratoryRate: 16, peep: 12, fio2: 0.4 };

function buildReader(parametersLog: unknown[] | undefined): jest.Mocked<ISimulatorSessionReader> {
  return { getParametersLog: jest.fn().mockResolvedValue(parametersLog) };
}

function breakdownParameters(result: PracticalScoreResult): string[] {
  if (!result.available) {
    return [];
  }

  return result.breakdown.map((item: unknown) => (item as { parameter: string }).parameter).sort();
}

describe("ClinicalComparisonPracticalScoreProvider", () => {
  it("should score the last command against the rubric and ignore parameters the rubric does not grade", async () => {
    const reader: jest.Mocked<ISimulatorSessionReader> = buildReader([FIRST_COMMAND, LAST_COMMAND]);
    const provider: ClinicalComparisonPracticalScoreProvider = new ClinicalComparisonPracticalScoreProvider(reader);

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", RUBRIC);

    expect(reader.getParametersLog).toHaveBeenCalledWith("session-1");
    expect(result).toEqual({ available: true, score: 1, breakdown: expect.any(Array) });
    expect(breakdownParameters(result)).toEqual(["fio2", "tidalVolume", "ventilationMode"]);
  });

  it("should return a partial fraction when the configuration deviates", async () => {
    const provider: ClinicalComparisonPracticalScoreProvider = new ClinicalComparisonPracticalScoreProvider(buildReader([FIRST_COMMAND]));

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", RUBRIC);

    expect(result.available).toBe(true);
    expect(result.available ? result.score : -1).toBeGreaterThanOrEqual(0);
    expect(result.available ? result.score : 1).toBeLessThan(1);
  });

  it.each([
    [undefined, SESSION_NOT_FOUND_REASON],
    [[], EMPTY_PARAMETERS_LOG_REASON],
    [[FIRST_COMMAND, "garbage"], INVALID_LAST_COMMAND_REASON],
    [[{ mode: "VCV", tidalVolume: "420" }], INVALID_LAST_COMMAND_REASON],
    [[{ tidalVolume: 420, fio2: 0.4 }], INVALID_LAST_COMMAND_REASON],
  ])("should report not available for log %p", async (parametersLog: unknown[] | undefined, reason: string) => {
    const provider: ClinicalComparisonPracticalScoreProvider = new ClinicalComparisonPracticalScoreProvider(buildReader(parametersLog));

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", RUBRIC);

    expect(result).toEqual({ available: false, reason });
  });

  it("should report not available without reading the session when the rubric is invalid", async () => {
    const reader: jest.Mocked<ISimulatorSessionReader> = buildReader([LAST_COMMAND]);
    const provider: ClinicalComparisonPracticalScoreProvider = new ClinicalComparisonPracticalScoreProvider(reader);

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", { criteria: [] });

    expect(result).toEqual({ available: false, reason: INVALID_RUBRIC_REASON });
    expect(reader.getParametersLog).not.toHaveBeenCalled();
  });
});
