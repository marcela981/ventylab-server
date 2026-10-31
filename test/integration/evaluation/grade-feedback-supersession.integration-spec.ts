/*
 * Funcionalidad: Prueba de integración de la regeneración no destructiva de la retroalimentación
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica que regenerar la retroalimentación de un intento publicado conserva la fila anterior marcada con superseded_at (su valoración, guardada con la superficie EVALUATION_FEEDBACK, sigue resolviendo su texto), que la lectura del estudiante solo devuelve las filas vigentes con su propia valoración embebida y que una segunda regeneración inmediata responde 409
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedback, type StudentEvaluationAttempt, type User } from "@prisma/client";

import { UpsertAiRatingCommand } from "@/features/ai-ratings/application/commands/upsert-ai-rating.command";
import { UpsertAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/upsert-ai-rating.usecase";
import { RegenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-regeneration.command";
import { type GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { RegenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-regeneration.usecase";
import { GetMyGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-student-read.usecase";
import { GradeFeedbackGenerationInProgressError } from "@/features/evaluation/domain/evaluation.errors";

import { createAdmin, createEvaluation, createStudent, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

describe("grade feedback supersession against PostgreSQL", () => {
  let harness: IntegrationApp;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it("keeps the rated feedback row when regenerating and embeds only current ratings", async () => {
    const admin: User = await createAdmin(harness.prisma);
    const student: User = await createStudent(harness.prisma);
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: admin, questionTypes: ["SINGLE_CHOICE"] });
    const attempt: StudentEvaluationAttempt = await harness.prisma.studentEvaluationAttempt.create({
      data: {
        evaluationId: evaluation.evaluation.id,
        userId: student.id,
        attemptNumber: 1,
        status: "GRADED",
        startedAt: new Date(Date.now() - 600_000),
        submittedAt: new Date(Date.now() - 300_000),
        score: 1,
        maxScore: 1,
        grade: 5,
        gradePublishedAt: new Date(),
      },
    });
    const old: GradeFeedback = await harness.prisma.gradeFeedback.create({
      data: { attemptId: attempt.id, content: "Retroalimentación original", source: "DETERMINISTIC", status: "READY" },
    });

    await harness.app.get(UpsertAiRatingUseCase).execute(
      new UpsertAiRatingCommand({ userId: student.id, targetType: "GRADE_FEEDBACK", targetId: old.id, surface: "EVALUATION_FEEDBACK", helpful: true, quality: 4 }),
    );

    const before: GradeFeedbackResult = await harness.app.get(GetMyGradeFeedbackUseCase).execute(attempt.id, student.id);

    expect(before.ratings.get(old.id)).toMatchObject({ helpful: true, quality: 4, surface: "EVALUATION_FEEDBACK" });

    await harness.app.get(RegenerateGradeFeedbackUseCase).execute(new RegenerateGradeFeedbackCommand({ attemptId: attempt.id, actor: { id: admin.id, role: "ADMIN" } }));

    const kept: GradeFeedback | null = await harness.prisma.gradeFeedback.findUnique({ where: { id: old.id } });
    const rating: { targetId: string } | null = await harness.prisma.aiRating.findFirst({ where: { targetType: "GRADE_FEEDBACK", targetId: old.id }, select: { targetId: true } });

    expect(kept).toMatchObject({ content: "Retroalimentación original", status: "READY", supersededAt: expect.any(Date) });
    expect(rating).not.toBeNull();

    const after: GradeFeedbackResult = await harness.app.get(GetMyGradeFeedbackUseCase).execute(attempt.id, student.id);

    expect(after.overall?.id).not.toBe(old.id);
    expect(after.ratings.has(old.id)).toBe(false);
  });

  it("answers 409 to a second regeneration while the first one is still PENDING", async () => {
    const admin: User = await createAdmin(harness.prisma);
    const student: User = await createStudent(harness.prisma);
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: admin, questionTypes: ["SINGLE_CHOICE"] });
    const attempt: StudentEvaluationAttempt = await harness.prisma.studentEvaluationAttempt.create({
      data: { evaluationId: evaluation.evaluation.id, userId: student.id, attemptNumber: 1, status: "GRADED", startedAt: new Date(), score: 1, maxScore: 1, grade: 5 },
    });

    await harness.prisma.gradeFeedback.create({ data: { attemptId: attempt.id, content: "", source: "DETERMINISTIC", status: "PENDING" } });

    await expect(
      harness.app.get(RegenerateGradeFeedbackUseCase).execute(new RegenerateGradeFeedbackCommand({ attemptId: attempt.id, actor: { id: admin.id, role: "ADMIN" } })),
    ).rejects.toBeInstanceOf(GradeFeedbackGenerationInProgressError);
  });
});
