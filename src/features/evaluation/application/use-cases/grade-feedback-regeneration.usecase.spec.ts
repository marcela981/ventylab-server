/*
 * Funcionalidad: Pruebas de RegenerateGradeFeedbackUseCase
 * Descripción: Verifica que la regeneración (docente o administrador) reemplace la retroalimentación del intento por una fila PENDING en una transacción y pida la generación asíncrona con un evento, que respete el alcance de grupo del docente, que rechace intentos sin calificar y que devuelva 404 para intentos inexistentes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RegenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-regeneration.command";
import { type GradeFeedbackRegenerationResult } from "@/features/evaluation/application/results/grade-feedback.result";
import {
  type AttemptDoubles,
  buildAttemptDoubles,
  buildStoredAttempt,
  publishedEvents,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { feedbackRecord, gradeFeedbackAccess, gradedAttempt, InMemoryGradeFeedbacksRepository } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { RegenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-regeneration.usecase";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, GradeFeedbackAttemptNotGradedError, GradeFeedbackForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import { GradeFeedbackRegenerationRequestedEvent } from "@/features/evaluation/domain/events/grade-feedback.events";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

const TEACHER: EvaluationActor = { id: "teacher-9", role: "TEACHER" };
const ADMIN: EvaluationActor = { id: "admin-1", role: "ADMIN" };

interface Setup {
  useCase: RegenerateGradeFeedbackUseCase;
  feedbacks: InMemoryGradeFeedbacksRepository;
  doubles: AttemptDoubles;
  canManageGroup: jest.Mock;
}

function setup({ attempt = gradedAttempt(), manages = true }: { attempt?: StudentEvaluationAttempt; manages?: boolean } = {}): Setup {
  const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [attempt] });
  const feedbacks: InMemoryGradeFeedbacksRepository = new InMemoryGradeFeedbacksRepository([
    feedbackRecord({ id: "old-overall" }),
    feedbackRecord({ id: "old-q1", questionId: "q1" }),
  ]);
  const canManageGroup: jest.Mock = jest.fn().mockResolvedValue(manages);

  const useCase: RegenerateGradeFeedbackUseCase = new RegenerateGradeFeedbackUseCase(
    doubles.attemptsRepository,
    feedbacks,
    gradeFeedbackAccess(doubles, canManageGroup),
    doubles.transactionManager,
    doubles.eventBus,
  );

  return { useCase, feedbacks, doubles, canManageGroup };
}

describe("RegenerateGradeFeedbackUseCase", () => {
  it("replaces the previous feedback with one PENDING row and requests the generation", async () => {
    const { useCase, feedbacks, doubles, canManageGroup } = setup();

    const result: GradeFeedbackRegenerationResult = await useCase.execute(new RegenerateGradeFeedbackCommand({ attemptId: "attempt-1", actor: TEACHER }));

    expect(result.status).toBe("PENDING");
    expect(canManageGroup).toHaveBeenCalledWith({ id: "teacher-9", role: "TEACHER" }, "group-1");
    expect(feedbacks.locks).toEqual(["evaluations:grade-feedback:attempt-1"]);
    expect(feedbacks.records).toEqual([expect.objectContaining({ id: result.feedbackId, attemptId: "attempt-1", status: "PENDING" })]);

    const events: GradeFeedbackRegenerationRequestedEvent[] = publishedEvents(doubles, GradeFeedbackRegenerationRequestedEvent);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ attemptId: "attempt-1", feedbackId: result.feedbackId, performedBy: "teacher-9" });
  });

  it("forbids a teacher who does not manage the attempt's group", async () => {
    const { useCase, feedbacks, doubles } = setup({ manages: false });

    await expect(useCase.execute(new RegenerateGradeFeedbackCommand({ attemptId: "attempt-1", actor: TEACHER }))).rejects.toThrow(GradeFeedbackForbiddenError);

    expect(feedbacks.records).toHaveLength(2);
    expect(doubles.publish).not.toHaveBeenCalled();
  });

  it("lets an administrator regenerate without a group check", async () => {
    const { useCase, canManageGroup } = setup({ manages: false });

    const result: GradeFeedbackRegenerationResult = await useCase.execute(new RegenerateGradeFeedbackCommand({ attemptId: "attempt-1", actor: ADMIN }));

    expect(result.status).toBe("PENDING");
    expect(canManageGroup).not.toHaveBeenCalled();
  });

  it("lets the evaluation author review a migrated attempt without assignment", async () => {
    const { useCase } = setup({ attempt: gradedAttempt({ assignmentId: undefined, legacySource: "quiz" }) });

    const result: GradeFeedbackRegenerationResult = await useCase.execute(
      new RegenerateGradeFeedbackCommand({ attemptId: "attempt-1", actor: { id: "teacher-1", role: "TEACHER" } }),
    );

    expect(result.status).toBe("PENDING");
  });

  it("rejects attempts that are not graded yet", async () => {
    const { useCase } = setup({ attempt: buildStoredAttempt({ status: "PENDING_REVIEW", submittedAt: new Date() }) });

    await expect(useCase.execute(new RegenerateGradeFeedbackCommand({ attemptId: "attempt-1", actor: ADMIN }))).rejects.toThrow(GradeFeedbackAttemptNotGradedError);
  });

  it("returns 404 for an unknown attempt", async () => {
    const { useCase } = setup();

    await expect(useCase.execute(new RegenerateGradeFeedbackCommand({ attemptId: "missing", actor: ADMIN }))).rejects.toThrow(EvaluationAttemptNotFoundError);
  });
});
