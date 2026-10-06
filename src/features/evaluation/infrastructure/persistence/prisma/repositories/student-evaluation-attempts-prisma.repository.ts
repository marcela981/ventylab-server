/*
 * Funcionalidad: Repositorio Prisma de intentos de evaluación de estudiantes
 * Descripción: Implementa IStudentEvaluationAttemptsRepository con Prisma: candados pg_advisory_xact_lock y pg_advisory_xact_lock_shared sobre hashtext(clave) en el cliente de la transacción (la misma función hash que el candado exclusivo del editor), carga de intentos con respuestas, intento en curso no heredado, contadores (todos los intentos, heredados incluidos), upsert del intento y de las respuestas cambiadas por (intento, pregunta), y vistas del listado del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type EvaluationAttemptStatus } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";
import {
  type AttemptCounters,
  type IStudentEvaluationAttemptsRepository,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import {
  STUDENT_ATTEMPT_INCLUDE,
  STUDENT_ATTEMPT_SUMMARY_SELECT,
  type StudentAttemptRow,
  type StudentAttemptSummaryRow,
  type StudentEvaluationBriefRow,
  StudentEvaluationAttemptsMapper,
} from "@/features/evaluation/infrastructure/persistence/prisma/mappers/student-evaluation-attempts.mapper";

const IN_PROGRESS_STATUS: EvaluationAttemptStatus = "IN_PROGRESS";

@Injectable()
export class StudentEvaluationAttemptsPrismaRepository implements IStudentEvaluationAttemptsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  public async acquireSharedTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // Shares the hashtext(key) space with the exclusive lock the editor takes, so structural edits wait for running submissions
    await client.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtext(${key}))`;
  }

  public async getById(id: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const row: StudentAttemptRow | null = await client.studentEvaluationAttempt.findUnique({ where: { id }, include: STUDENT_ATTEMPT_INCLUDE });

    return row ? StudentEvaluationAttemptsMapper.toDomain(row) : undefined;
  }

  public async getInProgress(evaluationId: string, userId: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: StudentAttemptRow | null = await client.studentEvaluationAttempt.findFirst({
      where: { evaluationId, userId, status: IN_PROGRESS_STATUS, legacySource: null },
      include: STUDENT_ATTEMPT_INCLUDE,
      orderBy: { attemptNumber: "desc" },
    });

    return row ? StudentEvaluationAttemptsMapper.toDomain(row) : undefined;
  }

  public async getAttemptCounters(evaluationId: string, userId: string, transaction?: unknown): Promise<AttemptCounters> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _count: { _all: number }; _max: { attemptNumber: number | null } } = await client.studentEvaluationAttempt.aggregate({
      where: { evaluationId, userId },
      _count: { _all: true },
      _max: { attemptNumber: true },
    });

    return { count: result._count._all, maxAttemptNumber: result._max.attemptNumber ?? 0 };
  }

  public async getInProgressByUser(userId: string): Promise<StudentEvaluationAttempt[]> {
    const rows: StudentAttemptRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { userId, status: IN_PROGRESS_STATUS, legacySource: null },
      include: STUDENT_ATTEMPT_INCLUDE,
    });

    return rows.map((row: StudentAttemptRow) => StudentEvaluationAttemptsMapper.toDomain(row));
  }

  public async getUserAttemptSummaries(userId: string, evaluationIds: ReadonlyArray<string>): Promise<StudentAttemptSummaryView[]> {
    if (evaluationIds.length === 0) {
      return [];
    }

    const rows: StudentAttemptSummaryRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { userId, evaluationId: { in: [...evaluationIds] } },
      select: STUDENT_ATTEMPT_SUMMARY_SELECT,
      orderBy: [{ evaluationId: "asc" }, { attemptNumber: "asc" }],
    });

    return rows.map((row: StudentAttemptSummaryRow) => StudentEvaluationAttemptsMapper.toSummary(row));
  }

  public async getStudentEvaluationBriefs(evaluationIds: ReadonlyArray<string>): Promise<StudentEvaluationBriefView[]> {
    if (evaluationIds.length === 0) {
      return [];
    }

    const rows: StudentEvaluationBriefRow[] = await this._prisma.evaluation.findMany({
      where: { id: { in: [...evaluationIds] } },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        durationMinutes: true,
        maxAttempts: true,
        showResultsImmediately: true,
        _count: { select: { questions: true } },
      },
    });

    return rows.map((row: StudentEvaluationBriefRow) => StudentEvaluationAttemptsMapper.toBrief(row));
  }

  public async save(attempt: StudentEvaluationAttempt, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.studentEvaluationAttempt.upsert({
      where: { id: attempt.id },
      create: StudentEvaluationAttemptsMapper.toCreate(attempt),
      update: StudentEvaluationAttemptsMapper.toUpdate(attempt),
    });

    for (const answer of attempt.changedAnswers) {
      await client.evaluationAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: answer.questionId } },
        create: StudentEvaluationAttemptsMapper.toAnswerCreate(attempt.id, answer),
        update: StudentEvaluationAttemptsMapper.toAnswerUpdate(answer),
      });
    }
  }
}
