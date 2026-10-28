/*
 * Funcionalidad: Prueba de integración del progreso
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de progreso a través de UpdateStepProgressUseCase: N actualizaciones simultáneas del primer acceso de un estudiante a una lección terminan todas bien, dejan exactamente una fila de user_progress y una de lesson_completions (upsert sobre las claves únicas) y acumulan el tiempo con incrementos atómicos sin perder actualizaciones; y a través de RecordPageViewUseCase que vistas concurrentes que completan la misma lección emiten un solo LessonCompletedEvent y que primeras vistas concurrentes de una página dan un solo PageViewedEvent con firstView; y que la primera vista de una página deja una sola entrada PAGE_VIEWED de 5 XP en el registro de actividad (manejador de gamificación) y una vista repetida no añade otra. v1.1: carreras de la vista de página (Bloque 2, S5). v1.2: PAGE_VIEWED en el registro de actividad tras integrar la gamificación
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type LearningActivityEvent, type LessonCompletion, type Page, type User, type UserProgress } from "@prisma/client";

import { RecordPageViewCommand } from "@/features/progress/application/commands/record-page-view.command";
import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import { RecordPageViewUseCase } from "@/features/progress/application/use-cases/record-page-view.usecase";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { PageViewedEvent } from "@/features/progress/domain/events/page-viewed.event";

import { type ContentTree, createContentTree, createPage, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";
import { waitUntil } from "../../support/polling";

const CONCURRENCY: number = 10;
const TIME_DELTA_SECONDS: number = 7;

describe("progress against PostgreSQL", () => {
  let harness: IntegrationApp;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it(`should keep one progress row per module and lesson when ${CONCURRENCY} first updates race`, async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);
    const useCase: UpdateStepProgressUseCase = harness.app.get(UpdateStepProgressUseCase);

    const results: PromiseSettledResult<void>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (_value: unknown, index: number): Promise<void> =>
        useCase.execute(
          new UpdateStepProgressCommand({
            userId: student.id,
            moduleId: tree.module.id,
            lessonId: tree.lesson.id,
            currentStepIndex: index % 3,
            totalSteps: 3,
            timeSpentDelta: TIME_DELTA_SECONDS,
          }),
        ),
      ),
    );

    const rejected: unknown[] = results.flatMap((result: PromiseSettledResult<void>): unknown[] => (result.status === "rejected" ? [result.reason] : []));
    const moduleRows: UserProgress[] = await harness.prisma.userProgress.findMany({ where: { userId: student.id } });
    const lessonRows: LessonCompletion[] = await harness.prisma.lessonCompletion.findMany({ where: { userId: student.id } });

    expect(rejected).toEqual([]);
    expect(moduleRows).toHaveLength(1);
    expect(lessonRows).toHaveLength(1);
    expect(moduleRows[0].timeSpent).toBe(CONCURRENCY * TIME_DELTA_SECONDS);
    expect(lessonRows[0].timeSpent).toBe(CONCURRENCY * TIME_DELTA_SECONDS);
  });

  describe("page views", () => {
    let lessonEvents: LessonCompletedEvent[];
    let viewEvents: PageViewedEvent[];
    const onLesson = (event: LessonCompletedEvent): void => {
      lessonEvents.push(event);
    };
    const onView = (event: PageViewedEvent): void => {
      viewEvents.push(event);
    };

    beforeEach(() => {
      lessonEvents = [];
      viewEvents = [];
      harness.app.get(EventEmitter2).on(LessonCompletedEvent.name, onLesson);
      harness.app.get(EventEmitter2).on(PageViewedEvent.name, onView);
    });

    afterEach(() => {
      harness.app.get(EventEmitter2).off(LessonCompletedEvent.name, onLesson);
      harness.app.get(EventEmitter2).off(PageViewedEvent.name, onView);
    });

    function view(useCase: RecordPageViewUseCase, userId: string, pageId: string): Promise<unknown> {
      return useCase.execute(new RecordPageViewCommand({ userId, pageId, canManage: false }));
    }

    it(`should emit one LessonCompletedEvent when ${CONCURRENCY} views race to complete the same lesson`, async () => {
      const student: User = await createStudent(harness.prisma);
      const tree: ContentTree = await createContentTree(harness.prisma);
      const secondPage: Page = await createPage(harness.prisma, tree.lesson, tree.author);
      const useCase: RecordPageViewUseCase = harness.app.get(RecordPageViewUseCase);

      // Every page already viewed but no completion record yet: each racing view sees the lesson as just completed.
      await harness.prisma.pageProgress.createMany({
        data: [tree.page, secondPage].map((page: Page) => ({ userId: student.id, pageId: page.id, completed: true, completedAt: new Date(), lastVisitedAt: new Date() })),
      });

      const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
        Array.from({ length: CONCURRENCY }, (_value: unknown, index: number) => view(useCase, student.id, index % 2 === 0 ? tree.page.id : secondPage.id)),
      );

      expect(results.filter((result: PromiseSettledResult<unknown>) => result.status === "rejected")).toEqual([]);
      expect(lessonEvents).toHaveLength(1);
      expect(await harness.prisma.lessonCompletion.count({ where: { userId: student.id, lessonId: tree.lesson.id, isCompleted: true } })).toBe(1);
      expect(viewEvents.filter((event: PageViewedEvent) => event.firstView)).toEqual([]);
    });

    it(`should report firstView once when ${CONCURRENCY} first views of a page race`, async () => {
      const student: User = await createStudent(harness.prisma);
      const tree: ContentTree = await createContentTree(harness.prisma);
      const useCase: RecordPageViewUseCase = harness.app.get(RecordPageViewUseCase);

      const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(Array.from({ length: CONCURRENCY }, () => view(useCase, student.id, tree.page.id)));

      expect(results.filter((result: PromiseSettledResult<unknown>) => result.status === "rejected")).toEqual([]);
      expect(viewEvents).toHaveLength(CONCURRENCY);
      expect(viewEvents.filter((event: PageViewedEvent) => event.firstView)).toHaveLength(1);
      expect(viewEvents[0]).toMatchObject({ userId: student.id, pageId: tree.page.id, lessonId: tree.lesson.id, moduleId: tree.module.id });
      expect(lessonEvents).toHaveLength(1);
      expect(await harness.prisma.pageProgress.count({ where: { userId: student.id, pageId: tree.page.id } })).toBe(1);
    });

    it("should record one PAGE_VIEWED ledger entry worth 5 XP for the first view of a page only", async () => {
      const student: User = await createStudent(harness.prisma);
      const tree: ContentTree = await createContentTree(harness.prisma);
      const useCase: RecordPageViewUseCase = harness.app.get(RecordPageViewUseCase);
      const pageViews = (): Promise<LearningActivityEvent[]> =>
        harness.prisma.learningActivityEvent.findMany({ where: { userId: student.id, kind: "PAGE_VIEWED" } });

      await view(useCase, student.id, tree.page.id);

      const entries: LearningActivityEvent[] = await waitUntil(pageViews, (rows: LearningActivityEvent[]) => rows.length > 0, { description: "the PAGE_VIEWED ledger entry" });

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ kind: "PAGE_VIEWED", refId: tree.page.id, xp: 5 });
      expect(entries[0].occurredAt).toEqual(viewEvents[0].occurredAt);

      // A repeated view publishes firstView = false and leaves the ledger unchanged.
      await view(useCase, student.id, tree.page.id);
      await waitUntil(() => Promise.resolve(viewEvents.length), (count: number) => count === 2, { description: "the repeated PageViewedEvent" });

      expect(viewEvents[1].firstView).toBe(false);
      expect(await pageViews()).toHaveLength(1);
    });
  });
});
