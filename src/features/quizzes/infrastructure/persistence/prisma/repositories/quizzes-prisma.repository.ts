/*
 * Funcionalidad: Repositorio Prisma de quizzes
 * Descripción: Implementa IQuizzesRepository sobre el modelo unificado de evaluaciones (evaluations QUIZ heredadas de quizzes más el banco de evaluaciones QUIZ nuevas en READY sin asignaciones, student_evaluation_attempts y evaluation_answers) con PrismaService; las tablas quizzes y quiz_attempts quedan congeladas. El intento toma pg_advisory_xact_lock sobre la clave heredada del quiz y sobre la clave de intentos de evaluación dentro de la transacción activa. Deuda: escribe directamente las tablas de la feature de evaluación
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type QuizAttempt,
  QUIZ_ATTEMPT_ENTITY_COLLECTION,
  QUIZ_ATTEMPT_ENTITY_TYPE,
} from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import {
  type QuizAttemptSummary,
  type QuizDetail,
  type QuizSummary,
} from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type IQuizzesRepository } from "@/features/quizzes/domain/repositories/quizzes.repository";
import {
  QUIZ_ATTEMPT_LEGACY_SOURCE,
  QUIZ_LEGACY_SOURCE,
  type QuizAttemptPersistence,
  type QuizAttemptRow,
  type QuizEvaluationRow,
  type QuizQuestionRow,
  QuizzesMapper,
} from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

// Legacy quizzes in any status, plus new QUIZ evaluations that are READY and unassigned (the open bank);
// assigned evaluations are only reachable through the evaluation attempt flow
export const QUIZ_EVALUATION_SCOPE: Prisma.EvaluationWhereInput = {
  type: "QUIZ",
  OR: [
    { legacySource: QUIZ_LEGACY_SOURCE },
    { legacySource: null, status: "READY", assignments: { none: {} } },
  ],
};

// Only results already visible to the student: legacy quiz attempts, or graded attempts whose grade is published
export const QUIZ_VISIBLE_ATTEMPT_SCOPE: Prisma.StudentEvaluationAttemptWhereInput = {
  evaluation: QUIZ_EVALUATION_SCOPE,
  OR: [
    { legacySource: QUIZ_ATTEMPT_LEGACY_SOURCE },
    { status: "GRADED", gradePublishedAt: { not: null } },
  ],
};

// Same key builder as the evaluation attempt flow (evaluations:attempt:<evaluationId>:<userId>), duplicated so
// quizzes does not import evaluation domain code
function evaluationAttemptLockKey(evaluationId: string, userId: string): string {
  return `evaluations:attempt:${evaluationId}:${userId}`;
}

export function quizModuleFilter(moduleId: string): Prisma.EvaluationWhereInput {
  return { OR: [{ moduleId }, { moduleId: null, legacyModuleRef: moduleId }] };
}

// Legacy order: moduleId ascending with nulls last (PostgreSQL ASC), then order
export function compareQuizSummaries(left: QuizSummary, right: QuizSummary): number {
  if (left.moduleId !== right.moduleId) {
    if (left.moduleId === undefined) {
      return 1;
    }

    if (right.moduleId === undefined) {
      return -1;
    }

    return left.moduleId < right.moduleId ? -1 : 1;
  }

  return left.order - right.order;
}

@Injectable()
export class QuizzesPrismaRepository implements IQuizzesRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getActiveQuizzes(moduleId?: string): Promise<QuizSummary[]> {
    const conditions: Prisma.EvaluationWhereInput[] = [QUIZ_EVALUATION_SCOPE, { status: "READY" }];

    if (moduleId) {
      conditions.push(quizModuleFilter(moduleId));
    }

    const rows: QuizEvaluationRow[] = await this._findEvaluations(this._prisma, { AND: conditions });

    return rows.map((row: QuizEvaluationRow) => QuizzesMapper.toSummary(row)).sort(compareQuizSummaries);
  }

  public async getById(quizId: string, transaction?: unknown): Promise<QuizDetail | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: QuizEvaluationRow | undefined = await this._findEvaluationWithQuestions(client, { AND: [QUIZ_EVALUATION_SCOPE, { id: quizId }] });

    return row ? QuizzesMapper.toDetail(row) : undefined;
  }

  public async getAttemptsByUser(userId: string): Promise<QuizAttemptSummary[]> {
    const rows: QuizAttemptRow[] = await this._findAttempts({ AND: [QUIZ_VISIBLE_ATTEMPT_SCOPE, { userId }] });

    return rows.map((row: QuizAttemptRow) => QuizzesMapper.toAttemptSummary(row));
  }

  public async getLatestAttempt(userId: string, quizId: string): Promise<QuizAttemptSummary | undefined> {
    const [row] = await this._findAttempts({ AND: [QUIZ_VISIBLE_ATTEMPT_SCOPE, { userId, evaluationId: quizId }] }, 1);

    return row ? QuizzesMapper.toAttemptSummary(row) : undefined;
  }

  public async hasAttempt(userId: string, quizId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: { id: string } | null = await client.studentEvaluationAttempt.findFirst({
      where: { userId, evaluationId: quizId },
      select: { id: true },
    });

    return row !== null;
  }

  public async lockUserQuiz(userId: string, quizId: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const lockKey: string = `quiz_attempt:${userId}:${quizId}`;
    const evaluationLockKey: string = evaluationAttemptLockKey(quizId, userId);

    await client.$queryRaw<{ locked: number }[]>`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${lockKey}))`;

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${evaluationLockKey}))`;
  }

  public async save(attempt: QuizAttempt, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const questions: QuizQuestionRow[] = await client.evaluationQuestion.findMany({
      where: { evaluationId: attempt.quizId },
      select: {
        id: true,
        order: true,
        type: true,
        prompt: true,
        points: true,
        explanation: true,
        legacyType: true,
        legacyRef: true,
        options: {
          select: { id: true, order: true, content: true, isCorrect: true, legacyFeedback: true, legacyRef: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const last: { attemptNumber: number } | null = await client.studentEvaluationAttempt.findFirst({
      where: { evaluationId: attempt.quizId, userId: attempt.userId },
      select: { attemptNumber: true },
      orderBy: { attemptNumber: "desc" },
    });

    const data: QuizAttemptPersistence = QuizzesMapper.toAttemptPersistence(attempt, (last?.attemptNumber ?? 0) + 1, questions);

    await client.studentEvaluationAttempt.create({ data: data.attempt });

    if (data.answers.length > 0) {
      await client.evaluationAnswer.createMany({ data: data.answers });
    }

    if (attempt.auditLogs.length > 0) {
      await this._auditLogRepository.save(QUIZ_ATTEMPT_ENTITY_COLLECTION, QUIZ_ATTEMPT_ENTITY_TYPE, attempt.id, attempt.auditLogs, transaction);
    }
  }

  private async _findEvaluations(client: PrismaExecutor, where: Prisma.EvaluationWhereInput): Promise<QuizEvaluationRow[]> {
    const rows: Omit<QuizEvaluationRow, "questions">[] = await client.evaluation.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        moduleId: true,
        lessonId: true,
        durationMinutes: true,
        status: true,
        order: true,
        legacySource: true,
        legacyPassingScore: true,
        legacyModuleRef: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rows.map((row: Omit<QuizEvaluationRow, "questions">) => ({ ...row, questions: [] }));
  }

  private async _findEvaluationWithQuestions(client: PrismaExecutor, where: Prisma.EvaluationWhereInput): Promise<QuizEvaluationRow | undefined> {
    const row: QuizEvaluationRow | null = await client.evaluation.findFirst({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        moduleId: true,
        lessonId: true,
        durationMinutes: true,
        status: true,
        order: true,
        legacySource: true,
        legacyPassingScore: true,
        legacyModuleRef: true,
        createdAt: true,
        updatedAt: true,
        questions: {
          select: {
            id: true,
            order: true,
            type: true,
            prompt: true,
            points: true,
            explanation: true,
            legacyType: true,
            legacyRef: true,
            options: {
              select: { id: true, order: true, content: true, isCorrect: true, legacyFeedback: true, legacyRef: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return row ?? undefined;
  }

  private async _findAttempts(where: Prisma.StudentEvaluationAttemptWhereInput, take?: number): Promise<QuizAttemptRow[]> {
    return await this._prisma.studentEvaluationAttempt.findMany({
      where,
      select: {
        id: true,
        evaluationId: true,
        score: true,
        maxScore: true,
        submittedAt: true,
        legacySource: true,
        legacyPayload: true,
        evaluation: { select: { legacyPassingScore: true } },
      },
      orderBy: { submittedAt: "desc" },
      take,
    });
  }
}
