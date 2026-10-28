/*
 * Funcionalidad: Pruebas de los casos de uso del registro de actividad
 * Descripción: Verifica con un repositorio simulado que el registro calcule XP y día de Bogotá (borde de medianoche) y propague si se insertó, que las estadísticas usen el día de Bogotá como hoy, que el calendario valide el rango (fechas, orden, máximo 366 días, valor por defecto), que la actividad reciente acote el límite y que el relleno histórico corra una vez por versión salvo que se fuerce
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RecordLearningActivityCommand } from "@/features/progress/application/commands/record-learning-activity.command";
import {
  BackfillLearningActivityUseCase,
  LEARNING_ACTIVITY_BACKFILL_VERSION,
} from "@/features/progress/application/use-cases/backfill-learning-activity.usecase";
import { GetActivityCalendarUseCase } from "@/features/progress/application/use-cases/get-activity-calendar.usecase";
import { GetGamificationStatsUseCase } from "@/features/progress/application/use-cases/get-gamification-stats.usecase";
import { GetRecentActivityUseCase } from "@/features/progress/application/use-cases/get-recent-activity.usecase";
import { RecordLearningActivityUseCase } from "@/features/progress/application/use-cases/record-learning-activity.usecase";
import { InvalidActivityRangeError } from "@/features/progress/domain/gamification.errors";
import { type GamificationStats } from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository } from "@/features/progress/domain/repositories/learning-activity.repository";
import { RECENT_ACTIVITY_KINDS } from "@/features/progress/domain/value-objects/learning-activity-kind";

function buildRepository(): jest.Mocked<ILearningActivityRepository> {
  return {
    record: jest.fn().mockResolvedValue(true),
    getTotals: jest.fn().mockResolvedValue({ xpTotal: 0, xpToday: 0 }),
    getActiveDates: jest.fn().mockResolvedValue([]),
    getActivityDays: jest.fn().mockResolvedValue([]),
    getRecent: jest.fn().mockResolvedValue([]),
    backfill: jest.fn().mockResolvedValue(7),
    getBackfillVersion: jest.fn().mockResolvedValue(undefined),
    setBackfillVersion: jest.fn().mockResolvedValue(undefined),
  };
}

describe("RecordLearningActivityUseCase", () => {
  it("records the XP of the kind on the Bogota day of the instant", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();
    const occurredAt: Date = new Date("2026-10-28T04:59:00.000Z");

    const inserted: boolean = await new RecordLearningActivityUseCase(repository).execute(
      new RecordLearningActivityCommand({ userId: "U1", kind: "LESSON_COMPLETED", refId: "L1", occurredAt }),
    );

    expect(inserted).toBe(true);
    expect(repository.record).toHaveBeenCalledWith({ userId: "U1", kind: "LESSON_COMPLETED", refId: "L1", xp: 50, occurredAt, localDate: "2026-10-27" });
  });

  it("records an achievement with its reward and reports a duplicate as not inserted", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    repository.record.mockResolvedValue(false);

    const inserted: boolean = await new RecordLearningActivityUseCase(repository).execute(
      new RecordLearningActivityCommand({ userId: "U1", kind: "ACHIEVEMENT_UNLOCKED", refId: "first_lesson", occurredAt: new Date("2026-10-28T12:00:00.000Z"), achievementReward: 50 }),
    );

    expect(inserted).toBe(false);
    expect(repository.record).toHaveBeenCalledWith(expect.objectContaining({ xp: 50, localDate: "2026-10-28" }));
  });
});

describe("GetGamificationStatsUseCase", () => {
  it("uses the Bogota day as today for XP and streak", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    repository.getTotals.mockResolvedValue({ xpTotal: 505, xpToday: 5 });
    repository.getActiveDates.mockResolvedValue(["2026-10-26", "2026-10-27"]);

    // 2026-10-28 03:00 UTC is still 2026-10-27 in Bogota, so the streak ends today.
    const stats: GamificationStats = await new GetGamificationStatsUseCase(repository).execute("U1", new Date("2026-10-28T03:00:00.000Z"));

    expect(repository.getTotals).toHaveBeenCalledWith("U1", "2026-10-27");
    expect(stats).toEqual({ xpTotal: 505, level: 2, xpIntoLevel: 5, nextLevelXp: 1000, streakDays: 2, longestStreak: 2, xpToday: 5 });
  });
});

describe("GetActivityCalendarUseCase", () => {
  it("reads the requested inclusive range", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    repository.getActivityDays.mockResolvedValue([{ date: "2026-10-27", count: 2, xp: 55 }]);

    await expect(new GetActivityCalendarUseCase(repository).execute("U1", { from: "2026-10-01", to: "2026-10-31" })).resolves.toEqual([
      { date: "2026-10-27", count: 2, xp: 55 },
    ]);
    expect(repository.getActivityDays).toHaveBeenCalledWith("U1", "2026-10-01", "2026-10-31");
  });

  it("defaults to the 366 days ending today in Bogota", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    await new GetActivityCalendarUseCase(repository).execute("U1", {}, new Date("2026-10-28T04:00:00.000Z"));

    expect(repository.getActivityDays).toHaveBeenCalledWith("U1", "2025-10-27", "2026-10-27");
  });

  it("accepts exactly 366 days and rejects 367", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();
    const useCase: GetActivityCalendarUseCase = new GetActivityCalendarUseCase(repository);

    await expect(useCase.execute("U1", { from: "2025-10-28", to: "2026-10-28" })).resolves.toEqual([]);
    await expect(useCase.execute("U1", { from: "2025-10-27", to: "2026-10-28" })).rejects.toBeInstanceOf(InvalidActivityRangeError);
  });

  it.each([
    ["from after to", "2026-10-29", "2026-10-28"],
    ["an impossible date", "2026-02-30", "2026-03-01"],
    ["a malformed date", "2026-10-1", "2026-10-28"],
  ])("rejects %s", async (_case: string, from: string, to: string) => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    await expect(new GetActivityCalendarUseCase(repository).execute("U1", { from, to })).rejects.toBeInstanceOf(InvalidActivityRangeError);
    expect(repository.getActivityDays).not.toHaveBeenCalled();
  });
});

describe("GetRecentActivityUseCase", () => {
  it.each([
    [undefined, 10],
    [3, 3],
    [0, 1],
    [500, 50],
  ])("bounds the limit %p to %i and lists milestone kinds only", async (limit: number | undefined, expected: number) => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    await new GetRecentActivityUseCase(repository).execute("U1", limit);

    expect(repository.getRecent).toHaveBeenCalledWith("U1", RECENT_ACTIVITY_KINDS, expected);
    expect(RECENT_ACTIVITY_KINDS).not.toContain("PAGE_VIEWED");
  });
});

describe("BackfillLearningActivityUseCase", () => {
  it("runs the backfill and stores the version the first time", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    await expect(new BackfillLearningActivityUseCase(repository).execute({ passingGrade: 3 })).resolves.toEqual({ skipped: false, inserted: 7 });
    expect(repository.backfill).toHaveBeenCalledWith({ passingGrade: 3 });
    expect(repository.setBackfillVersion).toHaveBeenCalledWith(LEARNING_ACTIVITY_BACKFILL_VERSION);
  });

  it("skips when the current version already ran, unless forced", async () => {
    const repository: jest.Mocked<ILearningActivityRepository> = buildRepository();

    repository.getBackfillVersion.mockResolvedValue(LEARNING_ACTIVITY_BACKFILL_VERSION);

    await expect(new BackfillLearningActivityUseCase(repository).execute({ passingGrade: 3 })).resolves.toEqual({ skipped: true, inserted: 0 });
    expect(repository.backfill).not.toHaveBeenCalled();

    await expect(new BackfillLearningActivityUseCase(repository).execute({ passingGrade: 3, force: true })).resolves.toEqual({ skipped: false, inserted: 7 });
  });
});
