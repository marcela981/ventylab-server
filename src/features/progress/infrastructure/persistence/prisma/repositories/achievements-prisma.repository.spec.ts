/*
 * Funcionalidad: Pruebas del repositorio Prisma de logros
 * Descripción: Verifica con un cliente Prisma simulado que las métricas de desbloqueo salgan del registro de actividad (evaluaciones aprobadas, XP total, racha) y de los intentos publicados con puntaje máximo, y que el guardado omita en conflicto por (usuario, código) y solo audite la fila insertada
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { type AchievementMetrics } from "@/features/progress/domain/services/achievement-catalog";
import { addDays, localDateToUtcMidnight, toBogotaLocalDate } from "@/features/progress/domain/services/activity-calendar";
import { AchievementsPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/achievements-prisma.repository";

interface PrismaMock {
  lessonCompletion: { count: jest.Mock };
  userProgress: { count: jest.Mock };
  learningActivityEvent: { count: jest.Mock; aggregate: jest.Mock };
  userActivityDay: { findMany: jest.Mock };
  achievement: { createMany: jest.Mock };
  $queryRaw: jest.Mock;
}

describe("AchievementsPrismaRepository", () => {
  let prisma: PrismaMock;
  let auditSave: jest.Mock;
  let repository: AchievementsPrismaRepository;

  beforeEach(() => {
    const today: string = toBogotaLocalDate(new Date());

    prisma = {
      lessonCompletion: { count: jest.fn().mockResolvedValue(4) },
      userProgress: { count: jest.fn().mockResolvedValue(1) },
      learningActivityEvent: { count: jest.fn().mockResolvedValue(3), aggregate: jest.fn().mockResolvedValue({ _sum: { xp: 1250 } }) },
      userActivityDay: {
        findMany: jest.fn().mockResolvedValue([{ localDate: localDateToUtcMidnight(addDays(today, -1)) }, { localDate: localDateToUtcMidnight(today) }]),
      },
      achievement: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $queryRaw: jest.fn().mockResolvedValue([{ evaluationId: "E1" }, { evaluationId: "E2" }]),
    };
    auditSave = jest.fn().mockResolvedValue(undefined);
    repository = new AchievementsPrismaRepository(prisma as unknown as PrismaService, { save: auditSave });
  });

  it("builds the metrics from the ledger and the published perfect attempts", async () => {
    const metrics: AchievementMetrics = await repository.getMetrics("user-1");

    expect(metrics).toEqual({ completedLessons: 4, completedModules: 1, passedEvaluations: 3, perfectEvaluations: 2, currentStreak: 2, xpTotal: 1250 });
    expect(prisma.learningActivityEvent.count).toHaveBeenCalledWith({ where: { userId: "user-1", kind: "EVALUATION_PASSED" } });
  });

  it("inserts with skipDuplicates and audits only an inserted unlock", async () => {
    const achievement: Achievement = Achievement.unlock({ userId: "user-1", code: "first_lesson", title: "Primer Paso", xpReward: 50 });

    await expect(repository.insertIfAbsent(achievement, prisma)).resolves.toBe(true);
    expect(prisma.achievement.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ code: "first_lesson", xpReward: 50 })], skipDuplicates: true });
    expect(auditSave).toHaveBeenCalledTimes(1);

    prisma.achievement.createMany.mockResolvedValue({ count: 0 });

    await expect(repository.insertIfAbsent(achievement)).resolves.toBe(false);
    expect(auditSave).toHaveBeenCalledTimes(1);
  });
});
