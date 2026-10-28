/*
 * Funcionalidad: Prueba de integración del registro de actividad
 * Descripción: Contra el PostgreSQL de Testcontainers verifica el repositorio Prisma del registro de actividad: N inserciones simultáneas del mismo evento dejan una sola fila y cuentan el día una vez (ON CONFLICT DO NOTHING encadenado con el upsert del día), el día de Bogotá en el borde de medianoche, totales, días activos, calendario y actividad reciente con títulos, y el relleno histórico idempotente desde page_progress, lesson_completions, user_progress, los intentos publicados aprobados (solo la primera aprobación, con la nota mínima) y los logros
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LearningActivityEvent, type User, type UserActivityDay } from "@prisma/client";

import { RecordLearningActivityCommand } from "@/features/progress/application/commands/record-learning-activity.command";
import { RecordLearningActivityUseCase } from "@/features/progress/application/use-cases/record-learning-activity.usecase";
import { type ActivityDay, type RecentActivityItem } from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";

import { type ContentTree, createContentTree, createEvaluation, createStudent, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 10;
const PASSING_GRADE: number = 3;

describe("learning activity ledger against PostgreSQL", () => {
  let harness: IntegrationApp;
  let repository: ILearningActivityRepository;
  let recordUseCase: RecordLearningActivityUseCase;

  beforeAll(async () => {
    harness = await createIntegrationApp();
    repository = harness.app.get<ILearningActivityRepository>(LEARNING_ACTIVITY_REPOSITORY_TOKEN);
    recordUseCase = harness.app.get(RecordLearningActivityUseCase);
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it(`keeps one row and counts the day once when the same event is recorded ${CONCURRENCY} times at once`, async () => {
    const student: User = await createStudent(harness.prisma);
    const occurredAt: Date = new Date("2026-10-28T15:00:00.000Z");

    const results: boolean[] = await Promise.all(
      Array.from({ length: CONCURRENCY }, (): Promise<boolean> =>
        recordUseCase.execute(new RecordLearningActivityCommand({ userId: student.id, kind: "LESSON_COMPLETED", refId: "lesson-1", occurredAt })),
      ),
    );

    const events: LearningActivityEvent[] = await harness.prisma.learningActivityEvent.findMany({ where: { userId: student.id } });
    const days: UserActivityDay[] = await harness.prisma.userActivityDay.findMany({ where: { userId: student.id } });

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "LESSON_COMPLETED", refId: "lesson-1", xp: 50 });
    expect(days.map((day: UserActivityDay) => [day.localDate.toISOString().slice(0, 10), day.eventCount])).toEqual([["2026-10-28", 1]]);
  });

  it("files 23:59 and 00:01 Bogota on different days and aggregates totals, days and recent items", async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);
    const record = (kind: "PAGE_VIEWED" | "LESSON_COMPLETED" | "MODULE_COMPLETED", refId: string, iso: string): Promise<boolean> =>
      recordUseCase.execute(new RecordLearningActivityCommand({ userId: student.id, kind, refId, occurredAt: new Date(iso) }));

    await record("PAGE_VIEWED", tree.page.id, "2026-10-28T04:59:00.000Z");
    await record("LESSON_COMPLETED", tree.lesson.id, "2026-10-28T05:01:00.000Z");
    await record("MODULE_COMPLETED", tree.module.id, "2026-10-28T05:02:00.000Z");

    const days: ActivityDay[] = await repository.getActivityDays(student.id, "2026-10-01", "2026-10-31");
    const recent: RecentActivityItem[] = await repository.getRecent(student.id, ["LESSON_COMPLETED", "MODULE_COMPLETED"], 10);

    expect(days).toEqual([
      { date: "2026-10-27", count: 1, xp: 5 },
      { date: "2026-10-28", count: 2, xp: 250 },
    ]);
    expect(await repository.getActiveDates(student.id)).toEqual(["2026-10-27", "2026-10-28"]);
    expect(await repository.getTotals(student.id, "2026-10-28")).toEqual({ xpTotal: 255, xpToday: 250 });
    expect(recent.map((item: RecentActivityItem) => [item.kind, item.title])).toEqual([
      ["MODULE_COMPLETED", tree.module.title],
      ["LESSON_COMPLETED", tree.lesson.title],
    ]);
  });

  it("backfills historic progress once, with the first passing published attempt only", async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);
    const passed: EvaluationWithQuestions = await createEvaluation(harness.prisma, { maxAttempts: 3 });
    const failed: EvaluationWithQuestions = await createEvaluation(harness.prisma);
    const attempt = (evaluationId: string, attemptNumber: number, grade: number, publishedAt: string): Promise<unknown> =>
      harness.prisma.studentEvaluationAttempt.create({
        data: { evaluationId, userId: student.id, attemptNumber, status: "GRADED", startedAt: new Date(publishedAt), grade, gradePublishedAt: new Date(publishedAt) },
      });

    await harness.prisma.pageProgress.create({ data: { userId: student.id, pageId: tree.page.id, createdAt: new Date("2026-10-01T04:30:00.000Z") } });
    await harness.prisma.lessonCompletion.create({
      data: { userId: student.id, lessonId: tree.lesson.id, isCompleted: true, completedAt: new Date("2026-10-02T12:00:00.000Z") },
    });
    await harness.prisma.userProgress.create({
      data: { userId: student.id, moduleId: tree.module.id, isModuleCompleted: true, completedAt: new Date("2026-10-02T12:05:00.000Z") },
    });
    await attempt(passed.evaluation.id, 1, 3.5, "2026-10-05T15:00:00.000Z");
    await attempt(passed.evaluation.id, 2, 4.5, "2026-10-06T15:00:00.000Z");
    await attempt(failed.evaluation.id, 1, 2.9, "2026-10-07T15:00:00.000Z");

    const first: number = await repository.backfill({ passingGrade: PASSING_GRADE });
    const second: number = await repository.backfill({ passingGrade: PASSING_GRADE });
    const events: LearningActivityEvent[] = await harness.prisma.learningActivityEvent.findMany({ where: { userId: student.id }, orderBy: { occurredAt: "asc" } });

    expect(first).toBe(4);
    expect(second).toBe(0);
    expect(events.map((event: LearningActivityEvent) => [event.kind, event.localDate.toISOString().slice(0, 10), event.xp])).toEqual([
      ["PAGE_VIEWED", "2026-09-30", 5],
      ["LESSON_COMPLETED", "2026-10-02", 50],
      ["MODULE_COMPLETED", "2026-10-02", 200],
      ["EVALUATION_PASSED", "2026-10-05", 100],
    ]);
    expect(await repository.getActiveDates(student.id)).toEqual(["2026-09-30", "2026-10-02", "2026-10-05"]);
    expect((await harness.prisma.userActivityDay.findUniqueOrThrow({ where: { userId_localDate: { userId: student.id, localDate: new Date("2026-10-02T00:00:00.000Z") } } })).eventCount).toBe(2);
  });

  it("stores and reads the backfill version", async () => {
    await repository.setBackfillVersion("test-version");

    expect(await repository.getBackfillVersion()).toBe("test-version");
  });
});
