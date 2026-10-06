/*
 * Funcionalidad: Pruebas de LearningProgressPrismaRepository
 * Descripción: Verifica la forma del upsert idempotente de PageProgress sobre (userId, pageId): la creación fija completedAt y una vista repetida solo actualiza lastVisitedAt sin reiniciar completedAt
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type PageViewSnapshot } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { LearningProgressPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/learning-progress-prisma.repository";

const FIRST_VIEW: Date = new Date("2026-10-01T10:00:00.000Z");
const NOW: Date = new Date("2026-10-05T10:00:00.000Z");

function buildRepository(): { repository: LearningProgressPrismaRepository; upsert: jest.Mock } {
  const upsert: jest.Mock = jest.fn().mockResolvedValue({ pageId: "P1", completed: true, completedAt: FIRST_VIEW, lastVisitedAt: NOW });
  const prisma: PrismaService = { pageProgress: { upsert } } as unknown as PrismaService;

  return { repository: new LearningProgressPrismaRepository(prisma), upsert };
}

describe("LearningProgressPrismaRepository.savePageView", () => {
  it("upserts on the (userId, pageId) unique key and stamps completedAt when creating", async () => {
    const { repository, upsert } = buildRepository();

    await repository.savePageView("U1", "P1", { lastVisitedAt: FIRST_VIEW, completedAt: FIRST_VIEW });

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_pageId: { userId: "U1", pageId: "P1" } },
      create: { id: expect.any(String), userId: "U1", pageId: "P1", completed: true, lastVisitedAt: FIRST_VIEW, completedAt: FIRST_VIEW },
      update: { completed: true, lastVisitedAt: FIRST_VIEW, completedAt: FIRST_VIEW },
      select: { pageId: true, completed: true, completedAt: true, lastVisitedAt: true },
    });
  });

  it("leaves completedAt untouched on a repeated view", async () => {
    const { repository, upsert } = buildRepository();

    const view: PageViewSnapshot = await repository.savePageView("U1", "P1", { lastVisitedAt: NOW });

    const [[args]]: [[{ update: Record<string, unknown>; create: Record<string, unknown> }]] = upsert.mock.calls as [[{ update: Record<string, unknown>; create: Record<string, unknown> }]];

    expect(args.update).toEqual({ completed: true, lastVisitedAt: NOW });
    expect(args.update).not.toHaveProperty("completedAt");
    expect(args.create).toMatchObject({ completedAt: NOW });
    expect(view).toEqual({ pageId: "P1", completed: true, firstViewedAt: FIRST_VIEW, lastVisitedAt: NOW });
  });
});
