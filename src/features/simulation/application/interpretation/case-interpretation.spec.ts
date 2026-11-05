/*
 * Funcionalidad: Pruebas de la interpretación del caso por IA
 * Descripción: Verifica las bandas permitidas (±30 % del valor curado dentro del rango fisiológico y escala del shunt 0,7-1,3), el análisis estricto de la respuesta (JSON inválido, valores fuera de banda o no numéricos rechazados, trayectoria y justificación opcionales) y la aplicación determinista sobre el caso del motor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  applyInterpretation,
  curatedValues,
  type InterpretationValues,
  parameterBands,
  parseInterpretation,
  type ParsedInterpretation,
} from "@/features/simulation/application/interpretation/case-interpretation";
import { type EngineCase, type ShuntCurvePoint } from "@/features/simulation/domain/engine";
import { buildTestCase } from "@/features/simulation/domain/engine/engine-test-cases-spec";

const ENGINE_CASE: EngineCase = buildTestCase({
  mechanics: { complianceMlPerCmH2O: 40, resistanceCmH2OPerLps: 10 },
  gasExchange: { shuntCurve: [{ peepCmH2O: 5, shuntFraction: 0.3 }, { peepCmH2O: 10, shuntFraction: 0.8 }] },
});
const CURATED: InterpretationValues = curatedValues(ENGINE_CASE);

describe("case interpretation rules", () => {
  it("bounds each parameter to ±30 % of the curated value inside the physiological range", () => {
    const bands: ReturnType<typeof parameterBands> = parameterBands(CURATED);

    expect(bands.complianceMlPerCmH2O).toEqual({ curated: 40, min: 28, max: 52 });
    expect(bands.shuntScale).toEqual({ curated: 1, min: 0.7, max: 1.3 });
    expect(bands.baselineHeartRateBpm.min).toBeGreaterThanOrEqual(40);
  });

  it("returns undefined for an answer that is not a JSON object", () => {
    expect(parseInterpretation("sin json", CURATED)).toBeUndefined();
    expect(parseInterpretation("{roto", CURATED)).toBeUndefined();
    expect(parseInterpretation("[1, 2]", CURATED)).toBeUndefined();
  });

  it("accepts in-band values and keeps the curated ones for out-of-band or invalid values", () => {
    const parsed: ParsedInterpretation | undefined = parseInterpretation(
      "Respuesta: " +
        JSON.stringify({
          complianceMlPerCmH2O: 30,
          resistanceCmH2OPerLps: 50,
          deadSpaceMl: "mucho",
          shuntScale: 1.2,
          trajectory: "WORSENING",
          rationale: "  Historia de SDRA.  ",
        }),
      CURATED,
    );

    expect(parsed?.applied.complianceMlPerCmH2O).toBe(30);
    expect(parsed?.applied.resistanceCmH2OPerLps).toBe(10);
    expect(parsed?.applied.deadSpaceMl).toBe(CURATED.deadSpaceMl);
    expect(parsed?.rejected).toEqual(["resistanceCmH2OPerLps", "deadSpaceMl"]);
    expect(parsed?.trajectory).toBe("WORSENING");
    expect(parsed?.rationale).toBe("Historia de SDRA.");
  });

  it("applies the accepted values deterministically and caps the scaled shunt", () => {
    const applied: EngineCase = applyInterpretation(ENGINE_CASE, { ...CURATED, complianceMlPerCmH2O: 30, shuntScale: 1.3 });

    expect(applied.mechanics.complianceMlPerCmH2O).toBe(30);
    expect(applied.gasExchange.shuntCurve.map((point: ShuntCurvePoint): number => point.shuntFraction)).toEqual([0.39, 0.9]);
    expect(applyInterpretation(ENGINE_CASE, CURATED)).toEqual(ENGINE_CASE);
  });
});
