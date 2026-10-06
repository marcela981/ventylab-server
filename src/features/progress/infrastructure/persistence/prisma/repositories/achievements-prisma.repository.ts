/*
 * Funcionalidad: Repositorio Prisma de logros
 * Descripción: Implementa IAchievementsRepository sobre la tabla Achievement y calcula las métricas de desbloqueo leyendo LessonCompletion, UserProgress y los intentos de evaluaciones QUIZ (student_evaluation_attempts, con el porcentaje y el aprobado de las rutas heredadas de quizzes; quiz_attempts queda congelada); guarda la auditoría con IAuditLogRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Achievement as AchievementModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  ACHIEVEMENT_ENTITY_COLLECTION,
  ACHIEVEMENT_ENTITY_TYPE,
  type Achievement,
} from "@/features/progress/domain/entities/achievement.entity";
import { type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import { type AchievementMetrics } from "@/features/progress/domain/services/achievement-catalog";
import { ProgressMapper } from "@/features/progress/infrastructure/persistence/prisma/mappers/progress.mapper";
import {
  PERFECT_QUIZ_PERCENT,
  QUIZ_RESULT_ATTEMPT_SCOPE,
  QUIZ_RESULT_ATTEMPT_SELECT,
  type QuizResult,
  toQuizResult,
} from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { type QuizAttemptRow } from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

@Injectable()
export class AchievementsPrismaRepository implements IAchievementsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getByUserId(userId: string, transaction?: unknown): Promise<Achievement[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: AchievementModel[] = await client.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    return rows.map((row: AchievementModel) => ProgressMapper.toAchievement(row));
  }

  public async getMetrics(userId: string): Promise<AchievementMetrics> {
    const [completedLessons, completedModules, quizAttempts, activity]: [number, number, QuizAttemptRow[], { updatedAt: Date }[]] = await Promise.all([
      this._prisma.lessonCompletion.count({ where: { userId, isCompleted: true } }),
      this._prisma.userProgress.count({ where: { userId, isModuleCompleted: true } }),
      this._prisma.studentEvaluationAttempt.findMany({ where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId }] }, select: QUIZ_RESULT_ATTEMPT_SELECT }),
      this._prisma.lessonCompletion.findMany({ where: { userId }, select: { updatedAt: true } }),
    ]);

    const results: QuizResult[] = quizAttempts.map((row: QuizAttemptRow) => toQuizResult(row));
    const passedQuizzes: number = results.filter((result: QuizResult) => result.passed).length;
    const perfectQuizzes: number = results.filter((result: QuizResult) => result.percent === PERFECT_QUIZ_PERCENT).length;

    return {
      completedLessons,
      completedModules,
      passedQuizzes,
      perfectQuizzes,
      activityDates: activity.map((row: { updatedAt: Date }) => row.updatedAt),
    };
  }

  public async save(achievement: Achievement, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.AchievementUncheckedCreateInput = ProgressMapper.toAchievementPersistence(achievement);

    await client.achievement.upsert({
      where: { id: achievement.id },
      create: data,
      update: data,
    });

    if (achievement.auditLogs.length > 0) {
      await this._auditLogRepository.save(ACHIEVEMENT_ENTITY_COLLECTION, ACHIEVEMENT_ENTITY_TYPE, achievement.id, achievement.auditLogs, transaction);
    }
  }
}
