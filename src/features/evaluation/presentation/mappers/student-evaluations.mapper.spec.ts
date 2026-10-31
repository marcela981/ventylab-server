/*
 * Funcionalidad: Pruebas del mapeador de respuestas del estudiante
 * Descripción: Verifica que el intento serializado para el estudiante nunca expone respuestas correctas, explicaciones, rúbricas ni retroalimentación de opciones mientras la nota no está publicada, y que tras la publicación las incluye junto con el puntaje por pregunta y la nota; la corrección solo de las respuestas revisadas antes de publicar, la pista solo en WORKSHOP y la nota parcial de las cerradas en revisión
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { StudentEvaluationAttemptDetailResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import {
  attemptQuestion,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationAnswerRecord, type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type StudentAttemptDetailDTO } from "@/features/evaluation/presentation/dtos/student-evaluation.dto";
import { StudentEvaluationsMapper } from "@/features/evaluation/presentation/mappers/student-evaluations.mapper";

const EVALUATION: Evaluation = buildAttemptEvaluation({
  questions: [attemptQuestion("q1"), attemptQuestion("q2", "OPEN_TEXT", 2), attemptQuestion("q3", "SIMULATION", 3)],
});

function detail(attempt: StudentEvaluationAttempt): StudentEvaluationAttemptDetailResult {
  return new StudentEvaluationAttemptDetailResult({
    attempt,
    evaluation: EVALUATION,
    questions: EVALUATION.questions,
    mediaUrls: new Map(),
    deadlineAt: attempt.deadlineAt,
    now: new Date(),
    passingGrade: 3,
  });
}

describe("StudentEvaluationsMapper.toAttemptDetailDTO (check 11)", () => {
  it("never serializes correct answers, explanations, rubrics or option feedback before publication", () => {
    const attempt: StudentEvaluationAttempt = buildStoredAttempt({ answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] }] });

    const json: string = JSON.stringify(StudentEvaluationsMapper.toAttemptDetailDTO(detail(attempt)));

    expect(json).not.toContain("isCorrect");
    expect(json).not.toContain("explanation");
    expect(json).not.toContain("rubric");
    expect(json).not.toContain("Well done");
    expect(json).not.toContain("expert");
    expect(json).not.toContain("earnedScore");
    expect(json).not.toContain("\"grade\"");
    expect(json).toContain("q1-ok");
  });

  it("keeps hiding them for a graded attempt whose grade is not published", () => {
    const attempt: StudentEvaluationAttempt = buildStoredAttempt({
      status: "GRADED",
      submittedAt: minutesFromNow(-1),
      score: 6,
      maxScore: 6,
      grade: 5,
      answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"], autoScore: 1 }],
    });

    const json: string = JSON.stringify(StudentEvaluationsMapper.toAttemptDetailDTO(detail(attempt)));

    expect(json).not.toContain("isCorrect");
    expect(json).not.toContain("explanation");
    expect(json).not.toContain("rubric");
    expect(json).not.toContain("\"score\"");
  });

  it("includes them with the earned score per question once the grade is published", () => {
    const attempt: StudentEvaluationAttempt = buildStoredAttempt({
      status: "GRADED",
      submittedAt: minutesFromNow(-1),
      gradePublishedAt: minutesFromNow(-1),
      score: 4,
      maxScore: 6,
      grade: 3.3,
      answers: [
        { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"], autoScore: 1 },
        { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "PEEP", autoScore: undefined, manualScore: 1.5 },
      ],
    });

    const dto: StudentAttemptDetailDTO = StudentEvaluationsMapper.toAttemptDetailDTO(detail(attempt));
    const json: string = JSON.stringify(dto);

    expect(json).toContain("isCorrect");
    expect(json).toContain("explanation");
    expect(json).toContain("rubric");
    expect(dto).toMatchObject({ published: true, score: 4, maxScore: 6, grade: 3.3, passed: true });
    expect(dto.questions.map((question: { earnedScore?: number | null }) => question.earnedScore)).toEqual([1, 1.5, null]);
  });
});

describe("StudentEvaluationsMapper.toAttemptDetailDTO partialClosedScore", () => {
  const pendingAnswers: { id: string; questionId: string; selectedOptionIds: string[]; textAnswer?: string }[] = [
    { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] },
    { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "Raise PEEP" },
  ];

  function pendingDetail(type: "QUIZ" | "WORKSHOP" | "EXAM"): StudentEvaluationAttemptDetailResult {
    const evaluation: Evaluation = buildAttemptEvaluation({ type, questions: [attemptQuestion("q1"), attemptQuestion("q4"), attemptQuestion("q2", "OPEN_TEXT", 2)] });
    const attempt: StudentEvaluationAttempt = buildStoredAttempt({ status: "PENDING_REVIEW", submittedAt: minutesFromNow(-1), answers: pendingAnswers });

    return new StudentEvaluationAttemptDetailResult({ attempt, evaluation, questions: evaluation.questions, mediaUrls: new Map(), now: new Date(), passingGrade: 3 });
  }

  it("exposes the correct closed questions of a PENDING_REVIEW WORKSHOP attempt", () => {
    expect(StudentEvaluationsMapper.toAttemptDetailDTO(pendingDetail("WORKSHOP")).partialClosedScore).toEqual({ correct: 1, total: 2 });
  });

  it("stays null for an EXAM and for attempts that are not pending review", () => {
    expect(StudentEvaluationsMapper.toAttemptDetailDTO(pendingDetail("EXAM")).partialClosedScore).toBeNull();
    expect(StudentEvaluationsMapper.toAttemptDetailDTO(detail(buildStoredAttempt())).partialClosedScore).toBeNull();
  });
});

describe("StudentEvaluationsMapper.toAttemptDetailDTO immediate feedback and hint", () => {
  function feedbackDetail(type: "QUIZ" | "WORKSHOP", answers: EvaluationAnswerRecord[]): StudentEvaluationAttemptDetailResult {
    const evaluation: Evaluation = buildAttemptEvaluation({ type, questions: [{ ...attemptQuestion("q1"), hint: "Look at the plateau" }, attemptQuestion("q2")] });
    const attempt: StudentEvaluationAttempt = buildStoredAttempt({ answers });

    return new StudentEvaluationAttemptDetailResult({ attempt, evaluation, questions: evaluation.questions, mediaUrls: new Map(), now: new Date(), passingGrade: 3 });
  }

  it("exposes the correction of a revealed answer only, before publication", () => {
    const revealedAt: Date = minutesFromNow(-1);
    const dto: StudentAttemptDetailDTO = StudentEvaluationsMapper.toAttemptDetailDTO(
      feedbackDetail("QUIZ", [
        { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ko"], revealedAt },
        { id: "answer-2", questionId: "q2", selectedOptionIds: ["q2-ok"] },
      ]),
    );

    expect(dto.questions[0].reveal).toEqual({ revealedAt, isCorrect: false, correctOptionIds: ["q1-ok"], explanation: "Because the guideline says so" });
    expect(dto.questions[1].reveal).toBeNull();
    expect(JSON.stringify(dto.questions[1])).not.toContain("isCorrect");
    expect(JSON.stringify(dto.questions[1])).not.toContain("explanation");
    expect(dto.questions[0].options.every((option: { isCorrect?: boolean }) => option.isCorrect === undefined)).toBe(true);
  });

  it("sends the hint only for WORKSHOP evaluations", () => {
    expect(StudentEvaluationsMapper.toAttemptDetailDTO(feedbackDetail("WORKSHOP", [])).questions[0].hint).toBe("Look at the plateau");
    expect(StudentEvaluationsMapper.toAttemptDetailDTO(feedbackDetail("QUIZ", [])).questions[0].hint).toBeNull();
  });
});
