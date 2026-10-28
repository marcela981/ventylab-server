/*
 * Funcionalidad: Pruebas de LearningProgressPrismaRepository
 * Descripción: Verifica las escrituras condicionales de LearningProgressPrismaRepository: la primera vista inserta PageProgress (createMany con skipDuplicates) e informa created=true fijando completedAt; una vista repetida solo actualiza lastVisitedAt sin reiniciar completedAt (created=false); markLessonCompleted devuelve true solo cuando su actualización condicionada o su inserción hicieron la transición a completada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type SavedPageView } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { LearningProgressPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/learning-progress-prisma.repository";

const FIRST_VIEW: Date = new Date("2026-10-01T10:00:00.000Z");
const NOW: Date = new Date("2026-10-05T10:00:00.000Z");

interface PrismaMocks {
  pageCreateMany: jest.Mock;
  pageUpdate: jest.Mock;
  completionUpdateMany: jest.Mock;
  completionCreateMany: jest.Mock;
}

function buildRepository(inserted: number, completionUpdated: number = 0, completionInserted: number = 0): { repository: LearningProgressPrismaRepository; mocks: PrismaMocks } {
  const mocks: PrismaMocks = {
    pageCreateMany: jest.fn().mockResolvedValue({ count: inserted }),
    pageUpdate: jest.fn().mockResolvedValue({ pageId: "P1", completed: true, completedAt: FIRST_VIEW, lastVisitedAt: NOW }),
    completionUpdateMany: jest.fn().mockResolvedValue({ count: completionUpdated }),
    completionCreateMany: jest.fn().mockResolvedValue({ count: completionInserted }),
  };
  const prisma: PrismaService = {
    pageProgress: { createMany: mocks.pageCreateMany, update: mocks.pageUpdate },
    lessonCompletion: { updateMany: mocks.completionUpdateMany, createMany: mocks.completionCreateMany },
  } as unknown as PrismaService;

  return { repository: new LearningProgressPrismaRepository(prisma), mocks };
}

describe("LearningProgressPrismaRepository.savePageView", () => {
  it("inserts the row on the first view, stamps completedAt and reports created", async () => {
    const { repository, mocks } = buildRepository(1);

    const saved: SavedPageView = await repository.savePageView("U1", "P1", { lastVisitedAt: FIRST_VIEW, completedAt: FIRST_VIEW });

    expect(mocks.pageCreateMany).toHaveBeenCalledWith({
      data: [{ id: expect.any(String), userId: "U1", pageId: "P1", completed: true, lastVisitedAt: FIRST_VIEW, completedAt: FIRST_VIEW }],
      skipDuplicates: true,
    });
    expect(mocks.pageUpdate).not.toHaveBeenCalled();
    expect(saved).toEqual({ created: true, view: { pageId: "P1", completed: true, firstViewedAt: FIRST_VIEW, lastVisitedAt: FIRST_VIEW } });
  });

  it("updates only lastVisitedAt on a repeated view and reports not created", async () => {
    const { repository, mocks } = buildRepository(0);

    const saved: SavedPageView = await repository.savePageView("U1", "P1", { lastVisitedAt: NOW });

    expect(mocks.pageUpdate).toHaveBeenCalledWith({
      where: { userId_pageId: { userId: "U1", pageId: "P1" } },
      data: { completed: true, lastVisitedAt: NOW },
      select: { pageId: true, completed: true, completedAt: true, lastVisitedAt: true },
    });
    expect(saved).toEqual({ created: false, view: { pageId: "P1", completed: true, firstViewedAt: FIRST_VIEW, lastVisitedAt: NOW } });
  });
});

describe("LearningProgressPrismaRepository.markLessonCompleted", () => {
  it("returns true when it completes an existing incomplete row, without inserting", async () => {
    const { repository, mocks } = buildRepository(0, 1);

    expect(await repository.markLessonCompleted("U1", "L1", NOW)).toBe(true);
    expect(mocks.completionUpdateMany).toHaveBeenCalledWith({ where: { userId: "U1", lessonId: "L1", isCompleted: false }, data: { isCompleted: true, completedAt: NOW, lastAccessed: NOW } });
    expect(mocks.completionCreateMany).not.toHaveBeenCalled();
  });

  it("returns true when it inserts the completion and false when another call already did", async () => {
    expect(await buildRepository(0, 0, 1).repository.markLessonCompleted("U1", "L1", NOW)).toBe(true);
    expect(await buildRepository(0, 0, 0).repository.markLessonCompleted("U1", "L1", NOW)).toBe(false);
  });
});
