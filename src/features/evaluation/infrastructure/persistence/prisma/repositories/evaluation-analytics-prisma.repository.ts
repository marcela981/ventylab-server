/*
 * Funcionalidad: Repositorio Prisma EvaluationAnalyticsPrismaRepository
 * Descripción: Implementa IEvaluationAnalyticsRepository sobre PrismaService con lecturas por lotes: notas publicadas de varios usuarios en una sola consulta con IN (opcionalmente de varias evaluaciones), notas de los intentos GRADED de una evaluación, preguntas de la evaluación con el conteo de intentos calificados y los puntajes (manual sobre automático) de sus respuestas, referencia de la evaluación con sus grupos asignados e intentos de un usuario iniciados o entregados en un rango
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type EvaluationAttemptStatus, type EvaluationQuestionType, type EvaluationType, type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import {
  type EvaluationAnswerScoreView,
  type EvaluationAttemptActivityView,
  type EvaluationQuestionScoreSource,
  type EvaluationReferenceView,
  type IEvaluationAnalyticsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { earnedScore } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import {
  PUBLISHED_SELECT,
  PUBLISHED_WHERE,
  type PublishedRow,
  toPublishedView,
} from "@/features/evaluation/infrastructure/persistence/prisma/repositories/evaluation-grading-prisma.repository";

const GRADED_STATUS: EvaluationAttemptStatus = "GRADED";

interface AnswerScoreRow {
  questionId: string;
  autoScore: number | null;
  manualScore: number | null;
}

interface AttemptActivityRow {
  id: string;
  evaluationId: string;
  status: EvaluationAttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  grade: number | null;
  gradePublishedAt: Date | null;
  evaluation: { title: string };
}

function gradedWhere(evaluationId: string): Prisma.StudentEvaluationAttemptWhereInput {
  return { evaluationId, status: GRADED_STATUS, grade: { not: null } };
}

@Injectable()
export class EvaluationAnalyticsPrismaRepository implements IEvaluationAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getPublishedGradesOfUsers(userIds: readonly string[], evaluationIds?: readonly string[]): Promise<PublishedGradeView[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows: PublishedRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [{ userId: { in: [...userIds] } }, PUBLISHED_WHERE, ...(evaluationIds ? [{ evaluationId: { in: [...evaluationIds] } }] : [])] },
      select: PUBLISHED_SELECT,
      orderBy: [{ userId: "asc" }, { evaluationId: "asc" }, { attemptNumber: "asc" }],
    });

    return rows.flatMap((row: PublishedRow) => toPublishedView(row));
  }

  public async getGradedGrades(evaluationId: string): Promise<number[]> {
    const rows: { grade: number | null }[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: gradedWhere(evaluationId),
      select: { grade: true },
    });

    return rows.flatMap((row: { grade: number | null }) => (row.grade === null ? [] : [row.grade]));
  }

  public async getQuestionScoreSource(evaluationId: string): Promise<EvaluationQuestionScoreSource> {
    const [questions, gradedAttemptCount, answers]: [
      { id: string; order: number; type: EvaluationQuestionType; points: number }[],
      number,
      AnswerScoreRow[],
    ] = await Promise.all([
      this._prisma.evaluationQuestion.findMany({
        where: { evaluationId },
        select: { id: true, order: true, type: true, points: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      }),
      this._prisma.studentEvaluationAttempt.count({ where: gradedWhere(evaluationId) }),
      this._prisma.evaluationAnswer.findMany({
        where: { attempt: gradedWhere(evaluationId) },
        select: { questionId: true, autoScore: true, manualScore: true },
      }),
    ]);

    return {
      questions,
      gradedAttemptCount,
      answers: answers.map(
        (row: AnswerScoreRow): EvaluationAnswerScoreView => ({
          questionId: row.questionId,
          earned: earnedScore({ questionId: row.questionId, autoScore: row.autoScore ?? undefined, manualScore: row.manualScore ?? undefined }),
        }),
      ),
    };
  }

  public async getEvaluationReference(evaluationId: string): Promise<EvaluationReferenceView | undefined> {
    const row: { id: string; title: string; type: EvaluationType; assignments: { groupId: string }[] } | null = await this._prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, title: true, type: true, assignments: { select: { groupId: true } } },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      title: row.title,
      type: row.type,
      assignedGroupIds: [...new Set<string>(row.assignments.map((assignment: { groupId: string }) => assignment.groupId))],
    };
  }

  public async getAttemptActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<EvaluationAttemptActivityView[]> {
    const rows: AttemptActivityRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { userId, OR: [{ startedAt: { gte: from, lt: to } }, { submittedAt: { gte: from, lt: to } }] },
      select: {
        id: true,
        evaluationId: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        grade: true,
        gradePublishedAt: true,
        evaluation: { select: { title: true } },
      },
      orderBy: [{ startedAt: "desc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map(
      (row: AttemptActivityRow): EvaluationAttemptActivityView => ({
        attemptId: row.id,
        evaluationId: row.evaluationId,
        evaluationTitle: row.evaluation.title,
        status: row.status,
        startedAt: row.startedAt,
        submittedAt: row.submittedAt ?? undefined,
        publishedGrade: row.gradePublishedAt !== null && row.grade !== null ? row.grade : undefined,
      }),
    );
  }
}
