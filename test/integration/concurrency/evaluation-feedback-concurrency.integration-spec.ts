/*
 * Funcionalidad: Prueba de integración de carreras del Bloque 3 de evaluación
 * Descripción: Contra PostgreSQL real (Testcontainers) lanza en paralelo N entregas del mismo intento (una sola calificación: un solo resultado, un solo GRADED y una sola fila global de retroalimentación generada), N liberaciones de resultados del mismo intento (v1.1, ajustes C1: una sola publica la nota y libera las respuestas, con un solo evento y una sola auditoría; reemplaza la carrera de la revisión inmediata, que ya no existe) y la generación por calificación junto con una regeneración del docente (al final hay exactamente una retroalimentación global vigente en READY)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuditLog, type EvaluationAssignment, type GradeFeedback, type User } from "@prisma/client";

import { GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import { RegenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-regeneration.command";
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type PublishEvaluationAttemptGradeResult } from "@/features/evaluation/application/results/evaluation-grading.result";
import {
  type StartEvaluationAttemptResult,
  type SubmitEvaluationAttemptResult,
} from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { GenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-generation.usecase";
import { RegenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-regeneration.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { GradeFeedbackGenerationInProgressError } from "@/features/evaluation/domain/evaluation.errors";

import { assignEvaluationToGroup, createEvaluation, createStudent, createStudentGroup, createTeacher, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";
import { waitUntil } from "../../support/polling";

const CONCURRENCY: number = 8;
const FEEDBACK_TIMEOUT_MS: number = 20_000;

function overallFeedback(rows: GradeFeedback[]): GradeFeedback[] {
  return rows.filter((row: GradeFeedback) => row.questionId === null);
}

describe("evaluation block 3 races against PostgreSQL", () => {
  let harness: IntegrationApp;
  let teacher: User;
  let student: User;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    teacher = await createTeacher(harness.prisma);
    student = await createStudent(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  async function startedAttempt(evaluation: EvaluationWithQuestions): Promise<string> {
    const { group } = await createStudentGroup(harness.prisma, { members: [student], createdBy: teacher });
    const assignment: EvaluationAssignment = await assignEvaluationToGroup(harness.prisma, evaluation.evaluation, group, { assignedBy: teacher });
    const started: StartEvaluationAttemptResult = await harness.app.get(StartEvaluationAttemptUseCase).execute(
      new StartEvaluationAttemptCommand({ assignmentId: assignment.id, userId: student.id }),
    );

    return started.attempt.id;
  }

  function feedbackRows(attemptId: string): Promise<GradeFeedback[]> {
    return harness.prisma.gradeFeedback.findMany({ where: { attemptId } });
  }

  it(`should grade an attempt once when ${CONCURRENCY} submits race`, async () => {
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE", "TRUE_FALSE"] });
    const attemptId: string = await startedAttempt(evaluation);
    const useCase: SubmitEvaluationAttemptUseCase = harness.app.get(SubmitEvaluationAttemptUseCase);

    const results: PromiseSettledResult<SubmitEvaluationAttemptResult>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (): Promise<SubmitEvaluationAttemptResult> => useCase.execute(new SubmitEvaluationAttemptCommand({ attemptId, userId: student.id }))),
    );
    const values: SubmitEvaluationAttemptResult[] = results.flatMap((result: PromiseSettledResult<SubmitEvaluationAttemptResult>) => (result.status === "fulfilled" ? [result.value] : []));

    expect(values).toHaveLength(CONCURRENCY);
    expect(new Set<string>(values.map((value: SubmitEvaluationAttemptResult) => `${value.status}|${value.submittedAt?.toISOString()}`)).size).toBe(1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { id: attemptId, status: "GRADED" } })).toBe(1);

    // One grading event means one generation: a single overall row ever (superseded rows included)
    const rows: GradeFeedback[] = await waitUntil(
      () => feedbackRows(attemptId),
      (current: GradeFeedback[]) => overallFeedback(current).some((row: GradeFeedback) => row.status === "READY"),
      { timeoutMs: FEEDBACK_TIMEOUT_MS, description: "the generated feedback" },
    );

    expect(overallFeedback(rows)).toHaveLength(1);
  });

  it(`should release the results once when ${CONCURRENCY} releases race`, async () => {
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE"] });
    const attempt: { id: string } = await harness.prisma.studentEvaluationAttempt.create({
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
      },
      select: { id: true },
    });
    const useCase: PublishEvaluationAttemptGradeUseCase = harness.app.get(PublishEvaluationAttemptGradeUseCase);

    const results: PublishEvaluationAttemptGradeResult[] = await Promise.all(
      Array.from({ length: CONCURRENCY }, (): Promise<PublishEvaluationAttemptGradeResult> => useCase.execute(attempt.id, { id: teacher.id, role: "ADMIN" }, "GRADE_AND_ANSWERS")),
    );

    expect(results.filter((result: PublishEvaluationAttemptGradeResult) => !result.alreadyPublished)).toHaveLength(1);

    const stored: { gradePublishedAt: Date | null; answersReleasedAt: Date | null } = await harness.prisma.studentEvaluationAttempt.findUniqueOrThrow({
      where: { id: attempt.id },
      select: { gradePublishedAt: true, answersReleasedAt: true },
    });
    const audits: AuditLog[] = await harness.prisma.auditLog.findMany({ where: { entityId: attempt.id, action: "grade_published" } });

    expect(stored.gradePublishedAt).not.toBeNull();
    expect(stored.answersReleasedAt).toEqual(stored.gradePublishedAt);
    expect(audits).toHaveLength(1);
  });

  it("should end with exactly one current READY overall feedback when grading and a regeneration race", async () => {
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE"] });
    const attempt: { id: string } = await harness.prisma.studentEvaluationAttempt.create({
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
      select: { id: true },
    });

    const results: PromiseSettledResult<unknown>[] = await Promise.allSettled([
      harness.app.get(GenerateGradeFeedbackUseCase).execute(new GenerateGradeFeedbackCommand({ attemptId: attempt.id })),
      harness.app.get(RegenerateGradeFeedbackUseCase).execute(new RegenerateGradeFeedbackCommand({ attemptId: attempt.id, actor: { id: teacher.id, role: "ADMIN" } })),
    ]);

    // The regeneration may lose the race against the grading reservation (409); it must never fail otherwise
    for (const result of results) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(GradeFeedbackGenerationInProgressError);
      }
    }

    const rows: GradeFeedback[] = await waitUntil(
      () => feedbackRows(attempt.id),
      (current: GradeFeedback[]) => !current.some((row: GradeFeedback) => row.supersededAt === null && row.status === "PENDING"),
      { timeoutMs: FEEDBACK_TIMEOUT_MS, description: "no PENDING current feedback" },
    );
    const current: GradeFeedback[] = overallFeedback(rows).filter((row: GradeFeedback) => row.supersededAt === null);

    expect(current).toHaveLength(1);
    expect(current[0].status).toBe("READY");
  });
});
