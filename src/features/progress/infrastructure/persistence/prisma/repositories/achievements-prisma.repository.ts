/*
 * Funcionalidad: Repositorio Prisma de logros
 * Descripción: Implementa IAchievementsRepository sobre la tabla Achievement: inserta cada desbloqueo omitiendo en conflicto por (usuario, código), de modo que dos desbloqueos simultáneos dejan una sola fila y un solo evento, y guarda la auditoría solo del insertado con IAuditLogRepository; calcula las métricas de desbloqueo con LessonCompletion, UserProgress, el registro de actividad (evaluaciones aprobadas, XP total y racha de días de America/Bogota) y los intentos de evaluación publicados con el puntaje máximo
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Achievement as AchievementModel } from "@prisma/client";

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
import { type LocalDate, toBogotaLocalDate, utcMidnightToLocalDate } from "@/features/progress/domain/services/activity-calendar";
import { computeStreaks } from "@/features/progress/domain/services/gamification-rules";
import { EVALUATION_PASSED_ACTIVITY } from "@/features/progress/domain/value-objects/learning-activity-kind";
import { ProgressMapper } from "@/features/progress/infrastructure/persistence/prisma/mappers/progress.mapper";

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
    const [completedLessons, completedModules, passedEvaluations, perfect, xp, days]: [
      number,
      number,
      number,
      { evaluationId: string }[],
      { _sum: { xp: number | null } },
      { localDate: Date }[],
    ] = await Promise.all([
      this._prisma.lessonCompletion.count({ where: { userId, isCompleted: true } }),
      this._prisma.userProgress.count({ where: { userId, isModuleCompleted: true } }),
      this._prisma.learningActivityEvent.count({ where: { userId, kind: EVALUATION_PASSED_ACTIVITY } }),
      this._prisma.$queryRaw<{ evaluationId: string }[]>`
        SELECT DISTINCT evaluation_id AS "evaluationId" FROM student_evaluation_attempts
        WHERE user_id = ${userId} AND grade_published_at IS NOT NULL AND max_score > 0 AND score >= max_score`,
      this._prisma.learningActivityEvent.aggregate({ where: { userId }, _sum: { xp: true } }),
      this._prisma.userActivityDay.findMany({ where: { userId, eventCount: { gt: 0 } }, select: { localDate: true } }),
    ]);

    const activeDates: LocalDate[] = days.map((day: { localDate: Date }) => utcMidnightToLocalDate(day.localDate));

    return {
      completedLessons,
      completedModules,
      passedEvaluations,
      perfectEvaluations: perfect.length,
      currentStreak: computeStreaks(activeDates, toBogotaLocalDate(new Date())).current,
      xpTotal: xp._sum.xp ?? 0,
    };
  }

  public async insertIfAbsent(achievement: Achievement, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // skipDuplicates is INSERT … ON CONFLICT DO NOTHING on the (userId, code) unique index.
    const { count }: { count: number } = await client.achievement.createMany({ data: [ProgressMapper.toAchievementPersistence(achievement)], skipDuplicates: true });

    if (count === 0) {
      return false;
    }

    if (achievement.auditLogs.length > 0) {
      await this._auditLogRepository.save(ACHIEVEMENT_ENTITY_COLLECTION, ACHIEVEMENT_ENTITY_TYPE, achievement.id, achievement.auditLogs, transaction);
    }

    return true;
  }
}
