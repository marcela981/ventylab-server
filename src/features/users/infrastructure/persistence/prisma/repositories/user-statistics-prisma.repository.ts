/*
 * Funcionalidad: Repositorio UserStatisticsPrismaRepository
 * Descripción: Implementa IUserStatisticsRepository con consultas Prisma de lecciones, logros e intentos de evaluaciones QUIZ (student_evaluation_attempts con el porcentaje de las rutas heredadas de quizzes; quiz_attempts queda congelada)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  QUIZ_RESULT_ATTEMPT_SCOPE,
  QUIZ_RESULT_ATTEMPT_SELECT,
  type QuizResult,
  toQuizResult,
} from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { type QuizAttemptRow } from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";
import { type IUserStatisticsRepository } from "@/features/users/domain/repositories/user-statistics.repository";
import { StudentProgressSummary, UserStats } from "@/features/users/domain/value-objects/user-stats";

@Injectable()
export class UserStatisticsPrismaRepository implements IUserStatisticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getUserStats(userId: string): Promise<UserStats> {
    const [totalLessons, completedLessons, totalAchievements, quizAttempts]: [number, number, number, QuizAttemptRow[]] = await Promise.all([
      this._prisma.lessonCompletion.count({ where: { userId } }),
      this._prisma.lessonCompletion.count({ where: { userId, isCompleted: true } }),
      this._prisma.achievement.count({ where: { userId } }),
      this._prisma.studentEvaluationAttempt.findMany({ where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId }] }, select: QUIZ_RESULT_ATTEMPT_SELECT }),
    ]);

    const percents: number[] = quizAttempts.map((row: QuizAttemptRow) => toQuizResult(row)).map((result: QuizResult) => result.percent);
    const percentSum: number = percents.reduce((sum: number, percent: number) => sum + percent, 0);

    return new UserStats({
      totalLessons,
      completedLessons,
      totalAchievements,
      totalQuizAttempts: percents.length,
      averageQuizScore: percents.length > 0 ? percentSum / percents.length : 0,
    });
  }

  public async getStudentProgressSummaries(studentIds: string[]): Promise<StudentProgressSummary[]> {
    if (studentIds.length === 0) {
      return [];
    }

    const [allRows, completedRows] = await Promise.all([
      this._prisma.lessonCompletion.groupBy({
        by: ["userId"],
        where: { userId: { in: studentIds } },
        _count: { _all: true },
        _sum: { timeSpent: true },
        _max: { lastAccessed: true },
      }),
      this._prisma.lessonCompletion.groupBy({
        by: ["userId"],
        where: { userId: { in: studentIds }, isCompleted: true },
        _count: { _all: true },
      }),
    ]);

    const completedByStudentId: Map<string, number> = new Map(
      completedRows.map((row: { userId: string; _count: { _all: number } }): [string, number] => [row.userId, row._count._all]),
    );

    return allRows.map(
      (row: {
        userId: string;
        _count: { _all: number };
        _sum: { timeSpent: number | null };
        _max: { lastAccessed: Date | null };
      }) =>
        new StudentProgressSummary({
          studentId: row.userId,
          completedLessons: completedByStudentId.get(row.userId) ?? 0,
          totalLessons: row._count._all,
          totalTimeSpent: row._sum.timeSpent ?? 0,
          lastAccess: row._max.lastAccessed ?? undefined,
        }),
    );
  }
}
