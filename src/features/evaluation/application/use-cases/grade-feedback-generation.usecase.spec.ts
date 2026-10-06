/*
 * Funcionalidad: Pruebas de GenerateGradeFeedbackUseCase
 * Descripción: Verifica la generación de retroalimentación de un intento calificado: reserva PENDING idempotente por intento, filas READY global y por pregunta con origen, proveedor y modelo, regeneración de una fila FAILED, descarte cuando una regeneración la reemplazó, FAILED ante un error inesperado e intentos sin calificar ignorados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import { type AttemptDoubles, buildAttemptDoubles, buildStoredAttempt } from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
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
  );

  return { useCase, feedbacks, generate, doubles };
}

describe("GenerateGradeFeedbackUseCase", () => {
  it("persists the overall and per-question feedback as READY with source, provider and model", async () => {
    const { useCase, feedbacks, generate } = setup();

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.locks).toContain("evaluations:grade-feedback:attempt-1");
    expect(feedbacks.records).toEqual([
      expect.objectContaining({ attemptId: "attempt-1", content: "Buen trabajo en general.", source: "LLM", provider: "gemini", model: "gemini-2.0-flash", status: "READY" }),
      expect.objectContaining({ attemptId: "attempt-1", questionId: "q1", content: "Correcto.", source: "LLM", provider: "gemini", status: "READY" }),
      expect.objectContaining({ attemptId: "attempt-1", questionId: "q2", content: "Revisa la PEEP.", source: "LLM", provider: "gemini", status: "READY" }),
    ]);
    expect(feedbacks.records[0]?.questionId).toBeUndefined();

    const context: GradeFeedbackContext = generate.mock.calls[0][0] as GradeFeedbackContext;

    expect(context.passingGrade).toBe(3);
    expect(JSON.stringify(context)).not.toContain("student-1");
  });

  it.each(["READY", "PENDING"] as const)("skips the attempt when its overall feedback is already %s", async (status: "READY" | "PENDING") => {
    const existing: GradeFeedbackRecord = feedbackRecord({ status });
    const { useCase, feedbacks, generate } = setup({ records: [existing] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("skipped");
    expect(generate).not.toHaveBeenCalled();
    expect(feedbacks.records).toEqual([existing]);
  });

  it("generates again when the previous feedback FAILED", async () => {
    const { useCase, feedbacks } = setup({ records: [feedbackRecord({ status: "FAILED" })] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.records.every((record: GradeFeedbackRecord) => record.status === "READY")).toBe(true);
    expect(feedbacks.records).toHaveLength(3);
  });

  it("completes a reserved PENDING feedback without reserving again", async () => {
    const pending: GradeFeedbackRecord = feedbackRecord({ id: "pending-1", status: "PENDING", content: "", source: "DETERMINISTIC", provider: undefined, model: undefined });
    const { useCase, feedbacks } = setup({ records: [pending] });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1", pendingFeedbackId: "pending-1" }));

    expect(outcome).toBe("ready");
    expect(feedbacks.records[0]).toEqual(expect.objectContaining({ id: "pending-1", status: "READY" }));
  });

  it("discards the result when a regeneration replaced the pending feedback meanwhile", async () => {
    const { useCase, feedbacks, generate } = setup();
    const newer: GradeFeedbackRecord = feedbackRecord({ id: "pending-2", status: "PENDING", content: "" });

    generate.mockImplementation(async (): Promise<typeof GENERATED_FEEDBACK> => {
      await feedbacks.replaceForAttempt("attempt-1", [newer]);

      return GENERATED_FEEDBACK;
    });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("superseded");
    expect(feedbacks.records).toEqual([expect.objectContaining({ id: "pending-2", status: "PENDING" })]);
  });

  it("marks the feedback FAILED and rethrows on an unexpected error", async () => {
    const { useCase, feedbacks } = setup({ generate: jest.fn().mockRejectedValue(new TypeError("boom")) });

    await expect(useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }))).rejects.toThrow(TypeError);

    expect(feedbacks.records).toEqual([expect.objectContaining({ status: "FAILED" })]);
  });

  it("ignores attempts that are not graded", async () => {
    const { useCase, feedbacks, generate } = setup({ attempt: buildStoredAttempt({ status: "PENDING_REVIEW", submittedAt: new Date() }) });

    const outcome: GradeFeedbackGenerationOutcome = await useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1" }));

    expect(outcome).toBe("skipped");
    expect(generate).not.toHaveBeenCalled();
    expect(feedbacks.records).toEqual([]);
  });

  it("fails with not found for an unknown attempt", async () => {
    const { useCase } = setup();

    await expect(useCase.execute(new GenerateGradeFeedbackCommand({ attemptId: "missing" }))).rejects.toThrow(EvaluationAttemptNotFoundError);
  });
});
