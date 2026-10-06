/*
 * Funcionalidad: Pruebas del calificador automático de intentos
 * Descripción: Verifica la calificación todo-o-nada de preguntas de selección, las preguntas abiertas y prácticas pendientes de revisión manual, el puntaje práctico ponderado, la nota 0.0–5.0 con un decimal, el caso de evaluación sin puntos y el resumen de puntajes con calificación manual (manual sobre automático, preguntas pendientes)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import {
  computeEvaluationGrade,
  type EvaluationAttemptGrading,
  type GradableAnswer,
  gradeEvaluationAttempt,
  type QuestionGrade,
  summarizeAttemptScores,
} from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

const PROMPT: Record<string, unknown> = { type: "doc", content: [] };

function question(id: string, type: EvaluationQuestionTypeValue, points: number, correct: string[] = [], wrong: string[] = []): EvaluationQuestionItem {
  return {
    id,
    evaluationId: "evaluation-1",
    order: 0,
    type,
    prompt: PROMPT,
    mediaIds: [],
    points,
    options: [
      ...correct.map((optionId: string, index: number) => ({ id: optionId, questionId: id, order: index, content: optionId, isCorrect: true })),
      ...wrong.map((optionId: string, index: number) => ({ id: optionId, questionId: id, order: 10 + index, content: optionId, isCorrect: false })),
    ],
  };
}

function answers(...items: GradableAnswer[]): Map<string, GradableAnswer> {
  return new Map<string, GradableAnswer>(items.map((item: GradableAnswer) => [item.questionId, item]));
}

const NO_PRACTICAL: Map<string, number> = new Map<string, number>();

const CHOICE_QUESTIONS: EvaluationQuestionItem[] = [question("q1", "SINGLE_CHOICE", 1, ["q1-a"], ["q1-b"]), question("q2", "TRUE_FALSE", 1, ["q2-t"], ["q2-f"])];

describe("gradeEvaluationAttempt (check 12)", () => {
  it("grades 0% as 0.0", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(
      CHOICE_QUESTIONS,
      answers({ questionId: "q1", selectedOptionIds: ["q1-b"] }, { questionId: "q2", selectedOptionIds: ["q2-f"] }),
      NO_PRACTICAL,
    );

    expect(grading).toMatchObject({ status: "GRADED", score: 0, maxScore: 2, grade: 0 });
  });

  it("grades 50% as 2.5", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(
      CHOICE_QUESTIONS,
      answers({ questionId: "q1", selectedOptionIds: ["q1-a"] }, { questionId: "q2", selectedOptionIds: ["q2-f"] }),
      NO_PRACTICAL,
    );

    expect(grading).toMatchObject({ status: "GRADED", score: 1, maxScore: 2, grade: 2.5 });
  });

  it("grades 100% as 5.0", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(
      CHOICE_QUESTIONS,
      answers({ questionId: "q1", selectedOptionIds: ["q1-a"] }, { questionId: "q2", selectedOptionIds: ["q2-t"] }),
      NO_PRACTICAL,
    );

    expect(grading).toMatchObject({ status: "GRADED", score: 2, maxScore: 2, grade: 5 });
  });

  it("leaves an OPEN_TEXT question pending, so the attempt goes to PENDING_REVIEW without grade", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(
      [...CHOICE_QUESTIONS, question("q3", "OPEN_TEXT", 2)],
      answers({ questionId: "q1", selectedOptionIds: ["q1-a"] }, { questionId: "q3", selectedOptionIds: [], textAnswer: "Raise PEEP" }),
      NO_PRACTICAL,
    );

    expect(grading.status).toBe("PENDING_REVIEW");
    expect(grading.grade).toBeUndefined();
    expect(grading.score).toBe(1);
    expect(grading.maxScore).toBe(4);
    expect(grading.questions.find((item: QuestionGrade) => item.questionId === "q3")).toEqual({ questionId: "q3", pendingManual: true });
  });

  it("grades MULTIPLE_CHOICE all or nothing", () => {
    const multiple: EvaluationQuestionItem[] = [question("m", "MULTIPLE_CHOICE", 3, ["m-a", "m-b"], ["m-c"])];

    expect(gradeEvaluationAttempt(multiple, answers({ questionId: "m", selectedOptionIds: ["m-b", "m-a"] }), NO_PRACTICAL).score).toBe(3);
    expect(gradeEvaluationAttempt(multiple, answers({ questionId: "m", selectedOptionIds: ["m-a"] }), NO_PRACTICAL).score).toBe(0);
    expect(gradeEvaluationAttempt(multiple, answers({ questionId: "m", selectedOptionIds: ["m-a", "m-b", "m-c"] }), NO_PRACTICAL).score).toBe(0);
  });

  it("scores an unanswered choice question as 0", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(CHOICE_QUESTIONS, answers(), NO_PRACTICAL);

    expect(grading.questions).toEqual([
      { questionId: "q1", autoScore: 0, pendingManual: false },
      { questionId: "q2", autoScore: 0, pendingManual: false },
    ]);
    expect(grading.grade).toBe(0);
  });

  it("weights an available practical score and keeps an unavailable one pending", () => {
    const simulation: EvaluationQuestionItem[] = [question("s1", "SIMULATION", 3), question("s2", "SIMULATION", 2)];

    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt(
      simulation,
      answers({ questionId: "s1", selectedOptionIds: [], simulationSessionId: "session-1" }, { questionId: "s2", selectedOptionIds: [], simulationSessionId: "session-2" }),
      new Map<string, number>([["s1", 0.333]]),
    );

    expect(grading.questions).toEqual([
      { questionId: "s1", autoScore: 1, pendingManual: false },
      { questionId: "s2", pendingManual: true },
    ]);
    expect(grading.status).toBe("PENDING_REVIEW");
  });

  it("gives grade 0 and flags an evaluation without points", () => {
    const grading: EvaluationAttemptGrading = gradeEvaluationAttempt([], answers(), NO_PRACTICAL);

    expect(grading).toMatchObject({ status: "GRADED", score: 0, maxScore: 0, grade: 0, zeroMaxScore: true });
  });
});

describe("computeEvaluationGrade", () => {
  it("rounds to one decimal on the 0.0–5.0 scale", () => {
    expect(computeEvaluationGrade(2, 3)).toBe(3.3);
    expect(computeEvaluationGrade(7, 10)).toBe(3.5);
    expect(computeEvaluationGrade(0, 0)).toBe(0);
  });
});

describe("summarizeAttemptScores", () => {
  it("prefers the manual score over the automatic one and grades when nothing is pending", () => {
    const summary: ReturnType<typeof summarizeAttemptScores> = summarizeAttemptScores(
      [question("q1", "SINGLE_CHOICE", 1), question("q2", "OPEN_TEXT", 3)],
      new Map([
        ["q1", { questionId: "q1", autoScore: 0, manualScore: 1 }],
        ["q2", { questionId: "q2", manualScore: 2 }],
      ]),
    );

    expect(summary).toEqual({ score: 3, maxScore: 4, pendingQuestionIds: [], grade: 3.8 });
  });

  it("lists questions without any score as pending and leaves the grade undefined", () => {
    const summary: ReturnType<typeof summarizeAttemptScores> = summarizeAttemptScores(
      [question("q1", "SINGLE_CHOICE", 1), question("q2", "OPEN_TEXT", 3), question("q3", "SIMULATION", 2)],
      new Map([["q1", { questionId: "q1", autoScore: 1 }], ["q2", { questionId: "q2" }]]),
    );

    expect(summary).toEqual({ score: 1, maxScore: 6, pendingQuestionIds: ["q2", "q3"], grade: undefined });
  });
});
