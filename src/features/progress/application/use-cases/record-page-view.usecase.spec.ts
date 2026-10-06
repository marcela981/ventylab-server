/*
 * Funcionalidad: Pruebas de RecordPageViewUseCase
 * Descripción: Verifica que la vista de la última página completa la lección una sola vez (LessonCompletion y LessonCompletedEvent), que repetir la vista es idempotente, que no se degrada una completitud previa y que el contenido no visible responde 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { RecordPageViewCommand } from "@/features/progress/application/commands/record-page-view.command";
import { RecordPageViewUseCase } from "@/features/progress/application/use-cases/record-page-view.usecase";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { type PageViewResult, type PageViewSnapshot } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository } from "@/features/progress/domain/repositories/learning-progress.repository";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";

const FIRST_VIEW: Date = new Date("2026-10-01T10:00:00.000Z");

interface Harness {
  useCase: RecordPageViewUseCase;
  learning: jest.Mocked<ILearningProgressRepository>;
  publish: jest.Mock;
}

function buildHarness(fact: LessonCompletionFact | undefined, existing?: PageViewSnapshot, chainStatus: "PUBLISHED" | "DRAFT" = "PUBLISHED"): Harness {
  const learning: jest.Mocked<ILearningProgressRepository> = {
    getProgressSource: jest.fn(),
    getPageViewTarget: jest.fn().mockResolvedValue({ target: { pageId: "P3", moduleId: "M1", lessonId: "L1" }, chain: ["PUBLISHED", "PUBLISHED", "PUBLISHED", "PUBLISHED", chainStatus] }),
    getPageView: jest.fn().mockResolvedValue(existing),
    savePageView: jest.fn().mockResolvedValue({ pageId: "P3", completed: true, firstViewedAt: existing?.firstViewedAt ?? FIRST_VIEW, lastVisitedAt: FIRST_VIEW }),
    getLessonFacts: jest.fn().mockResolvedValue(fact ? [fact] : []),
    markLessonCompleted: jest.fn().mockResolvedValue(undefined),
  };
  const progress: IProgressRepository = {
    refreshModuleCounters: jest.fn().mockResolvedValue({ status: "COMPLETED", isModuleCompleted: true, completedLessonsCount: 1, totalLessons: 1, progressPercentage: 100 }),
  } as unknown as IProgressRepository;
  const transactionManager: ITransactionManager = { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work("tx") };
  const publish: jest.Mock = jest.fn();
  const eventBus: IEventBus = { publish };

  return { useCase: new RecordPageViewUseCase(learning, progress, transactionManager, eventBus), learning, publish };
}

function lessonFact(overrides: Partial<LessonCompletionFact>): LessonCompletionFact {
  return { lessonId: "L1", moduleId: "M1", publishedPageCount: 3, viewedPageCount: 3, hasCompletionRecord: false, ...overrides };
}

const COMMAND: RecordPageViewCommand = new RecordPageViewCommand({ userId: "U1", pageId: "P3", canManage: false });

describe("RecordPageViewUseCase", () => {
  it("completes the lesson in the same transaction when the last page is viewed", async () => {
    const { useCase, learning, publish } = buildHarness(lessonFact({}));

    const result: PageViewResult = await useCase.execute(COMMAND);

    expect(learning.markLessonCompleted).toHaveBeenCalledWith("U1", "L1", expect.any(Date), "tx");
    expect(result).toMatchObject({ lessonCompleted: true, lessonJustCompleted: true, viewedPages: 3, totalPages: 3 });
    expect(publish).toHaveBeenCalledWith([expect.any(LessonCompletedEvent)]);
    expect((publish.mock.calls[0] as [LessonCompletedEvent[]])[0][0]).toMatchObject({ userId: "U1", lessonId: "L1", moduleId: "M1", moduleCompleted: true });
  });

  it("is idempotent when the page is viewed again", async () => {
    const existing: PageViewSnapshot = { pageId: "P3", completed: true, firstViewedAt: FIRST_VIEW, lastVisitedAt: FIRST_VIEW };
    const { useCase, learning, publish } = buildHarness(lessonFact({ hasCompletionRecord: true }), existing);

    const result: PageViewResult = await useCase.execute(COMMAND);

    expect(learning.savePageView).toHaveBeenCalledWith("U1", "P3", { lastVisitedAt: expect.any(Date) }, "tx");
    expect(learning.markLessonCompleted).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    expect(result).toMatchObject({ firstViewedAt: FIRST_VIEW, lessonCompleted: true, lessonJustCompleted: false });
  });

  it("keeps an earlier completion even when pages are still unviewed", async () => {
    const { useCase, learning } = buildHarness(lessonFact({ viewedPageCount: 1, hasCompletionRecord: true }));

    const result: PageViewResult = await useCase.execute(COMMAND);

    expect(learning.markLessonCompleted).not.toHaveBeenCalled();
    expect(result.lessonCompleted).toBe(true);
  });

  it("does not complete a lesson with zero published pages", async () => {
    const { useCase, learning, publish } = buildHarness(lessonFact({ publishedPageCount: 0, viewedPageCount: 0 }));

    const result: PageViewResult = await useCase.execute(COMMAND);

    expect(learning.markLessonCompleted).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    expect(result.lessonCompleted).toBe(false);
  });

  it("answers 404 when a student views an unpublished page", async () => {
    const { useCase, learning } = buildHarness(lessonFact({}), undefined, "DRAFT");

    const action: Promise<PageViewResult> = useCase.execute(COMMAND);

    await expect(action).rejects.toBeInstanceOf(PageNotFoundError);
    expect(learning.savePageView).not.toHaveBeenCalled();
  });
});
