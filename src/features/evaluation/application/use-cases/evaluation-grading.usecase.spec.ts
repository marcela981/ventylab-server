/*
 * Funcionalidad: Pruebas de la cola, la vista de calificación y la publicación de notas
 * Descripción: Verifica la cola de revisión del profesor (solo PENDING_REVIEW en su alcance, cierre perezoso acotado de intentos vencidos antes de listar), la vista de calificación con respuestas correctas, puntajes y desglose práctico recalculado bajo demanda, la publicación individual idempotente solo de intentos GRADED y la publicación masiva por evaluación con el conteo y un evento por intento tras confirmar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { PublishEvaluationGradesCommand } from "@/features/evaluation/application/commands/publish-evaluation-grades.command";
import {
  type GradingAttemptDetailResult,
  type PublishEvaluationAttemptGradeResult,
} from "@/features/evaluation/application/results/evaluation-grading.result";
import {
  attemptQuestion,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  publishedEvents,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { ADMIN, buildGradingDoubles, type GradingDoubles, TEACHER } from "@/features/evaluation/application/testing/evaluation-grading-test-doubles-spec";
import { GetAttemptForGradingUseCase } from "@/features/evaluation/application/use-cases/get-attempt-for-grading.usecase";
import { GetGradingQueueUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { PublishEvaluationGradesUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-grades.usecase";
import {
  EvaluationAttemptNotGradedError,
  EvaluationGradingForbiddenError,
  EvaluationNotFoundError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";

describe("GetGradingQueueUseCase", () => {
  it("lazily closes expired attempts in scope and lists only PENDING_REVIEW attempts", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "OPEN_TEXT", 2)] }),
      attempts: [
        buildStoredAttempt({ id: "attempt-1", deadlineAt: minutesFromNow(-5) }),
        buildStoredAttempt({ id: "attempt-2", userId: "student-2", status: "PENDING_REVIEW" }),
        buildStoredAttempt({ id: "attempt-3", userId: "student-3", status: "PENDING_REVIEW" }),
        buildStoredAttempt({ id: "attempt-4", userId: "student-4" }),
      ],
      scopedAttemptIds: ["attempt-1", "attempt-2", "attempt-4"],
    });

    const result: Paginated<GradingQueueItemView> = await new GetGradingQueueUseCase(
      doubles.gradingRepository,
      doubles.attemptsRepository,
      doubles.closer,
      doubles.gradingAccess,
    ).execute({ evaluationId: "evaluation-1", page: 1, limit: 10 }, TEACHER);

    expect(result.data.map((item: GradingQueueItemView) => item.attemptId).sort()).toEqual(["attempt-1", "attempt-2"]);
    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).toBe("PENDING_REVIEW");
    expect(doubles.attemptsRepository.store.get("attempt-4")?.status).toBe("IN_PROGRESS");
  });
});

describe("GetAttemptForGradingUseCase", () => {
  it("returns the evaluation with correct answers, the student answers and a fresh practical breakdown", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1"), attemptQuestion("q2", "SIMULATION", 4)] }),
      attempts: [
        buildStoredAttempt({
          status: "GRADED",
          score: 3,
          maxScore: 5,
          grade: 3,
          answers: [
            { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"], autoScore: 1 },
            { id: "answer-2", questionId: "q2", selectedOptionIds: [], simulationSessionId: "session-1", autoScore: 2 },
          ],
        }),
      ],
      practicalScore: { available: true, score: 0.5, breakdown: [{ parameter: "peep", score: 0.5 }] },
      scopedAttemptIds: ["attempt-1"],
    });

    const result: GradingAttemptDetailResult = await new GetAttemptForGradingUseCase(
      doubles.attemptsRepository,
      doubles.evaluationsRepository,
      doubles.closer,
      doubles.gradingAccess,
      { getSessionScore: doubles.getSessionScore },
      doubles.gradingConfig,
    ).execute("attempt-1", TEACHER);

    expect(result.attempt.id).toBe("attempt-1");
    expect(result.evaluation.questions[0].options.find((option: { isCorrect: boolean }) => option.isCorrect)?.id).toBe("q1-ok");
    expect(result.practicalScores.get("q2")).toEqual({ available: true, score: 0.5, breakdown: [{ parameter: "peep", score: 0.5 }] });
    expect(result.passingGrade).toBe(3);
    expect(doubles.getSessionScore).toHaveBeenCalledWith("session-1", { criteria: "expert" }, { userId: STUDENT_ID, attemptId: "attempt-1", questionId: "q2" });
  });

  it("forbids a teacher outside the student's groups", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({ attempts: [buildStoredAttempt({ status: "PENDING_REVIEW" })] });

    await expect(
      new GetAttemptForGradingUseCase(
        doubles.attemptsRepository,
        doubles.evaluationsRepository,
        doubles.closer,
        doubles.gradingAccess,
        { getSessionScore: doubles.getSessionScore },
        doubles.gradingConfig,
      ).execute("attempt-1", TEACHER),
    ).rejects.toBeInstanceOf(EvaluationGradingForbiddenError);
  });
});

describe("PublishEvaluationAttemptGradeUseCase", () => {
  function publish(doubles: GradingDoubles): Promise<PublishEvaluationAttemptGradeResult> {
    return new PublishEvaluationAttemptGradeUseCase(
      doubles.attemptsRepository,
      doubles.gradingAccess,
      doubles.gradingConfig,
      doubles.transactionManager,
      doubles.eventBus,
    ).execute("attempt-1", TEACHER);
  }

  it("publishes a GRADED attempt once and emits the event after commit", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      attempts: [buildStoredAttempt({ status: "GRADED", score: 2, maxScore: 2, grade: 5 })],
      scopedAttemptIds: ["attempt-1"],
    });

    const first: PublishEvaluationAttemptGradeResult = await publish(doubles);
    const second: PublishEvaluationAttemptGradeResult = await publish(doubles);

    expect(first).toMatchObject({ attemptId: "attempt-1", alreadyPublished: false });
    expect(second).toMatchObject({ attemptId: "attempt-1", alreadyPublished: true, publishedAt: first.publishedAt });
    expect(doubles.attemptsRepository.store.get("attempt-1")?.gradePublishedAt).toEqual(first.publishedAt);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(1);
  });

  it("refuses an attempt that is not GRADED", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({ attempts: [buildStoredAttempt({ status: "PENDING_REVIEW" })], scopedAttemptIds: ["attempt-1"] });

    await expect(publish(doubles)).rejects.toBeInstanceOf(EvaluationAttemptNotGradedError);
  });
});

describe("PublishEvaluationGradesUseCase", () => {
  function publishAll(doubles: GradingDoubles, evaluationId: string = "evaluation-1"): Promise<number> {
    return new PublishEvaluationGradesUseCase(
      doubles.gradingRepository,
      doubles.attemptsRepository,
      doubles.evaluationsRepository,
      doubles.gradingAccess,
      doubles.gradingConfig,
      doubles.transactionManager,
      doubles.eventBus,
    ).execute(new PublishEvaluationGradesCommand({ evaluationId, actor: ADMIN }));
  }

  it("publishes every GRADED unpublished attempt and returns the count", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      attempts: [
        buildStoredAttempt({ id: "attempt-1", status: "GRADED", score: 2, maxScore: 2, grade: 5 }),
        buildStoredAttempt({ id: "attempt-2", userId: "student-2", status: "GRADED", score: 1, maxScore: 2, grade: 2.5 }),
        buildStoredAttempt({ id: "attempt-3", userId: "student-3", status: "GRADED", score: 2, maxScore: 2, grade: 5, gradePublishedAt: minutesFromNow(-1) }),
        buildStoredAttempt({ id: "attempt-4", userId: "student-4", status: "PENDING_REVIEW" }),
      ],
    });

    const count: number = await publishAll(doubles);

    expect(count).toBe(2);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent).map((event: EvaluationGradePublishedEvent) => event.attemptId).sort()).toEqual([
      "attempt-1",
      "attempt-2",
    ]);
    expect(await publishAll(doubles)).toBe(0);
  });

  it("returns 404 for an unknown evaluation", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();

    await expect(publishAll(doubles, "missing")).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });
});
