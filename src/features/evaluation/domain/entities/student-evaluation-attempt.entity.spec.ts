/*
 * Funcionalidad: Pruebas de la calificación docente del agregado StudentEvaluationAttempt
 * Descripción: Verifica la calificación manual por pregunta (rango 0–puntos, comentario obligatorio al sobrescribir un puntaje existente, intento en curso no calificable), el recálculo a GRADED con la nota 0.0–5.0 y sus eventos (calificado, publicado si showResultsImmediately, actualizado al recalificar) y la publicación idempotente solo de intentos GRADED
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import {
  type AnswerGradeChange,
  StudentEvaluationAttempt,
  type StudentEvaluationAttemptProps,
} from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAttemptNotGradableError,
  EvaluationAttemptNotGradedError,
  EvaluationQuestionNotFoundError,
  GradeOverrideCommentRequiredError,
  InvalidManualScoreError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  EvaluationAttemptGradedEvent,
  EvaluationGradePublishedEvent,
  EvaluationGradeUpdatedEvent,
} from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

const NOW: Date = new Date("2026-10-06T10:00:00.000Z");

function question(id: string, type: EvaluationQuestionTypeValue, points: number): EvaluationQuestionItem {
  return { id, evaluationId: "evaluation-1", order: 0, type, prompt: { type: "doc", content: [] }, mediaIds: [], points, options: [] };
}

const QUESTIONS: EvaluationQuestionItem[] = [question("q1", "SINGLE_CHOICE", 1), question("q2", "OPEN_TEXT", 4)];

function attempt(overrides: Partial<StudentEvaluationAttemptProps> = {}): StudentEvaluationAttempt {
  return StudentEvaluationAttempt.reconstitute({
    id: "attempt-1",
    evaluationId: "evaluation-1",
    assignmentId: "assignment-1",
    userId: "student-1",
    attemptNumber: 1,
    status: "PENDING_REVIEW",
    startedAt: new Date("2026-10-06T09:00:00.000Z"),
    submittedAt: new Date("2026-10-06T09:30:00.000Z"),
    score: 1,
    maxScore: 5,
    isLate: false,
    answers: [
      { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"], autoScore: 1 },
      { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "Raise PEEP" },
    ],
    createdAt: new Date("2026-10-06T09:00:00.000Z"),
    updatedAt: new Date("2026-10-06T09:30:00.000Z"),
    ...overrides,
  });
}

function grade(target: StudentEvaluationAttempt, questionId: string, manualScore: number, comment?: string, publishImmediately: boolean = false): AnswerGradeChange {
  return target.gradeAnswer({ questions: QUESTIONS, questionId, manualScore, comment, graderId: "teacher-1", now: NOW, publishImmediately, passingGrade: 3 });
}

const drained: WeakMap<StudentEvaluationAttempt, DomainEvent[]> = new WeakMap<StudentEvaluationAttempt, DomainEvent[]>();

function eventsOf<T extends DomainEvent>(target: StudentEvaluationAttempt, eventClass: abstract new (...args: never[]) => T): T[] {
  const events: DomainEvent[] = [...(drained.get(target) ?? []), ...target.getEvents()];

  drained.set(target, events);

  return events.filter((event: DomainEvent): event is T => event instanceof eventClass);
}

describe("StudentEvaluationAttempt grading", () => {
  it("grades the last pending question, moves to GRADED and emits the graded event (check 12)", () => {
    const target: StudentEvaluationAttempt = attempt();

    const change: AnswerGradeChange = grade(target, "q2", 3);

    expect(change.override).toBe(false);
    expect(target).toMatchObject({ status: "GRADED", score: 4, maxScore: 5, grade: 4 });
    expect(target.answerFor("q2")).toMatchObject({ manualScore: 3, gradedById: "teacher-1" });
    expect(target.isPublished).toBe(false);
    expect(eventsOf(target, EvaluationAttemptGradedEvent)).toHaveLength(1);
    expect(eventsOf(target, EvaluationGradePublishedEvent)).toHaveLength(0);
  });

  it("publishes immediately when the evaluation shows results immediately", () => {
    const target: StudentEvaluationAttempt = attempt();

    grade(target, "q2", 4, undefined, true);

    expect(target.gradePublishedAt).toEqual(NOW);
    expect(eventsOf(target, EvaluationGradePublishedEvent)[0]).toMatchObject({ grade: 5, passed: true, performedBy: "teacher-1" });
  });

  it("keeps PENDING_REVIEW while another question is still pending", () => {
    const target: StudentEvaluationAttempt = attempt({
      answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: [] }],
    });

    grade(target, "q1", 1);

    expect(target).toMatchObject({ status: "PENDING_REVIEW", score: 1, grade: undefined });
    expect(eventsOf(target, DomainEvent)).toHaveLength(0);
  });

  it("rejects scores outside 0..points", () => {
    expect(() => grade(attempt(), "q2", 4.5)).toThrow(InvalidManualScoreError);
    expect(() => grade(attempt(), "q2", -1)).toThrow(InvalidManualScoreError);
    expect(() => grade(attempt(), "q2", Number.NaN)).toThrow(InvalidManualScoreError);
  });

  it("requires a comment to override an automatic or manual score (check 13)", () => {
    const target: StudentEvaluationAttempt = attempt();

    expect(() => grade(target, "q1", 0)).toThrow(GradeOverrideCommentRequiredError);
    expect(() => grade(target, "q1", 0, "   ")).toThrow(GradeOverrideCommentRequiredError);

    const change: AnswerGradeChange = grade(target, "q1", 0, "Wrong reasoning");

    expect(change).toMatchObject({
      override: true,
      answerId: "answer-1",
      before: { autoScore: 1, manualScore: null, teacherComment: null },
      after: { autoScore: 1, manualScore: 0, teacherComment: "Wrong reasoning" },
    });
  });

  it("recomputes a GRADED attempt and emits an update instead of a second graded event", () => {
    const target: StudentEvaluationAttempt = attempt({
      status: "GRADED",
      score: 4,
      grade: 4,
      gradePublishedAt: NOW,
      answers: [
        { id: "answer-1", questionId: "q1", selectedOptionIds: [], autoScore: 1 },
        { id: "answer-2", questionId: "q2", selectedOptionIds: [], manualScore: 3 },
      ],
    });

    grade(target, "q2", 1, "Missed the plateau pressure");

    expect(target).toMatchObject({ status: "GRADED", score: 2, grade: 2, gradePublishedAt: NOW });
    expect(eventsOf(target, EvaluationAttemptGradedEvent)).toHaveLength(0);
    expect(eventsOf(target, EvaluationGradeUpdatedEvent)[0]).toMatchObject({ grade: 2, passed: false, published: true });
  });

  it("refuses to grade an attempt in progress and unknown questions", () => {
    expect(() => grade(attempt({ status: "IN_PROGRESS" }), "q2", 1)).toThrow(EvaluationAttemptNotGradableError);
    expect(() => grade(attempt(), "q9", 1)).toThrow(EvaluationQuestionNotFoundError);
  });

  it("publishes a GRADED attempt once and refuses other statuses", () => {
    const target: StudentEvaluationAttempt = attempt({ status: "GRADED", score: 5, grade: 5 });

    expect(target.publishGrade(NOW, 3, "teacher-1")).toBe(true);
    expect(target.publishGrade(NOW, 3, "teacher-1")).toBe(false);
    expect(eventsOf(target, EvaluationGradePublishedEvent)).toHaveLength(1);
    expect(() => attempt().publishGrade(NOW, 3, "teacher-1")).toThrow(EvaluationAttemptNotGradedError);
  });
});
