/*
 * Funcionalidad: Pruebas del repositorio Prisma ProgressAnalyticsPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que los hechos de completitud de varios usuarios salen de un número fijo de lecturas (estructura, lecciones con conteo de páginas publicadas, vistas y completitudes con IN) independiente del número de usuarios, y que cuenta por usuario y lección las páginas vistas y los registros de completitud; y que la última actividad de varios usuarios sale de una sola consulta $queryRaw parametrizada sobre páginas y lecciones, descarta usuarios sin fecha y no consulta sin usuarios
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type UserProgressLastActivity, type UsersProgressSource } from "@/features/progress/domain/repositories/progress-analytics.repository";
import { ProgressAnalyticsPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/progress-analytics-prisma.repository";

interface PrismaMock {
  section: { findMany: jest.Mock };
  level: { findMany: jest.Mock };
  module: { findMany: jest.Mock };
  lesson: { findMany: jest.Mock };
  pageProgress: { findMany: jest.Mock };
  lessonCompletion: { findMany: jest.Mock };
}

function buildPrisma(): PrismaMock {
  return {
    section: { findMany: jest.fn().mockResolvedValue([{ id: "section-1", levels: [{ id: "level-1" }] }]) },
    level: { findMany: jest.fn().mockResolvedValue([{ id: "level-1", sectionId: "section-1", modules: [{ id: "module-1" }] }]) },
    module: { findMany: jest.fn().mockResolvedValue([{ id: "module-1", levelId: "level-1" }]) },
    lesson: {
      findMany: jest.fn().mockResolvedValue([
        { id: "lesson-1", moduleId: "module-1", module: { levelId: "level-1", level: { sectionId: "section-1" } }, _count: { pages: 2 } },
        { id: "lesson-2", moduleId: "module-1", module: { levelId: "level-1", level: { sectionId: "section-1" } }, _count: { pages: 0 } },
      ]),
    },
    pageProgress: {
      findMany: jest.fn().mockResolvedValue([
        { userId: "student-1", page: { lessonId: "lesson-1" } },
        { userId: "student-1", page: { lessonId: "lesson-1" } },
        { userId: "student-2", page: { lessonId: "lesson-1" } },
      ]),
    },
    lessonCompletion: { findMany: jest.fn().mockResolvedValue([{ userId: "student-2", lessonId: "lesson-2" }]) },
  };
}

function totalCalls(prisma: PrismaMock): number {
  return Object.values(prisma).reduce((total: number, delegate: { findMany: jest.Mock }) => total + delegate.findMany.mock.calls.length, 0);
}

describe("ProgressAnalyticsPrismaRepository", () => {
  it("builds the facts of every user with six reads whatever the number of users", async () => {
    const few: PrismaMock = buildPrisma();
    const many: PrismaMock = buildPrisma();
    const userIds: string[] = Array.from({ length: 30 }, (_value: unknown, index: number) => `student-${index + 1}`);

    await new ProgressAnalyticsPrismaRepository(few as unknown as PrismaService).getProgressSourceForUsers(["student-1"]);
    await new ProgressAnalyticsPrismaRepository(many as unknown as PrismaService).getProgressSourceForUsers(userIds);

    expect(totalCalls(few)).toBe(6);
    expect(totalCalls(many)).toBe(6);
    expect(many.pageProgress.findMany.mock.calls[0][0].where.userId).toEqual({ in: userIds });
    expect(many.lessonCompletion.findMany.mock.calls[0][0].where.userId).toEqual({ in: userIds });
  });

  it("counts the viewed pages and completion records per user and lesson", async () => {
    const prisma: PrismaMock = buildPrisma();

    const source: UsersProgressSource = await new ProgressAnalyticsPrismaRepository(prisma as unknown as PrismaService).getProgressSourceForUsers([
      "student-1",
      "student-2",
    ]);
    const facts = (userId: string): LessonCompletionFact[] => source.factsByUser.get(userId) ?? [];

    expect(source.structure.sections).toEqual([{ id: "section-1", levelIds: ["level-1"] }]);
    expect(facts("student-1")).toEqual([
      expect.objectContaining({ lessonId: "lesson-1", sectionId: "section-1", publishedPageCount: 2, viewedPageCount: 2, hasCompletionRecord: false }),
      expect.objectContaining({ lessonId: "lesson-2", publishedPageCount: 0, viewedPageCount: 0, hasCompletionRecord: false }),
    ]);
    expect(facts("student-2")).toEqual([
      expect.objectContaining({ lessonId: "lesson-1", viewedPageCount: 1, hasCompletionRecord: false }),
      expect.objectContaining({ lessonId: "lesson-2", hasCompletionRecord: true }),
    ]);
  });
});

describe("ProgressAnalyticsPrismaRepository last activity", () => {
  let queryRaw: jest.Mock;
  let repository: ProgressAnalyticsPrismaRepository;

  beforeEach(() => {
    queryRaw = jest.fn().mockResolvedValue([
      { user_id: "student-1", last_activity_at: new Date("2026-10-05T10:00:00Z") },
      { user_id: "student-2", last_activity_at: null },
    ]);
    repository = new ProgressAnalyticsPrismaRepository({ $queryRaw: queryRaw } as unknown as PrismaService);
  });

  it("reads the last page or lesson activity of every user in one parameterized query", async () => {
    const activity: UserProgressLastActivity[] = await repository.getLastActivityForUsers(["student-1", "student-2", "student-1"]);
    const query: Prisma.Sql = queryRaw.mock.calls[0][0] as Prisma.Sql;

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(query.sql).toContain("page_progress");
    expect(query.sql).toContain("lesson_completions");
    expect(query.sql).toContain("GROUP BY activity.user_id");
    expect(query.sql).not.toContain("student-1");
    expect(query.values).toEqual(["student-1", "student-2", "student-1", "student-2"]);
    expect(activity).toEqual([{ userId: "student-1", lastActivityAt: new Date("2026-10-05T10:00:00Z") }]);
  });

  it("does not query without users", async () => {
    const activity: UserProgressLastActivity[] = await repository.getLastActivityForUsers([]);

    expect(activity).toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
