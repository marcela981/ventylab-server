/*
 * Funcionalidad: Pruebas del caso de uso GradeEvaluationAnswerUseCase
 * Descripción: Verifica la calificación manual del profesor: examen con pregunta abierta en PENDING_REVIEW hasta la calificación manual y luego GRADED con evento tras confirmar, publicación automática con showResultsImmediately, sobrescritura sin comentario (422) y con comentario (auditoría en la misma transacción), alcance del profesor (403), intento inexistente (404), candado por evaluación y estudiante, cierre perezoso de un intento vencido antes de calificar e intentos heredados (legacySource) de solo lectura (409) sin recalcular su puntaje
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GradeEvaluationAnswerCommand } from "@/features/evaluation/application/commands/grade-evaluation-answer.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type GradeEvaluationAnswerResult } from "@/features/evaluation/application/results/evaluation-grading.result";
import {
  attemptQuestion,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  publishedEvents,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { ADMIN, buildGradingDoubles, type GradingDoubles, TEACHER } from "@/features/evaluation/application/testing/evaluation-grading-test-doubles-spec";
import {
  EVALUATION_SCORE_OVERRIDDEN_ACTION,
  GradeEvaluationAnswerUseCase,
} from "@/features/evaluation/application/use-cases/grade-evaluation-answer.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { type StudentEvaluationAttemptProps } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAttemptNotFoundError,
  EvaluationAttemptReadOnlyError,
  EvaluationGradingForbiddenError,
  GradeOverrideCommentRequiredError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationAttemptGradedEvent, EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

const OPEN_TEXT_EXAM: Parameters<typeof buildAttemptEvaluation>[0] = {
  questions: [attemptQuestion("q1"), attemptQuestion("q2", "OPEN_TEXT", 3)],
  showResultsImmediately: false,
};

function useCase(doubles: GradingDoubles): GradeEvaluationAnswerUseCase {
  return new GradeEvaluationAnswerUseCase(
    doubles.attemptsRepository,
    doubles.closer,
    doubles.gradingAccess,
    doubles.gradingConfig,
    doubles.transactionManager,
    doubles.eventBus,
    doubles.auditRecorder,
  );
}

function grade(
  doubles: GradingDoubles,
  input: { questionId?: string; manualScore: number; comment?: string; actor?: EvaluationActor; attemptId?: string },
): Promise<GradeEvaluationAnswerResult> {
  return useCase(doubles).execute(
    new GradeEvaluationAnswerCommand({
      attemptId: input.attemptId ?? "attempt-1",
      questionId: input.questionId ?? "q2",
      manualScore: input.manualScore,
      comment: input.comment,
      actor: input.actor ?? TEACHER,
    }),
  );
}

function stored(doubles: GradingDoubles): StudentEvaluationAttemptProps | undefined {
  return doubles.attemptsRepository.store.get("attempt-1");
}

describe("GradeEvaluationAnswerUseCase", () => {
  it("keeps an exam with an OPEN_TEXT question in PENDING_REVIEW until the teacher grades it, then GRADED (check 12)", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation(OPEN_TEXT_EXAM),
      attempts: [
        buildStoredAttempt({
          answers: [
            { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] },
            { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "Raise PEEP" },
          ],
        }),
      ],
      scopedAttemptIds: ["attempt-1"],
    });

    await new SubmitEvaluationAttemptUseCase(
      doubles.attemptsRepository,
      doubles.closer,
      doubles.recorder,
      doubles.gradingConfig,
      doubles.transactionManager,
      doubles.eventBus,
    ).execute(new SubmitEvaluationAttemptCommand({ attemptId: "attempt-1", userId: "student-1" }));

    expect(stored(doubles)).toMatchObject({ status: "PENDING_REVIEW", grade: undefined });

    const result: GradeEvaluationAnswerResult = await grade(doubles, { manualScore: 2 });

    expect(result).toMatchObject({ attemptId: "attempt-1", questionId: "q2", status: "GRADED", score: 3, maxScore: 4, grade: 3.8, published: false, override: false });
    expect(stored(doubles)).toMatchObject({ status: "GRADED", score: 3, maxScore: 4, grade: 3.8 });
    expect(stored(doubles)?.answers.find((answer: { questionId: string }) => answer.questionId === "q2")).toMatchObject({ manualScore: 2, gradedById: "teacher-1" });
    expect(publishedEvents(doubles, EvaluationAttemptGradedEvent)).toHaveLength(1);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(0);
    expect(doubles.record).not.toHaveBeenCalled();
    expect(doubles.attemptsRepository.locks).toContain("evaluations:attempt:evaluation-1:student-1");
  });

  it("auto-publishes when the evaluation shows results immediately", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation({ ...OPEN_TEXT_EXAM, showResultsImmediately: true }),
      attempts: [buildStoredAttempt({ status: "PENDING_REVIEW", answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: [], autoScore: 1 }] })],
      scopedAttemptIds: ["attempt-1"],
    });

    const result: GradeEvaluationAnswerResult = await grade(doubles, { manualScore: 3 });

    expect(result).toMatchObject({ status: "GRADED", grade: 5, published: true });
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(1);
  });

  it("rejects an override without a comment (422) and audits an override with a comment (check 13)", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation(OPEN_TEXT_EXAM),
      attempts: [
        buildStoredAttempt({
          status: "PENDING_REVIEW",
          answers: [
            { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ko"], autoScore: 0 },
            { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "Raise PEEP" },
          ],
        }),
      ],
      scopedAttemptIds: ["attempt-1"],
    });

    await expect(grade(doubles, { questionId: "q1", manualScore: 1 })).rejects.toBeInstanceOf(GradeOverrideCommentRequiredError);
    expect(stored(doubles)?.answers.find((answer: { questionId: string }) => answer.questionId === "q1")?.manualScore).toBeUndefined();

    const result: GradeEvaluationAnswerResult = await grade(doubles, { questionId: "q1", manualScore: 1, comment: "Both options are acceptable" });

    expect(result).toMatchObject({ override: true, status: "PENDING_REVIEW" });
    expect(doubles.record).toHaveBeenCalledTimes(1);
    expect(doubles.record).toHaveBeenCalledWith(
      "teacher-1",
      EVALUATION_SCORE_OVERRIDDEN_ACTION,
      "evaluation_answers",
      "answer-1",
      { autoScore: 0, manualScore: null, teacherComment: null },
      { autoScore: 0, manualScore: 1, teacherComment: "Both options are acceptable" },
      expect.anything(),
    );
  });

  it("forbids a teacher outside the student's groups (403) and lets an admin grade", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation(OPEN_TEXT_EXAM),
      attempts: [buildStoredAttempt({ status: "PENDING_REVIEW" })],
    });

    await expect(grade(doubles, { manualScore: 1 })).rejects.toBeInstanceOf(EvaluationGradingForbiddenError);

    const result: GradeEvaluationAnswerResult = await grade(doubles, { manualScore: 1, actor: ADMIN });

    expect(result.status).toBe("PENDING_REVIEW");
  });

  it("returns 404 for an unknown attempt", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();

    await expect(grade(doubles, { manualScore: 1, attemptId: "missing" })).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
  });

  it("closes an expired attempt in progress before grading it", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation(OPEN_TEXT_EXAM),
      attempts: [
        buildStoredAttempt({
          deadlineAt: minutesFromNow(-5),
          answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] }],
        }),
      ],
      scopedAttemptIds: ["attempt-1"],
    });

    const result: GradeEvaluationAnswerResult = await grade(doubles, { manualScore: 3 });

    expect(result).toMatchObject({ status: "GRADED", score: 4, grade: 5 });
    expect(stored(doubles)?.submittedAt).toEqual(stored(doubles)?.deadlineAt);
  });

  it("rejects grading a legacy attempt with 409 and keeps its migrated score (graded through the legacy routes)", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation(OPEN_TEXT_EXAM),
      attempts: [
        buildStoredAttempt({
          status: "PENDING_REVIEW",
          score: 7,
          maxScore: 10,
          legacySource: "activity_submission",
          answers: [],
        }),
      ],
      scopedAttemptIds: ["attempt-1"],
    });

    await expect(grade(doubles, { manualScore: 2, actor: ADMIN })).rejects.toBeInstanceOf(EvaluationAttemptReadOnlyError);
    expect(stored(doubles)).toMatchObject({ status: "PENDING_REVIEW", score: 7, maxScore: 10 });
    expect(doubles.attemptsRepository.locks).toHaveLength(0);
    expect(doubles.publish).not.toHaveBeenCalled();
  });
});
