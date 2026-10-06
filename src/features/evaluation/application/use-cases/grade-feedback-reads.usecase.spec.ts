/*
 * Funcionalidad: Pruebas de lectura de la retroalimentación de calificación
 * Descripción: Verifica la lectura del estudiante (solo su intento y solo con la nota publicada: 404 GradeFeedbackNotAvailableError antes, check 15) y la del docente o administrador (con alcance de grupo), separando la retroalimentación global de la de cada pregunta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { type AttemptDoubles, buildAttemptDoubles, minutesFromNow, STUDENT_ID } from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { feedbackRecord, gradeFeedbackAccess, gradedAttempt, InMemoryGradeFeedbacksRepository } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { GetMyGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-student-read.usecase";
import { GetGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-teacher-read.usecase";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, GradeFeedbackForbiddenError, GradeFeedbackNotAvailableError } from "@/features/evaluation/domain/evaluation.errors";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";

const RECORDS: GradeFeedbackRecord[] = [
  feedbackRecord({ id: "overall" }),
  feedbackRecord({ id: "fq1", questionId: "q1", content: "Correcto." }),
  feedbackRecord({ id: "fq2", questionId: "q2", status: "PENDING", content: "" }),
  feedbackRecord({ id: "other", attemptId: "attempt-2" }),
];

function doublesWith(attempt: StudentEvaluationAttempt): AttemptDoubles {
  return buildAttemptDoubles({ attempts: [attempt] });
}

describe("GetMyGradeFeedbackUseCase", () => {
  it("returns 404 GradeFeedbackNotAvailableError while the grade is not published (check 15)", async () => {
    const doubles: AttemptDoubles = doublesWith(gradedAttempt({ gradePublishedAt: undefined }));
    const useCase: GetMyGradeFeedbackUseCase = new GetMyGradeFeedbackUseCase(doubles.attemptsRepository, new InMemoryGradeFeedbacksRepository(RECORDS));

    await expect(useCase.execute("attempt-1", STUDENT_ID)).rejects.toThrow(GradeFeedbackNotAvailableError);
  });

  it("returns 404 attempt not found to anyone but the owner", async () => {
    const doubles: AttemptDoubles = doublesWith(gradedAttempt({ gradePublishedAt: minutesFromNow(-1) }));
    const useCase: GetMyGradeFeedbackUseCase = new GetMyGradeFeedbackUseCase(doubles.attemptsRepository, new InMemoryGradeFeedbacksRepository(RECORDS));

    await expect(useCase.execute("attempt-1", "student-2")).rejects.toThrow(EvaluationAttemptNotFoundError);
    await expect(useCase.execute("missing", STUDENT_ID)).rejects.toThrow(EvaluationAttemptNotFoundError);
  });

  it("returns the overall and per-question feedback with their status once published", async () => {
    const doubles: AttemptDoubles = doublesWith(gradedAttempt({ gradePublishedAt: minutesFromNow(-1) }));
    const useCase: GetMyGradeFeedbackUseCase = new GetMyGradeFeedbackUseCase(doubles.attemptsRepository, new InMemoryGradeFeedbacksRepository(RECORDS));

    const result: GradeFeedbackResult = await useCase.execute("attempt-1", STUDENT_ID);

    expect(result.attemptId).toBe("attempt-1");
    expect(result.overall?.id).toBe("overall");
    expect(result.questions.map((record: GradeFeedbackRecord) => [record.id, record.status])).toEqual([
      ["fq1", "READY"],
      ["fq2", "PENDING"],
    ]);
  });
});

describe("GetGradeFeedbackUseCase", () => {
  it("returns the feedback to a teacher managing the attempt's group", async () => {
    const doubles: AttemptDoubles = doublesWith(gradedAttempt());
    const useCase: GetGradeFeedbackUseCase = new GetGradeFeedbackUseCase(
      doubles.attemptsRepository,
      new InMemoryGradeFeedbacksRepository(RECORDS),
      gradeFeedbackAccess(doubles),
    );

    const result: GradeFeedbackResult = await useCase.execute("attempt-1", { id: "teacher-9", role: "TEACHER" });

    expect(result.overall?.provider).toBe("gemini");
    expect(result.questions).toHaveLength(2);
  });

  it("forbids a teacher outside the attempt's group", async () => {
    const doubles: AttemptDoubles = doublesWith(gradedAttempt());
    const useCase: GetGradeFeedbackUseCase = new GetGradeFeedbackUseCase(
      doubles.attemptsRepository,
      new InMemoryGradeFeedbacksRepository(RECORDS),
      gradeFeedbackAccess(doubles, jest.fn().mockResolvedValue(false)),
    );

    await expect(useCase.execute("attempt-1", { id: "teacher-9", role: "TEACHER" })).rejects.toThrow(GradeFeedbackForbiddenError);
  });
});
