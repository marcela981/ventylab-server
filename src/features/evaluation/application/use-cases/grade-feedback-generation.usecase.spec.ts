/*
 * Funcionalidad: Pruebas de GenerateGradeFeedbackUseCase
 * Descripción: Verifica la generación de retroalimentación de un intento calificado: reserva PENDING idempotente por intento, filas READY global y por pregunta con origen, proveedor y modelo, regeneración de una fila FAILED, descarte cuando una regeneración la reemplazó, FAILED ante un error inesperado e intentos sin calificar ignorados
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import {
  type AttemptDoubles,
  buildAttemptDoubles,
  buildStoredAttempt,
  minutesFromNow,
  publishedEvents,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import {
  feedbackGenerator,
  feedbackRecord,
  GENERATED_FEEDBACK,
  gradedAttempt,
  InMemoryGradeFeedbacksRepository,
} from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import {
  GenerateGradeFeedbackUseCase,
  type GradeFeedbackGenerationOutcome,
} from "@/features/evaluation/application/use-cases/grade-feedback-generation.usecase";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { GradeFeedbackReadyEvent } from "@/features/evaluation/domain/events/grade-feedback.events";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { type GradeFeedbackContext } from "@/features/evaluation/domain/value-objects/grade-feedback";

interface Setup {
  useCase: GenerateGradeFeedbackUseCase;
  feedbacks: InMemoryGradeFeedbacksRepository;
  generate: jest.Mock;
  doubles: AttemptDoubles;
}

function setup({
  attempt = gradedAttempt(),
  records = [],
  generate = jest.fn().mockResolvedValue(GENERATED_FEEDBACK),
}: { attempt?: StudentEvaluationAttempt; records?: GradeFeedbackRecord[]; generate?: jest.Mock } = {}): Setup {
  const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [attempt] });
  const feedbacks: InMemoryGradeFeedbacksRepository = new InMemoryGradeFeedbacksRepository(records);

  const useCase: GenerateGradeFeedbackUseCase = new GenerateGradeFeedbackUseCase(
    doubles.attemptsRepository,
    doubles.evaluationsRepository,
    feedbacks,
    feedbackGenerator(generate),
    doubles.gradingConfig,
    doubles.transactionManager,
    doubles.eventBus,
  );

  return { useCase, feedbacks, generate, doubles };
}

describe("GenerateGradeFeedbackUseCase", () => {
  it("persists the overall and per-question feedback as READY with source, provider and model", async () => {
    const { useCase, feedbacks, generate } = setup();

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.locks).toContain("evaluations:grade-feedback:attempt-1");
    expect(feedbacks.current()).toEqual([
      expect.objectContaining({ attemptId: "attempt-1", content: "Buen trabajo en general.", source: "LLM", provider: "gemini", model: "gemini-2.0-flash", status: "READY" }),
      expect.objectContaining({ attemptId: "attempt-1", questionId: "q1", content: "Correcto.", source: "LLM", provider: "gemini", status: "READY" }),
      expect.objectContaining({ attemptId: "attempt-1", questionId: "q2", content: "Revisa la PEEP.", source: "LLM", provider: "gemini", status: "READY" }),
    ]);
    expect(feedbacks.current()[0]?.questionId).toBeUndefined();

    const context: GradeFeedbackContext = generate.mock.calls[0][0] as GradeFeedbackContext;

    expect(context.passingGrade).toBe(3);
    expect(JSON.stringify(context)).not.toContain("student-1");
    expect(JSON.stringify(context)).not.toContain("attempt-1");
    expect(generate.mock.calls[0][1]).toEqual({ attemptId: "attempt-1" });
  });

  it.each(["READY", "PENDING"] as const)("skips the attempt when its overall feedback is already %s", async (status: "READY" | "PENDING") => {
    const existing: GradeFeedbackRecord = feedbackRecord({ status });
    const { useCase, feedbacks, generate } = setup({ records: [existing] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("skipped");
    expect(generate).not.toHaveBeenCalled();
    expect(feedbacks.current()).toEqual([existing]);
  });

  it("generates again when the previous feedback FAILED", async () => {
    const { useCase, feedbacks } = setup({ records: [feedbackRecord({ status: "FAILED" })] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.current().every((record: GradeFeedbackRecord) => record.status === "READY")).toBe(true);
    expect(feedbacks.current()).toHaveLength(3);
  });

  it("completes a reserved PENDING feedback without reserving again", async () => {
    const pending: GradeFeedbackRecord = feedbackRecord({ id: "pending-1", status: "PENDING", content: "", source: "DETERMINISTIC", provider: undefined, model: undefined });
    const { useCase, feedbacks } = setup({ records: [pending] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1", pendingFeedbackId: "pending-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.current()[0]).toEqual(expect.objectContaining({ id: "pending-1", status: "READY" }));
  });

  it("publishes GradeFeedbackReadyEvent under the catalog name once the feedback is stored", async () => {
    const pending: GradeFeedbackRecord = feedbackRecord({ id: "pending-1", status: "PENDING", content: "", source: "DETERMINISTIC", provider: undefined, model: undefined });
    const { useCase, doubles } = setup({ attempt: gradedAttempt({ gradePublishedAt: minutesFromNow(-1) }), records: [pending] });

    await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1", pendingFeedbackId: "pending-1" }));

    const [event] = publishedEvents(doubles, GradeFeedbackReadyEvent);

    expect(event.catalogName).toBe("grade.feedbackReady");
    expect(event.toCatalogPayload()).toEqual(expect.objectContaining({ attemptId: "attempt-1", userId: "student-1", feedbackId: "pending-1" }));
  });

  it("does not announce the feedback while the grade is unpublished (the student would get a 404)", async () => {
    const { useCase, doubles, feedbacks } = setup();

    expect(await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }))).toBe("ready");
    expect(feedbacks.current()[0]?.status).toBe("READY");
    expect(publishedEvents(doubles, GradeFeedbackReadyEvent)).toHaveLength(0);
  });

  it("treats a PENDING feedback older than 10 minutes as stale and generates again, keeping the old row superseded", async () => {
    const stale: GradeFeedbackRecord = feedbackRecord({ id: "stale-1", status: "PENDING", content: "", createdAt: minutesFromNow(-11) });
    const { useCase, feedbacks } = setup({ records: [stale] });

    expect(await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }))).toBe("ready");
    expect(feedbacks.records.find((record: GradeFeedbackRecord) => record.id === "stale-1")?.supersededAt).toBeDefined();
    expect(feedbacks.current()).toHaveLength(3);
  });

  it("replaces a READY feedback when asked to (published grade updated), superseding instead of deleting", async () => {
    const existing: GradeFeedbackRecord = feedbackRecord({ id: "old-1" });
    const { useCase, feedbacks } = setup({ records: [existing] });

    expect(await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1", replaceCurrent: true }))).toBe("ready");
    expect(feedbacks.records.find((record: GradeFeedbackRecord) => record.id === "old-1")).toEqual(expect.objectContaining({ status: "READY", supersededAt: expect.anything() }));
    expect(feedbacks.current().map((record: GradeFeedbackRecord) => record.id)).not.toContain("old-1");
  });

  it("discards the result when a regeneration replaced the pending feedback meanwhile", async () => {
    const { useCase, feedbacks, generate, doubles } = setup();
    const newer: GradeFeedbackRecord = feedbackRecord({ id: "pending-2", status: "PENDING", content: "" });

    generate.mockImplementation(async (): Promise<typeof GENERATED_FEEDBACK> => {
      await feedbacks.supersedeForAttempt("attempt-1", [newer]);

      return GENERATED_FEEDBACK;
    });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("superseded");
    expect(feedbacks.current()).toEqual([expect.objectContaining({ id: "pending-2", status: "PENDING" })]);
    expect(doubles.publish).not.toHaveBeenCalled();
  });

  it("marks the feedback FAILED and rethrows on an unexpected error", async () => {
    const { useCase, feedbacks } = setup({ generate: jest.fn().mockRejectedValue(new TypeError("boom")) });

    await expect(useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }))).rejects.toThrow(TypeError);

    expect(feedbacks.current()).toEqual([expect.objectContaining({ status: "FAILED" })]);
  });

  it("ignores attempts that are not graded", async () => {
    const { useCase, feedbacks, generate } = setup({ attempt: buildStoredAttempt({ status: "PENDING_REVIEW", submittedAt: new Date() }) });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("skipped");
    expect(generate).not.toHaveBeenCalled();
    expect(feedbacks.current()).toEqual([]);
  });

  it("fails with not found for an unknown attempt", async () => {
    const { useCase } = setup();

    await expect(useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "missing" }))).rejects.toThrow(EvaluationAttemptNotFoundError);
  });
});
