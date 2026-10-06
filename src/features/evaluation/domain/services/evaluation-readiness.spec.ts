/*
 * Funcionalidad: Pruebas de la validación de preparación de evaluaciones
 * Descripción: Verifica las reglas puras para pasar una evaluación a READY: al menos una pregunta, puntos positivos, opciones correctas según el tipo de pregunta, verdadero/falso con dos opciones y rúbrica válida en preguntas de simulación, devolviendo todos los problemas a la vez
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationReadinessIssue,
  type ReadinessQuestion,
  validateEvaluationReadiness,
} from "@/features/evaluation/domain/services/evaluation-readiness";

const VALID_RUBRIC: Record<string, unknown> = { criteria: [{ parameter: "peep", expectedValue: 5, min: 4, max: 6 }] };

function question(overrides: Partial<ReadinessQuestion> & Pick<ReadinessQuestion, "type">): ReadinessQuestion {
  return { id: "q1", points: 1, options: [], ...overrides };
}

function codes(issues: EvaluationReadinessIssue[]): string[] {
  return issues.map((issue: EvaluationReadinessIssue) => issue.code);
}

describe("validateEvaluationReadiness", () => {
  it("requires at least one question", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([]);

    expect(codes(issues)).toEqual(["no_questions"]);
  });

  it("accepts a valid single choice question with exactly one correct option", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ type: "SINGLE_CHOICE", options: [{ isCorrect: true }, { isCorrect: false }] }),
    ]);

    expect(issues).toEqual([]);
  });

  it("rejects a single choice question without a correct option or with two", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ id: "q1", type: "SINGLE_CHOICE", options: [{ isCorrect: false }, { isCorrect: false }] }),
      question({ id: "q2", type: "SINGLE_CHOICE", options: [{ isCorrect: true }, { isCorrect: true }] }),
    ]);

    expect(issues).toEqual([
      { code: "correct_option_required", questionId: "q1" },
      { code: "single_correct_option_required", questionId: "q2" },
    ]);
  });

  it("requires at least one correct option in a multiple choice question and allows several", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ id: "q1", type: "MULTIPLE_CHOICE", options: [{ isCorrect: false }] }),
      question({ id: "q2", type: "MULTIPLE_CHOICE", options: [{ isCorrect: true }, { isCorrect: true }, { isCorrect: false }] }),
    ]);

    expect(issues).toEqual([{ code: "correct_option_required", questionId: "q1" }]);
  });

  it("requires exactly two options and one correct answer in a true/false question", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ id: "q1", type: "TRUE_FALSE", options: [{ isCorrect: true }, { isCorrect: false }, { isCorrect: false }] }),
      question({ id: "q2", type: "TRUE_FALSE", options: [{ isCorrect: true }, { isCorrect: true }] }),
      question({ id: "q3", type: "TRUE_FALSE", options: [{ isCorrect: false }, { isCorrect: true }] }),
    ]);

    expect(issues).toEqual([
      { code: "true_false_two_options_required", questionId: "q1" },
      { code: "single_correct_option_required", questionId: "q2" },
    ]);
  });

  it("does not require options in an open text question", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([question({ type: "OPEN_TEXT" })]);

    expect(issues).toEqual([]);
  });

  it("requires a valid rubric in a simulation question and reports the rubric errors", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ id: "q1", type: "SIMULATION", rubric: VALID_RUBRIC }),
      question({ id: "q2", type: "SIMULATION" }),
      question({ id: "q3", type: "SIMULATION", rubric: { criteria: [] } }),
    ]);

    expect(codes(issues)).toEqual(["invalid_rubric", "invalid_rubric"]);
    expect(issues[0].questionId).toBe("q2");
    expect(issues[1].details).toEqual(["criteria must be a non-empty array"]);
  });

  it("requires positive points and returns every issue of every question", () => {
    const issues: EvaluationReadinessIssue[] = validateEvaluationReadiness([
      question({ id: "q1", type: "OPEN_TEXT", points: 0 }),
      question({ id: "q2", type: "SINGLE_CHOICE", points: -1, options: [] }),
    ]);

    expect(issues).toEqual([
      { code: "points_not_positive", questionId: "q1" },
      { code: "points_not_positive", questionId: "q2" },
      { code: "correct_option_required", questionId: "q2" },
    ]);
  });
});
