/*
 * Funcionalidad: Pruebas de los manejadores de eventos de progreso
 * Descripción: Verifica que cada evento alimente el registro de actividad con el tipo, la referencia y el instante correctos antes de evaluar los logros: solo la primera vista de página, lección y módulo completados, solo evaluaciones aprobadas (con la fecha de publicación) y logros con su recompensa; que un evento repetido no vuelva a evaluar logros por XP y que un fallo del registro no impida la evaluación ni propague el error
 * Versión: 0.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type RecordLearningActivityCommand } from "@/features/progress/application/commands/record-learning-activity.command";
import { type UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { type RecordLearningActivityUseCase } from "@/features/progress/application/use-cases/record-learning-activity.usecase";
import { type UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import { Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { type AchievementUnlockedEvent } from "@/features/progress/domain/events/achievement.events";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { PageViewedEvent } from "@/features/progress/domain/events/page-viewed.event";
import { ACHIEVEMENT_UNLOCKED_REALTIME_EVENT, ProgressEventsHandlers } from "@/features/progress/infrastructure/events/progress-events.handlers";

const OCCURRED_AT: Date = new Date("2026-10-28T15:00:00.000Z");

describe("ProgressEventsHandlers", () => {
  let record: jest.Mock;
  let unlock: jest.Mock;
  let emitToUser: jest.Mock;
  let handlers: ProgressEventsHandlers;

  function recorded(): Partial<RecordLearningActivityCommand>[] {
    return record.mock.calls.map(([command]: [RecordLearningActivityCommand]) => ({ ...command }));
  }

  function triggers(): string[][] {
    return unlock.mock.calls.map(([command]: [UnlockAchievementsCommand]) => command.triggers);
  }

  beforeEach(() => {
    record = jest.fn().mockResolvedValue(true);
    unlock = jest.fn().mockResolvedValue(undefined);
    emitToUser = jest.fn();
    handlers = new ProgressEventsHandlers(
      { execute: unlock } as unknown as UnlockAchievementsUseCase,
      { execute: record } as unknown as RecordLearningActivityUseCase,
      { emitToUser } as unknown as IRealtimePublisher,
    );
  });

  it("records the first view of a page and evaluates streak and XP achievements", async () => {
    await handlers.handlePageViewed(new PageViewedEvent({ userId: "U1", pageId: "P1", lessonId: "L1", moduleId: "M1", firstView: true, occurredAt: OCCURRED_AT }));

    expect(recorded()).toEqual([{ userId: "U1", kind: "PAGE_VIEWED", refId: "P1", occurredAt: OCCURRED_AT, achievementReward: 0 }]);
    expect(triggers()).toEqual([["streak_days", "level_reached"]]);
  });

  it("ignores repeated views and does not evaluate achievements for a duplicate first view", async () => {
    await handlers.handlePageViewed(new PageViewedEvent({ userId: "U1", pageId: "P1", lessonId: null, moduleId: null, firstView: false, occurredAt: OCCURRED_AT }));

    expect(record).not.toHaveBeenCalled();

    record.mockResolvedValue(false);
    await handlers.handlePageViewed(new PageViewedEvent({ userId: "U1", pageId: "P1", lessonId: null, moduleId: null, firstView: true, occurredAt: OCCURRED_AT }));

    expect(unlock).not.toHaveBeenCalled();
  });

  it("records the lesson and, when the module was completed, the module", async () => {
    const event: LessonCompletedEvent = new LessonCompletedEvent({ userId: "U1", lessonId: "L1", moduleId: "M1", moduleCompleted: true });

    await handlers.handleLessonCompleted(event);

    expect(recorded().map((command: Partial<RecordLearningActivityCommand>) => [command.kind, command.refId])).toEqual([
      ["LESSON_COMPLETED", "L1"],
      ["MODULE_COMPLETED", "M1"],
    ]);
    expect(triggers()).toEqual([["lessons_completed", "streak_days", "level_reached", "modules_completed"]]);
  });

  it("still evaluates achievements when the ledger write fails", async () => {
    record.mockRejectedValue(new Error("db down"));

    await expect(handlers.handleLessonCompleted(new LessonCompletedEvent({ userId: "U1", lessonId: "L1", moduleId: "M1", moduleCompleted: false }))).resolves.toBeUndefined();
    expect(triggers()).toEqual([["lessons_completed", "streak_days", "level_reached"]]);
  });

  it("records a passed evaluation on its publication date and ignores a failed one", async () => {
    const base: ConstructorParameters<typeof EvaluationGradePublishedEvent>[0] = {
      attemptId: "A1",
      evaluationId: "E1",
      userId: "U1",
      score: 8,
      maxScore: 10,
      grade: 4,
      passed: false,
      publishedAt: OCCURRED_AT,
    };

    await handlers.handleEvaluationGradePublished(new EvaluationGradePublishedEvent(base));
    expect(record).not.toHaveBeenCalled();

    await handlers.handleEvaluationGradePublished(new EvaluationGradePublishedEvent({ ...base, passed: true }));

    expect(recorded()).toEqual([{ userId: "U1", kind: "EVALUATION_PASSED", refId: "E1", occurredAt: OCCURRED_AT, achievementReward: 0 }]);
    expect(triggers()).toEqual([["evaluations_passed", "perfect_score", "streak_days", "level_reached"]]);
  });

  it("notifies the unlocked achievement, records its reward and evaluates XP achievements again", async () => {
    const achievement: Achievement = Achievement.unlock({ userId: "U1", code: "first_lesson", title: "Primer Paso", xpReward: 50 });
    const [event]: AchievementUnlockedEvent[] = achievement.getEvents() as AchievementUnlockedEvent[];

    await handlers.handleAchievementUnlocked(event);

    expect(emitToUser).toHaveBeenCalledWith("U1", ACHIEVEMENT_UNLOCKED_REALTIME_EVENT, expect.objectContaining({ code: "first_lesson", title: "Primer Paso", xpReward: 50 }));
    expect(recorded()).toEqual([expect.objectContaining({ kind: "ACHIEVEMENT_UNLOCKED", refId: "first_lesson", achievementReward: 50 })]);
    expect(triggers()).toEqual([["level_reached"]]);
  });
});
