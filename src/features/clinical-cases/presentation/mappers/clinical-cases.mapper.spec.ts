/*
 * Funcionalidad: Pruebas del mapper de presentación de casos clínicos
 * Descripción: Verifica que la respuesta de evaluación no revele la configuración experta, los valores expertos ni las diferencias a quien no puede verlos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ClinicalCaseEvaluationResult } from "@/features/clinical-cases/application/results/clinical-case.results";
import { ClinicalCaseEvaluationDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-evaluation.dto";
import { ClinicalCasesMapper } from "@/features/clinical-cases/presentation/mappers/clinical-cases.mapper";

const EXPERT_PEEP: number = 13;
const EXPERT_TIDAL_VOLUME: number = 437;

function buildResult(): ClinicalCaseEvaluationResult {
  return new ClinicalCaseEvaluationResult({
    attemptId: "attempt-1",
    score: 62.5,
    isSuccessful: false,
    completionTime: 4,
    comparison: {
      score: 62.5,
      totalParameters: 2,
      correctParameters: 0,
      parameters: [
        {
          parameter: "peep",
          userValue: 8,
          expertValue: EXPERT_PEEP,
          difference: -5,
          differencePercent: -38.46,
          withinRange: false,
          errorClassification: "moderado",
          priority: "IMPORTANTE",
        },
        {
          parameter: "tidalVolume",
          userValue: 500,
          expertValue: EXPERT_TIDAL_VOLUME,
          difference: 63,
          differencePercent: 14.42,
          withinRange: false,
          errorClassification: "menor",
          priority: "CRITICO",
        },
      ],
      criticalErrors: [],
      summary: { correct: 0, minor: 1, moderate: 1, critical: 0 },
    },
    feedback: { feedback: "Revisa las recomendaciones", strengths: [], improvements: [], recommendations: [] },
    expertConfiguration: {
      id: "expert-1",
      ventilationMode: "pressure",
      tidalVolume: EXPERT_TIDAL_VOLUME,
      peep: EXPERT_PEEP,
      justification: "Ventilación protectora",
    },
  });
}

describe("ClinicalCasesMapper.toEvaluationDTO", () => {
  it("hides the expert configuration, expert values and differences from a caller without clinical-cases:view_expert", () => {
    const result: ClinicalCaseEvaluationResult = buildResult();

    const dto: ClinicalCaseEvaluationDTO = ClinicalCasesMapper.toEvaluationDTO(result, false);
    const json: string = JSON.stringify(dto);

    expect(dto.expertConfiguration).toBeNull();
    expect(dto.comparison.parameters.every((p: { expertValue: unknown; difference: unknown; differencePercent: unknown }) => p.expertValue === null && p.difference === null && p.differencePercent === null)).toBe(true);
    expect(json).not.toContain(String(EXPERT_PEEP));
    expect(json).not.toContain(String(EXPERT_TIDAL_VOLUME));
    expect(json).not.toContain("Ventilación protectora");
    expect(dto.comparison.parameters[0]?.userValue).toBe(8);
    expect(dto.comparison.parameters[0]?.errorClassification).toBe("moderado");
  });

  it("returns the expert configuration and differences to a caller with clinical-cases:view_expert", () => {
    const result: ClinicalCaseEvaluationResult = buildResult();

    const dto: ClinicalCaseEvaluationDTO = ClinicalCasesMapper.toEvaluationDTO(result, true);

    expect(dto.expertConfiguration?.peep).toBe(EXPERT_PEEP);
    expect(dto.comparison.parameters[0]?.expertValue).toBe(EXPERT_PEEP);
    expect(dto.comparison.parameters[0]?.difference).toBe(-5);
  });
});
