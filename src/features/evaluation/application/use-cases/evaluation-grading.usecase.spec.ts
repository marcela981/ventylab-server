/*
 * Funcionalidad: Pruebas de la cola, la vista de calificación y la publicación de notas
 * Descripción: Verifica la cola de revisión del profesor (solo PENDING_REVIEW en su alcance, filtro por estudiante, cierre perezoso acotado de intentos vencidos antes de listar) y su conteo con los mismos filtros, las notas de un estudiante (administrador sin alcance, profesor solo de sus grupos y con su alcance, 403 fuera de ellos), la vista de calificación con respuestas correctas, puntajes y desglose práctico recalculado bajo demanda, la publicación individual idempotente solo de intentos GRADED y la publicación masiva por evaluación con el conteo y un evento por intento tras confirmar
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { PublishEvaluationGradesCommand } from "@/features/evaluation/application/commands/publish-evaluation-grades.command";
import {
  type EvaluationUserGrade,
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
import { type EvaluationAttemptsPage, GetEvaluationAttemptsUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-attempts.usecase";
import { GetGradingQueueCountUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue-count.usecase";
import { GetGradingQueueUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { GetStudentGradesUseCase } from "@/features/evaluation/application/use-cases/get-student-grades.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { PublishEvaluationGradesUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-grades.usecase";
import {
  EvaluationAttemptNotGradedError,
  EvaluationGradingForbiddenError,
  EvaluationNotFoundError,
  EvaluationStudentGradesForbiddenError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type GradingQueueItemView, type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";

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

    const result: Paginated<GradingQueueItemView> = await new GetGradingQueueUseCase(doubles.gradingRepository, doubles.lazyCloser, doubles.gradingAccess).execute(
      { evaluationId: "evaluation-1", page: 1, limit: 10 },
      TEACHER,
    );

    expect(result.data.map((item: GradingQueueItemView) => item.attemptId).sort()).toEqual(["attempt-1", "attempt-2"]);
    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).toBe("PENDING_REVIEW");
    expect(doubles.attemptsRepository.store.get("attempt-4")?.status).toBe("IN_PROGRESS");
  });

  it("lists only the attempts of the requested student", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      attempts: [
        buildStoredAttempt({ id: "attempt-1", userId: "student-1", status: "PENDING_REVIEW" }),
        buildStoredAttempt({ id: "attempt-2", userId: "student-2", status: "PENDING_REVIEW" }),
      ],
    });

    const result: Paginated<GradingQueueItemView> = await new GetGradingQueueUseCase(doubles.gradingRepository, doubles.lazyCloser, doubles.gradingAccess).execute(
      { studentId: "student-2", page: 1, limit: 10 },
      ADMIN,
    );

    expect(result.data.map((item: GradingQueueItemView) => item.attemptId)).toEqual(["attempt-2"]);
  });
});

describe("GetEvaluationAttemptsUseCase", () => {
  it("closes expired attempts in scope first, then lists the attempts with counts by status", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation({ type: "EXAM", showResultsImmediately: false }),
      attempts: [
        buildStoredAttempt({ id: "attempt-1", deadlineAt: minutesFromNow(-5) }),
        buildStoredAttempt({ id: "attempt-2", userId: "student-2", status: "PENDING_REVIEW" }),
        buildStoredAttempt({ id: "attempt-3", userId: "student-3", status: "GRADED", grade: 4, legacySource: "activity_submission" }),
      ],
      scopedAttemptIds: ["attempt-1", "attempt-2", "attempt-3"],
    });

    const page: EvaluationAttemptsPage = await new GetEvaluationAttemptsUseCase(doubles.gradingRepository, doubles.lazyCloser, doubles.gradingAccess).execute(
      { evaluationId: "evaluation-1", statuses: ["GRADED"], page: 1, limit: 10 },
      TEACHER,
    );

    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).toBe("GRADED");
    expect(page.attempts.data.map((item: { attemptId: string }) => item.attemptId)).toEqual(["attempt-1"]);
    expect(page.counts).toEqual({ IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 1, GRADED: 1 });
  });
});

describe("GetGradingQueueCountUseCase", () => {
  it("counts the queue with the same scope, filters and lazy close as the list", async () => {
    const doubles: GradingDoubles = buildGradingDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "OPEN_TEXT", 2)] }),
      attempts: [
        buildStoredAttempt({ id: "attempt-1", deadlineAt: minutesFromNow(-5) }),
        buildStoredAttempt({ id: "attempt-2", userId: "student-2", status: "PENDING_REVIEW" }),
        buildStoredAttempt({ id: "attempt-3", userId: "student-3", status: "PENDING_REVIEW" }),
      ],
      scopedAttemptIds: ["attempt-1", "attempt-2"],
    });
    const useCase: GetGradingQueueCountUseCase = new GetGradingQueueCountUseCase(doubles.gradingRepository, doubles.lazyCloser, doubles.gradingAccess);

    const teacherCount: number = await useCase.execute({ evaluationId: "evaluation-1" }, TEACHER);
    const studentCount: number = await useCase.execute({ studentId: "student-3" }, ADMIN);

    expect(teacherCount).toBe(2);
    expect(studentCount).toBe(1);
  });
});

describe("GetStudentGradesUseCase", () => {
  const view: PublishedGradeView = {
    attemptId: "attempt-1",
    evaluationId: "evaluation-1",
    evaluationTitle: "Ventilation basics",
    evaluationType: "QUIZ",
    moduleId: "module-1",
    moduleTitle: "Basics",
    userId: STUDENT_ID,
    attemptNumber: 1,
    grade: 2.5,
    publishedAt: new Date("2026-10-01T10:00:00.000Z"),
    legacy: false,
  };

  function build(doubles: GradingDoubles, canManage: boolean): { useCase: GetStudentGradesUseCase; canManageAnyGroupOfUser: jest.Mock } {
    const canManageAnyGroupOfUser: jest.Mock = jest.fn().mockResolvedValue(canManage);
    const groupsFacade: GroupsFacade = { canManageAnyGroupOfUser } as unknown as GroupsFacade;

    doubles.gradingRepository.getPublishedGradesOfUser.mockResolvedValue([view]);

    return { useCase: new GetStudentGradesUseCase(doubles.gradingRepository, doubles.gradingAccess, groupsFacade, doubles.gradingConfig), canManageAnyGroupOfUser };
  }

  it("returns every grade to an admin with the pass flag of the current passing grade", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();
    const { useCase, canManageAnyGroupOfUser } = build(doubles, false);

    const grades: EvaluationUserGrade[] = await useCase.execute(STUDENT_ID, ADMIN);

    expect(grades).toEqual([expect.objectContaining({ attemptId: "attempt-1", moduleTitle: "Basics", passed: false })]);
    expect(doubles.gradingRepository.getPublishedGradesOfUser).toHaveBeenCalledWith(STUDENT_ID, undefined);
    expect(canManageAnyGroupOfUser).not.toHaveBeenCalled();
  });

  it("limits a teacher of the student's group to the grading scope", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();
    const { useCase } = build(doubles, true);

    await useCase.execute(STUDENT_ID, TEACHER);

    expect(doubles.gradingRepository.getPublishedGradesOfUser).toHaveBeenCalledWith(STUDENT_ID, { teacherId: TEACHER.id, supervisedGroupIds: ["group-supervised"] });
  });

  it("forbids a teacher outside the student's groups", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();
    const { useCase } = build(doubles, false);

    await expect(useCase.execute(STUDENT_ID, TEACHER)).rejects.toBeInstanceOf(EvaluationStudentGradesForbiddenError);
    expect(doubles.gradingRepository.getPublishedGradesOfUser).not.toHaveBeenCalled();
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
      doubles.auditRecorder,
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
    expect(doubles.record).toHaveBeenCalledTimes(1);
    expect(doubles.record).toHaveBeenCalledWith(
      TEACHER.id,
      "grade_published",
      "evaluation_attempts",
      "attempt-1",
      { gradePublishedAt: null },
      { gradePublishedAt: first.publishedAt, grade: 5 },
      expect.anything(),
      { metadata: expect.objectContaining({ evaluationId: "evaluation-1", bulk: false }) },
    );
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
      doubles.auditRecorder,
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
    expect(doubles.record.mock.calls.map((call: unknown[]) => [call[1], call[3]])).toEqual([
      ["grade_published", "attempt-1"],
      ["grade_published", "attempt-2"],
    ]);
    expect(await publishAll(doubles)).toBe(0);
  });

  it("returns 404 for an unknown evaluation", async () => {
    const doubles: GradingDoubles = buildGradingDoubles();

    await expect(publishAll(doubles, "missing")).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });
});
