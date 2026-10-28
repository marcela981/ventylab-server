/*
 * Funcionalidad: Pruebas de UnlockAchievementsUseCase y GetUserAchievementsUseCase
 * Descripción: Verifica que solo se evalúan los logros de los disparadores recibidos y aún no desbloqueados, que se desbloquean y publican los que cumplen su condición (nivel con la fórmula única, racha y evaluaciones aprobadas), que un desbloqueo que ya insertó otra petición concurrente no publica evento, que sin candidatos no se leen métricas ni se publica nada, y que la lista de logros del usuario expone el código y el XP guardados de cada logro
 * Versión: 1.1
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
import { type AchievementConditionType, type AchievementMetrics } from "@/features/progress/domain/services/achievement-catalog";

function savedTitles(repository: jest.Mocked<IAchievementsRepository>): string[] {
  return repository.insertIfAbsent.mock.calls.map(([achievement]: [Achievement, unknown?]): string => achievement.title);
}

function unlocked(code: string, title: string = code, xpReward: number = 0): Achievement {
  return Achievement.unlock({ userId: "U1", code, title, xpReward });
}

const NO_METRICS: AchievementMetrics = { completedLessons: 0, completedModules: 0, passedEvaluations: 0, perfectEvaluations: 0, currentStreak: 0, xpTotal: 0 };

function command(triggers: AchievementConditionType[]): UnlockAchievementsCommand {
  return new UnlockAchievementsCommand({ userId: "U1", triggers });
}

describe("UnlockAchievementsUseCase", () => {
  it("unlocks and publishes the achievements of the triggered conditions that are met", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getMetrics.mockResolvedValue({ ...NO_METRICS, completedLessons: 10, completedModules: 1 });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["lessons_completed"]));

    expect(savedTitles(repository)).toEqual(["Primer Paso", "Aprendiz Dedicado"]);
    expect(repository.insertIfAbsent.mock.calls.every(([, transaction]: [Achievement, unknown?]): boolean => transaction === TEST_TRANSACTION)).toBe(true);
    expect(eventBus.published).toHaveLength(2);
    expect(eventBus.published.every((event: unknown): boolean => event instanceof AchievementUnlockedEvent)).toBe(true);
  });

  it("skips achievements the user already has", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getByUserId.mockResolvedValue([unlocked("first_lesson", "Primer Paso")]);
    repository.getMetrics.mockResolvedValue({ ...NO_METRICS, completedLessons: 10 });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["lessons_completed"]));

    expect(savedTitles(repository)).toEqual(["Aprendiz Dedicado"]);
  });

  it("unlocks level, streak and evaluation achievements from the ledger metrics", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();

    repository.getMetrics.mockResolvedValue({ ...NO_METRICS, xpTotal: 4500, currentStreak: 7, passedEvaluations: 10, perfectEvaluations: 1 });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, new RecordingEventBus()).execute(
      command(["level_reached", "streak_days", "evaluations_passed", "perfect_score"]),
    );

    expect(savedTitles(repository)).toEqual(["Puntuación Perfecta", "Maestro de Evaluaciones", "Racha Semanal", "Nivel 10"]);
  });

  it("does not unlock level 10 one XP below its threshold", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();

    repository.getMetrics.mockResolvedValue({ ...NO_METRICS, xpTotal: 4499 });

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, new RecordingEventBus()).execute(command(["level_reached"]));

    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it("publishes no event for an unlock another request inserted first", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getMetrics.mockResolvedValue({ ...NO_METRICS, completedLessons: 1 });
    repository.insertIfAbsent.mockResolvedValue(false);

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["lessons_completed"]));

    expect(savedTitles(repository)).toEqual(["Primer Paso"]);
    expect(eventBus.published).toEqual([]);
  });

  it("reads no metrics and publishes nothing when no achievement is a candidate", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    repository.getByUserId.mockResolvedValue([unlocked("first_module", "Módulo Completado")]);

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["modules_completed"]));

    expect(repository.getMetrics).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });

  it("publishes nothing when the candidates are not met", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const eventBus: RecordingEventBus = new RecordingEventBus();

    await new UnlockAchievementsUseCase(repository, PASSTHROUGH_TRANSACTION_MANAGER, eventBus).execute(command(["evaluations_passed", "perfect_score"]));

    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });
});

describe("GetUserAchievementsUseCase", () => {
  it("lists the user's achievements with their stored code and XP reward", async () => {
    const repository: jest.Mocked<IAchievementsRepository> = buildAchievementsRepository();
    const first: Achievement = unlocked("first_lesson", "Primer Paso", 50);

    repository.getByUserId.mockResolvedValue([first, unlocked("legacy:abc", "Retired title")]);

    const views: UnlockedAchievementView[] = await new GetUserAchievementsUseCase(repository).execute("U1");

    expect(views.map((view: UnlockedAchievementView): [string, string, number] => [view.code, view.title, view.xpReward])).toEqual([
      ["first_lesson", "Primer Paso", 50],
      ["legacy:abc", "Retired title", 0],
    ]);
    expect(views[0].id).toBe(first.id);
  });
});
