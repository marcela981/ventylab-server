/*
 * Funcionalidad: Pruebas de la retroalimentación determinística de calificación
 * Descripción: Verifica la retroalimentación determinística por pregunta (correcta, parcial, incorrecta, con respuesta esperada, explicación y rúbrica) y global (aprobación frente a la nota mínima)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  buildDeterministicGradeFeedback,
  buildDeterministicQuestionFeedback,
} from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import {
  type GeneratedGradeFeedback,
  type GradeFeedbackContext,
  type GradeFeedbackQuestionContext,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

const QUESTION: GradeFeedbackQuestionContext = {
  questionId: "q1",
  type: "SINGLE_CHOICE",
  promptText: "¿Qué PEEP inicial es adecuada?",
  points: 2,
  earnedPoints: 2,
  studentAnswerText: "5 cmH2O",
  correctAnswerText: "5 cmH2O",
  explanation: "Una PEEP de 5 cmH2O evita el colapso alveolar.",
};

function buildContext(overrides: Partial<GradeFeedbackContext> = {}): GradeFeedbackContext {
  return {
    evaluation: { type: "EXAM", title: "Parcial 1" },
    grade: 3.5,
    passingGrade: 3,
    questions: [QUESTION, { ...QUESTION, questionId: "q2", earnedPoints: 0, studentAnswerText: "15 cmH2O" }],
    ...overrides,
  };
}

describe("buildDeterministicQuestionFeedback", () => {
  it("should praise a correct answer with its points", () => {
    const content: string = buildDeterministicQuestionFeedback(QUESTION);

    expect(content).toContain("Respuesta correcta (2/2 puntos).");
    expect(content).not.toContain("La respuesta esperada es");
  });

  it("should cite the correct answer and the explanation for an incorrect answer", () => {
    const content: string = buildDeterministicQuestionFeedback({ ...QUESTION, earnedPoints: 0 });

    expect(content).toBe(
      "Respuesta incorrecta (0/2 puntos). La respuesta esperada es: 5 cmH2O. Explicación: Una PEEP de 5 cmH2O evita el colapso alveolar.",
    );
  });

  it("should mark a partially correct answer and point to the rubric when there is no correct answer", () => {
    const content: string = buildDeterministicQuestionFeedback({
      ...QUESTION,
      type: "OPEN_TEXT",
      points: 4,
      earnedPoints: 2.5,
      correctAnswerText: undefined,
      explanation: undefined,
      rubricSummary: "Menciona reclutamiento alveolar",
    });

    expect(content).toBe("Respuesta parcialmente correcta (2.5/4 puntos). Revisa los criterios de evaluación: Menciona reclutamiento alveolar.");
  });

  it("should treat a zero-point question as ungraded instead of correct", () => {
    const content: string = buildDeterministicQuestionFeedback({ ...QUESTION, points: 0, earnedPoints: 0 });

    expect(content).toContain("Respuesta incorrecta (0/0 puntos).");
  });
});

describe("buildDeterministicGradeFeedback", () => {
  it("should build feedback for every question and a passing overall message", () => {
    const result: GeneratedGradeFeedback = buildDeterministicGradeFeedback(buildContext());

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.provider).toBeUndefined();
    expect(result.perQuestion.map((item: { questionId: string }) => item.questionId)).toEqual(["q1", "q2"]);
    expect(result.overall).toBe(
      "Obtuviste una nota de 3.5 sobre 5.0 en el examen \"Parcial 1\". Aprobaste: la nota mínima es 3.0. Respondiste correctamente 1 de 2 preguntas.",
    );
  });

  it("should encourage review when the grade is below the passing grade", () => {
    const result: GeneratedGradeFeedback = buildDeterministicGradeFeedback(
      buildContext({ grade: 2.04, evaluation: { type: "WORKSHOP", title: "Taller" } }),
    );

    expect(result.overall).toContain("Obtuviste una nota de 2.0 sobre 5.0 en el taller \"Taller\".");
    expect(result.overall).toContain("Aún no alcanzas la nota mínima de 3.0.");
    expect(result.overall).toContain("Repasa la retroalimentación de cada pregunta");
  });
});
