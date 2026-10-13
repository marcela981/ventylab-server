/*
 * Funcionalidad: Pruebas de concurrencia de entregas e intentos
 * Descripción: Lanza en paralelo, contra PostgreSQL real, el envío repetido de un intento de evaluación, el intento repetido de un quiz y el inicio y envío repetidos de una entrega de actividad, y verifica que exactamente uno gana, el error documentado para los demás y el estado final en la base de datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment, type User } from "@prisma/client";

import { CreateActivityCommand } from "@/features/activities/application/commands/create-activity.command";
import { PublishActivityCommand } from "@/features/activities/application/commands/publish-activity.command";
import { StartSubmissionCommand } from "@/features/activities/application/commands/start-submission.command";
import { SubmitSubmissionCommand } from "@/features/activities/application/commands/submit-submission.command";
import { CreateActivityUseCase } from "@/features/activities/application/use-cases/create-activity.usecase";
import { PublishActivityUseCase } from "@/features/activities/application/use-cases/publish-activity.usecase";
import { StartSubmissionUseCase } from "@/features/activities/application/use-cases/start-submission.usecase";
import { SubmitSubmissionUseCase } from "@/features/activities/application/use-cases/submit-submission.usecase";
import { ActivitySubmissionAlreadyCompletedError } from "@/features/activities/domain/activities.errors";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type StartEvaluationAttemptResult, type SubmitEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { type StudentAnswerInput } from "@/features/evaluation/application/services/student-answer-recorder";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { AttemptQuizCommand } from "@/features/quizzes/application/commands/attempt-quiz.command";
import { AttemptQuizUseCase } from "@/features/quizzes/application/use-cases/attempt-quiz.usecase";
import { QuizAlreadyAttemptedError } from "@/features/quizzes/domain/quizzes.errors";

import { assignEvaluationToGroup, createEvaluation, createStudent, createStudentGroup, createTeacher, type EvaluationQuestionWithOptions, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 8;
const NOTIFICATION_SETTLE_MS: number = 1_500;

function fulfilledCount(results: PromiseSettledResult<unknown>[]): number {
  return results.filter((result: PromiseSettledResult<unknown>): boolean => result.status === "fulfilled").length;
}

function rejectedWith(results: PromiseSettledResult<unknown>[], errorClass: new (...args: never[]) => Error): number {
  return results.filter((result: PromiseSettledResult<unknown>): boolean => result.status === "rejected" && result.reason instanceof errorClass).length;
}

function race<T>(task: () => Promise<T>): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(Array.from({ length: CONCURRENCY }, (): Promise<T> => task()));
}

function correctAnswers(questions: readonly EvaluationQuestionWithOptions[]): StudentAnswerInput[] {
  return questions.map((question: EvaluationQuestionWithOptions): StudentAnswerInput => ({
    questionId: question.id,
    selectedOptionIds: question.options.filter((option: EvaluationQuestionWithOptions["options"][number]): boolean => option.isCorrect).map((option: EvaluationQuestionWithOptions["options"][number]): string => option.id),
  }));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, ms);
  });
}

describe("submission races against PostgreSQL", () => {
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

  it(`should close an evaluation attempt once when ${CONCURRENCY} submits race`, async () => {
    const { group } = await createStudentGroup(harness.prisma, { members: [student], createdBy: teacher });
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"] });
    const assignment: EvaluationAssignment = await assignEvaluationToGroup(harness.prisma, evaluation.evaluation, group, { assignedBy: teacher });
    const started: StartEvaluationAttemptResult = await harness.app.get(StartEvaluationAttemptUseCase).execute(new StartEvaluationAttemptCommand({ assignmentId: assignment.id, userId: student.id }));
    const useCase: SubmitEvaluationAttemptUseCase = harness.app.get(SubmitEvaluationAttemptUseCase);
    const answers: StudentAnswerInput[] = correctAnswers(evaluation.questions);

    const results: PromiseSettledResult<SubmitEvaluationAttemptResult>[] = await race(
      (): Promise<SubmitEvaluationAttemptResult> => useCase.execute(new SubmitEvaluationAttemptCommand({ attemptId: started.attempt.id, userId: student.id, answers })),
    );

    await wait(NOTIFICATION_SETTLE_MS);

    const values: SubmitEvaluationAttemptResult[] = results.flatMap((result: PromiseSettledResult<SubmitEvaluationAttemptResult>): SubmitEvaluationAttemptResult[] => (result.status === "fulfilled" ? [result.value] : []));

    expect(values).toHaveLength(CONCURRENCY);
    expect(new Set<string>(values.map((value: SubmitEvaluationAttemptResult): string => `${value.status}|${value.grade}|${value.submittedAt?.toISOString()}`)).size).toBe(1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { userId: student.id } })).toBe(1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { userId: student.id, status: "GRADED" } })).toBe(1);
    expect(await harness.prisma.notification.count({ where: { userId: student.id, type: "GRADE_PUBLISHED" } })).toBe(1);
  });

  it(`should record one quiz attempt when ${CONCURRENCY} attempts race`, async () => {
    const quiz: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE", "TRUE_FALSE"] });
    const useCase: AttemptQuizUseCase = harness.app.get(AttemptQuizUseCase);
    const answers: { questionId: string; selectedOptionId: string }[] = quiz.questions.map((question: EvaluationQuestionWithOptions) => ({ questionId: question.id, selectedOptionId: question.options[0].id }));

    const results: PromiseSettledResult<unknown>[] = await race((): Promise<unknown> => useCase.execute(new AttemptQuizCommand({ userId: student.id, quizId: quiz.evaluation.id, answers })));

    expect(fulfilledCount(results)).toBe(1);
    expect(rejectedWith(results, QuizAlreadyAttemptedError)).toBe(CONCURRENCY - 1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { userId: student.id, evaluationId: quiz.evaluation.id } })).toBe(1);
  });

  async function publishedActivity(): Promise<string> {
    const activityId: string = await harness.app.get(CreateActivityUseCase).execute(new CreateActivityCommand({ title: "Concurrency workshop", type: "WORKSHOP", maxScore: 100, performedBy: teacher.id }));

    await harness.app.get(PublishActivityUseCase).execute(new PublishActivityCommand({ activityId, performedBy: teacher.id, requesterRole: "TEACHER" }));

    return activityId;
  }

  it(`should start one activity submission when ${CONCURRENCY} starts race`, async () => {
    const activityId: string = await publishedActivity();
    const useCase: StartSubmissionUseCase = harness.app.get(StartSubmissionUseCase);

    const results: PromiseSettledResult<ActivitySubmission>[] = await race(
      (): Promise<ActivitySubmission> => useCase.execute(new StartSubmissionCommand({ activityId, userId: student.id, requesterRole: "STUDENT" })),
    );

    expect(fulfilledCount(results)).toBe(1);
    expect(rejectedWith(results, ActivitySubmissionAlreadyCompletedError)).toBe(CONCURRENCY - 1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { userId: student.id, evaluationId: activityId } })).toBe(1);
  });

  it(`should accept one activity submit when ${CONCURRENCY} submits race`, async () => {
    const activityId: string = await publishedActivity();
    const submission: ActivitySubmission = await harness.app.get(StartSubmissionUseCase).execute(new StartSubmissionCommand({ activityId, userId: student.id, requesterRole: "STUDENT" }));
    const useCase: SubmitSubmissionUseCase = harness.app.get(SubmitSubmissionUseCase);

    const results: PromiseSettledResult<void>[] = await race(
      (): Promise<void> => useCase.execute(new SubmitSubmissionCommand({ submissionId: submission.id, userId: student.id, requesterRole: "STUDENT" })),
    );

    expect(fulfilledCount(results)).toBe(1);
    expect(rejectedWith(results, ActivitySubmissionAlreadyCompletedError)).toBe(CONCURRENCY - 1);
    expect(await harness.prisma.auditLog.count({ where: { entityId: submission.id, action: { contains: "submitted" } } })).toBe(1);
  });
});
