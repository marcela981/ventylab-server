/*
 * Funcionalidad: Pruebas de RecordLessonProgressUseCase y UpdateStepProgressUseCase
 * Descripción: Verifica que un progreso de lección con referencia desconocida se ignora, que los datos de paso se delegan al avance por pasos (índice base cero acotado al último paso, conserva la finalización previa y el mejor puntaje), que completar una lección guarda la finalización, refresca los contadores del módulo y publica LessonCompletedEvent solo la primera vez, y que una lección ya completada no vuelve a quedar incompleta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { RecordLessonProgressCommand } from "@/features/progress/application/commands/record-lesson-progress.command";
import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import {
  buildProgressQueriesRepository,
  buildProgressRepository,
  lessonCompletion,
  PASSTHROUGH_TRANSACTION_MANAGER,
  RecordingEventBus,
  TEST_TRANSACTION,
} from "@/features/progress/application/testing/progress-test-doubles-spec";
import { RecordLessonProgressUseCase } from "@/features/progress/application/use-cases/record-lesson-progress.usecase";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { type IProgressQueriesRepository } from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";

interface Harness {
  progress: jest.Mocked<IProgressRepository>;
  queries: jest.Mocked<IProgressQueriesRepository>;
  eventBus: RecordingEventBus;
  recordUseCase: RecordLessonProgressUseCase;
  stepUseCase: UpdateStepProgressUseCase;
}

function buildHarness(): Harness {
  const progress: jest.Mocked<IProgressRepository> = buildProgressRepository();
  const queries: jest.Mocked<IProgressQueriesRepository> = buildProgressQueriesRepository();
  const eventBus: RecordingEventBus = new RecordingEventBus();
  const stepUseCase: UpdateStepProgressUseCase = new UpdateStepProgressUseCase(progress, queries, PASSTHROUGH_TRANSACTION_MANAGER);

  return { progress, queries, eventBus, stepUseCase, recordUseCase: new RecordLessonProgressUseCase(progress, queries, PASSTHROUGH_TRANSACTION_MANAGER, eventBus, stepUseCase) };
}

function record(overrides: Partial<ConstructorParameters<typeof RecordLessonProgressCommand>[0]> = {}): RecordLessonProgressCommand {
  return new RecordLessonProgressCommand({ userId: "U1", lessonReference: "lesson-slug", completed: false, timeSpent: 20, ...overrides });
}

describe("RecordLessonProgressUseCase", () => {
  it("ignores progress for a lesson reference that cannot be resolved", async () => {
    const { progress, queries, recordUseCase, eventBus } = buildHarness();

    queries.resolveLessonReference.mockResolvedValue(undefined);

    await recordUseCase.execute(record({ completed: true }));

    expect(progress.saveLessonCompletion).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });

  it("delegates step data to the step progress with a zero-based index", async () => {
    const { progress, recordUseCase } = buildHarness();

    await recordUseCase.execute(record({ currentStep: 3, totalSteps: 5, quizScore: 70 }));

    expect(progress.saveLessonCompletion).toHaveBeenCalledWith(
      { userId: "U1", lessonId: "L1", currentStepIndex: 2, totalSteps: 5, timeSpentDelta: 20, isCompleted: false, stampCompletedAt: false, quizScore: { best: 70, last: 70 } },
      TEST_TRANSACTION,
    );
    expect(progress.touchModuleAccess).toHaveBeenCalledWith({ userId: "U1", moduleId: "M1", lessonId: "L1", timeSpentDelta: 20, markInProgress: true }, TEST_TRANSACTION);
  });

  it("completes a lesson once, refreshing the module counters and publishing the event", async () => {
    const { progress, recordUseCase, eventBus } = buildHarness();

    progress.refreshModuleCounters.mockResolvedValue({ status: "COMPLETED", isModuleCompleted: true, completedLessonsCount: 1, totalLessons: 1, progressPercentage: 100 });

    await recordUseCase.execute(record({ completed: true }));

    expect(progress.saveLessonCompletion).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: true, stampCompletedAt: true }), TEST_TRANSACTION);
    expect(progress.touchModuleAccess).toHaveBeenCalledWith(expect.objectContaining({ markInProgress: false }), TEST_TRANSACTION);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]).toBeInstanceOf(LessonCompletedEvent);
    expect(eventBus.published[0]).toMatchObject({ userId: "U1", lessonId: "L1", moduleId: "M1", moduleCompleted: true });
  });

  it("does not publish again nor undo the completion of an already completed lesson", async () => {
    const { progress, recordUseCase, eventBus } = buildHarness();

    progress.getLessonCompletion.mockResolvedValue(lessonCompletion("L1", { isCompleted: true, bestQuizScore: 90 }));

    await recordUseCase.execute(record({ completed: false, quizScore: 50 }));

    expect(progress.saveLessonCompletion).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: true, quizScore: { best: 90, last: 50 } }), TEST_TRANSACTION);
    expect(progress.refreshModuleCounters).toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });

  it("only records time for an incomplete lesson", async () => {
    const { progress, recordUseCase, eventBus } = buildHarness();

    await recordUseCase.execute(record());

    expect(progress.saveLessonCompletion).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: false, stampCompletedAt: false, quizScore: undefined }), TEST_TRANSACTION);
    expect(progress.refreshModuleCounters).not.toHaveBeenCalled();
    expect(eventBus.published).toEqual([]);
  });
});

describe("UpdateStepProgressUseCase", () => {
  function step(overrides: Partial<ConstructorParameters<typeof UpdateStepProgressCommand>[0]> = {}): UpdateStepProgressCommand {
    return new UpdateStepProgressCommand({ userId: "U1", moduleId: "M1", lessonId: "L1", currentStepIndex: 1, totalSteps: 4, timeSpentDelta: 5, ...overrides });
  }

  it("rejects a lesson that cannot be resolved", async () => {
    const { queries, stepUseCase, progress } = buildHarness();

    queries.resolveLessonReference.mockResolvedValue(undefined);

    await expect(stepUseCase.execute(step())).rejects.toBeInstanceOf(LessonNotFoundError);
    expect(progress.saveLessonCompletion).not.toHaveBeenCalled();
  });

  it("clamps the step index to the last step and keeps an earlier completion", async () => {
    const { progress, stepUseCase } = buildHarness();

    progress.getLessonCompletion.mockResolvedValue(lessonCompletion("L1", { isCompleted: true }));

    await stepUseCase.execute(step({ currentStepIndex: 9, totalSteps: 4 }));

    expect(progress.saveLessonCompletion).toHaveBeenCalledWith(expect.objectContaining({ currentStepIndex: 3, isCompleted: true, stampCompletedAt: false }), TEST_TRANSACTION);
  });
});
