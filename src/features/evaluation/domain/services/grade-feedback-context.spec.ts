/*
 * Funcionalidad: Pruebas del constructor del contexto de retroalimentación
 * Descripción: Verifica que el contexto anonimizado de un intento calificado resuelva enunciados, respuestas del estudiante, respuestas correctas, rúbricas, explicación, puntos obtenidos (manual sobre automático) y nota, sin identificadores ni datos personales del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { attemptQuestion, buildAttemptEvaluation, STUDENT_ID } from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { gradedAttempt } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { buildGradeFeedbackContext, NO_ANSWER_TEXT } from "@/features/evaluation/domain/services/grade-feedback-context";
import { type GradeFeedbackContext, type GradeFeedbackQuestionContext } from "@/features/evaluation/domain/value-objects/grade-feedback";

function collectKeys(value: unknown, keys: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item: unknown) => collectKeys(item, keys));
  } else if (typeof value === "object" && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key.toLowerCase());
      collectKeys(nested, keys);
    }
  }

  return keys;
}

describe("buildGradeFeedbackContext", () => {
  it("contains no user id, email or name of the student", () => {
    const attempt: StudentEvaluationAttempt = gradedAttempt();

    const context: GradeFeedbackContext = buildGradeFeedbackContext({ evaluation: buildAttemptEvaluation(), attempt, passingGrade: 3 });

    const keys: Set<string> = collectKeys(context);
    const serialized: string = JSON.stringify(context);

    expect([...keys].filter((key: string) => ["userid", "user", "email", "name", "firstname", "lastname", "studentid", "attemptid"].includes(key))).toEqual([]);
    expect(serialized).not.toContain(STUDENT_ID);
    expect(serialized).not.toContain(attempt.id);
  });

  it("resolves prompts, chosen and correct option texts, explanation, points and grade", () => {
    const context: GradeFeedbackContext = buildGradeFeedbackContext({ evaluation: buildAttemptEvaluation(), attempt: gradedAttempt(), passingGrade: 3 });

    expect(context).toEqual({
      evaluation: { type: "QUIZ", title: "Ventilation basics" },
      grade: 2.5,
      passingGrade: 3,
      questions: [
        {
          questionId: "q1",
          type: "SINGLE_CHOICE",
          promptText: "Pick the right setting",
          points: 1,
          earnedPoints: 1,
          studentAnswerText: "Right",
          correctAnswerText: "Right",
          rubricSummary: undefined,
          explanation: "Because the guideline says so",
        },
        {
          questionId: "q2",
          type: "SINGLE_CHOICE",
          promptText: "Pick the right setting",
          points: 1,
          earnedPoints: 0,
          studentAnswerText: "Wrong",
          correctAnswerText: "Right",
          rubricSummary: undefined,
          explanation: "Because the guideline says so",
        },
      ],
    });
  });

  it("uses the manual score over the automatic one and marks unanswered questions", () => {
    const questions: EvaluationQuestionItem[] = [attemptQuestion("q1", "OPEN_TEXT", 4), attemptQuestion("q2", "SIMULATION", 2), attemptQuestion("q3")];
    const attempt: StudentEvaluationAttempt = gradedAttempt({
      answers: [
        { id: "a1", questionId: "q1", selectedOptionIds: [], textAnswer: "Subir la PEEP", autoScore: 0, manualScore: 3 },
        { id: "a2", questionId: "q2", selectedOptionIds: [], simulationSessionId: "session-9", autoScore: 1.5 },
      ],
    });

    const context: GradeFeedbackContext = buildGradeFeedbackContext({ evaluation: buildAttemptEvaluation({ questions }), attempt, passingGrade: 3 });

    const [openText, simulation, unanswered] = context.questions as [GradeFeedbackQuestionContext, GradeFeedbackQuestionContext, GradeFeedbackQuestionContext];

    expect(openText).toMatchObject({ earnedPoints: 3, studentAnswerText: "Subir la PEEP", rubricSummary: "expert", correctAnswerText: undefined });
    expect(simulation.earnedPoints).toBe(1.5);
    expect(JSON.stringify(simulation)).not.toContain("session-9");
    expect(unanswered).toMatchObject({ earnedPoints: 0, studentAnswerText: NO_ANSWER_TEXT });
  });

  it("summarizes a simulation rubric", () => {
    const question: EvaluationQuestionItem = {
      ...attemptQuestion("q1", "SIMULATION", 2),
      rubric: { criteria: [{ parameter: "peep", expectedValue: 8, min: 5, max: 10, priority: "CRITICO" }], justification: "SDRA moderado" },
    };

    const context: GradeFeedbackContext = buildGradeFeedbackContext({
      evaluation: buildAttemptEvaluation({ questions: [question] }),
      attempt: gradedAttempt({ answers: [] }),
      passingGrade: 3,
    });

    expect(context.questions[0]?.rubricSummary).toBe("peep: 8 (rango 5–10, CRITICO). SDRA moderado");
  });
});
