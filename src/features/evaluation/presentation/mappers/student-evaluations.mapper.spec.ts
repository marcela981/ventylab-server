/*
 * Funcionalidad: Pruebas del mapeador de respuestas del estudiante
 * Descripción: Verifica que el intento serializado para el estudiante nunca expone respuestas correctas, explicaciones, rúbricas ni retroalimentación de opciones mientras la nota no está publicada, y que tras la publicación las incluye junto con el puntaje por pregunta y la nota
 * Versión: 1.0
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
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
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
