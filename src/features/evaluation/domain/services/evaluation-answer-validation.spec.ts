/*
 * Funcionalidad: Pruebas de la validación de respuestas de evaluación
 * Descripción: Verifica que la forma de cada respuesta coincide con el tipo de pregunta: una opción en SINGLE_CHOICE y TRUE_FALSE, cero o más en MULTIPLE_CHOICE, texto con límite en OPEN_TEXT, sesión en SIMULATION, opciones que pertenecen a la pregunta y sin campos de otro tipo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { InvalidEvaluationAnswerError } from "@/features/evaluation/domain/evaluation.errors";
import { MAX_OPEN_TEXT_ANSWER_LENGTH, validateEvaluationAnswer } from "@/features/evaluation/domain/services/evaluation-answer-validation";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

function question(type: EvaluationQuestionTypeValue): EvaluationQuestionItem {
  return {
    id: "q1",
    evaluationId: "evaluation-1",
    order: 0,
    type,
    prompt: { type: "doc", content: [] },
    mediaIds: [],
    points: 1,
    options: ["a", "b", "c"].map((id: string, order: number) => ({ id, questionId: "q1", order, content: id, isCorrect: id === "a" })),
  };
}

function reasonOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return error instanceof InvalidEvaluationAnswerError ? error.reason : "other";
  }

  return undefined;
}

describe("validateEvaluationAnswer", () => {
  it("requires exactly one option for SINGLE_CHOICE and TRUE_FALSE", () => {
    expect(validateEvaluationAnswer(question("SINGLE_CHOICE"), { selectedOptionIds: ["a"] })).toEqual({ selectedOptionIds: ["a"] });
    expect(reasonOf(() => validateEvaluationAnswer(question("TRUE_FALSE"), { selectedOptionIds: [] }))).toBe("option_count_invalid");
    expect(reasonOf(() => validateEvaluationAnswer(question("SINGLE_CHOICE"), { selectedOptionIds: ["a", "b"] }))).toBe("option_count_invalid");
  });

  it("accepts zero or more distinct options for MULTIPLE_CHOICE", () => {
    expect(validateEvaluationAnswer(question("MULTIPLE_CHOICE"), {})).toEqual({ selectedOptionIds: [] });
    expect(validateEvaluationAnswer(question("MULTIPLE_CHOICE"), { selectedOptionIds: ["a", "c"] })).toEqual({ selectedOptionIds: ["a", "c"] });
    expect(reasonOf(() => validateEvaluationAnswer(question("MULTIPLE_CHOICE"), { selectedOptionIds: ["a", "a"] }))).toBe("option_duplicated");
  });

  it("rejects options of another question", () => {
    expect(reasonOf(() => validateEvaluationAnswer(question("SINGLE_CHOICE"), { selectedOptionIds: ["z"] }))).toBe("option_not_in_question");
  });

  it("accepts text up to the limit for OPEN_TEXT", () => {
    expect(validateEvaluationAnswer(question("OPEN_TEXT"), { textAnswer: "Increase PEEP" })).toEqual({ selectedOptionIds: [], textAnswer: "Increase PEEP" });
    expect(reasonOf(() => validateEvaluationAnswer(question("OPEN_TEXT"), { textAnswer: "x".repeat(MAX_OPEN_TEXT_ANSWER_LENGTH + 1) }))).toBe("text_too_long");
    expect(reasonOf(() => validateEvaluationAnswer(question("OPEN_TEXT"), {}))).toBe("text_required");
  });

  it("requires a simulation session for SIMULATION", () => {
    expect(validateEvaluationAnswer(question("SIMULATION"), { simulationSessionId: "session-1" })).toEqual({ selectedOptionIds: [], simulationSessionId: "session-1" });
    expect(reasonOf(() => validateEvaluationAnswer(question("SIMULATION"), {}))).toBe("session_required");
  });

  it("rejects fields that do not belong to the question type", () => {
    expect(reasonOf(() => validateEvaluationAnswer(question("SINGLE_CHOICE"), { selectedOptionIds: ["a"], textAnswer: "x" }))).toBe("fields_not_allowed");
    expect(reasonOf(() => validateEvaluationAnswer(question("OPEN_TEXT"), { textAnswer: "x", selectedOptionIds: ["a"] }))).toBe("fields_not_allowed");
    expect(reasonOf(() => validateEvaluationAnswer(question("SIMULATION"), { simulationSessionId: "s", textAnswer: "x" }))).toBe("fields_not_allowed");
  });
});
