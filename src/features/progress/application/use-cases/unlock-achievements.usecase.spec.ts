/*
 * Funcionalidad: Pruebas de UnlockAchievementsUseCase y GetUserAchievementsUseCase
 * Descripción: Verifica que solo se evalúan los logros de los disparadores recibidos y aún no desbloqueados, que se desbloquean y publican los que cumplen su condición (incluido un logro de XP que cuenta los desbloqueados en la misma pasada), que sin candidatos no se leen métricas ni se publica nada, y que la lista de logros del usuario expone el XP de cada título
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import {
  buildAchievementsRepository,
  PASSTHROUGH_TRANSACTION_MANAGER,
  RecordingEventBus,
  TEST_TRANSACTION,
} from "@/features/progress/application/testing/progress-test-doubles-spec";
import { GetUserAchievementsUseCase } from "@/features/progress/application/use-cases/get-user-achievements.usecase";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import { Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { AchievementUnlockedEvent } from "@/features/progress/domain/events/achievement.events";
import { type UnlockedAchievementView } from "@/features/progress/domain/read-models/progress-views.read-model";
import { type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import { type AchievementConditionType } from "@/features/progress/domain/services/achievement-catalog";

function savedTitles(repository: jest.Mocked<IAchievementsRepository>): string[] {
  return repository.save.mock.calls.map(([achievement]: [Achievement, unknown?]): string => achievement.title);
}

function unlocked(title: string): Achievement {
  return Achievement.unlock({ userId: "U1", title, xpReward: 0 });
}

function command(triggers: AchievementConditionType[]): UnlockAchievementsCommand {
  return new UnlockAchievementsCommand({ userId: "U1", triggers });
}

describe("UnlockAchievementsUseCase", () => {
  it("unlocks and publishes the achievements of the triggered conditions that are met", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getMetrics.mockResolvedValue({ completedLessons: 10, completedModules: 1, passedQuizzes: 0, perfectQuizzes: 0, activityDates: [] });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["lessons_completed"]));

    expect(savedTitles(repository)).toEqual(["Primer Paso", "Aprendiz Dedicado"]);
    expect(repository.save.mock.calls.every(([, transaction]: [Achievement, unknown?]): boolean => transaction === TEST_TRANSACTION)).toBe(true);
    expect(eventBus.published).toHaveLength(2);
    expect(eventBus.published.every((event: unknown): boolean => event instanceof AchievementUnlockedEvent)).toBe(true);
  });

  it("skips achievements the user already has", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getByUserId.mockResolvedValue([unlocked("Primer Paso")]);
    repository.getMetrics.mockResolvedValue({ completedLessons: 10, completedModules: 0, passedQuizzes: 0, perfectQuizzes: 0, activityDates: [] });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["lessons_completed"]));

    expect(savedTitles(repository)).toEqual(["Aprendiz Dedicado"]);
  });

  it("counts achievements unlocked in the same pass towards an XP achievement", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();

    repository.getMetrics.mockResolvedValue({ completedLessons: 85, completedModules: 0, passedQuizzes: 0, perfectQuizzes: 0, activityDates: [] });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, new RecordingEventBus()).execute(command(["lessons_completed", "xp_reached"]));

    expect(savedTitles(repository)).toEqual(["Primer Paso", "Aprendiz Dedicado", "Estudiante Avanzado", "Nivel 10"]);
  });

  it("reads no metrics and publishes nothing when no achievement is a candidate", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getByUserId.mockResolvedValue([unlocked("Módulo Completado")]);

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["modules_completed"]));

    expect(repository.getMetrics).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });

  it("publishes nothing when the candidates are not met", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["quizzes_passed", "perfect_score"]));

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });
});

describe("GetUserAchievementsUseCase", () => {
  it("lists the user's achievements with the XP reward of each title", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const first: Achievement = unlocked("Primer Paso");

    repository.getByUserId.mockResolvedValue([first, unlocked("Retired title")]);

    const views: UnlockedAchievementView[] = await new GetUserAchievementsUseCase(repository).execute("U1");

    expect(views.map((view: UnlockedAchievementView): [string, number] => [view.title, view.xpReward])).toEqual([
      ["Primer Paso", 50],
      ["Retired title", 0],
    ]);
    expect(views[0].id).toBe(first.id);
  });
});
