/*
 * Funcionalidad: Pruebas del repositorio Prisma de notas
 * Descripción: Verifica con un cliente Prisma simulado los filtros del listado (página, búsqueda de texto acotada al usuario con los comodines escapados e intersectada con el resto del filtro, búsqueda vacía ignorada) y que las etiquetas de lecciones y páginas se leen en dos consultas por lotes sin repetir IDs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type NoteContentLabels } from "@/features/notes/domain/read-models/note-scope.read-model";
import { NotesPrismaRepository } from "@/features/notes/infrastructure/persistence/prisma/repositories/notes-prisma.repository";

interface FakePrisma {
  note: { findMany: jest.Mock; count: jest.Mock };
  lesson: { findMany: jest.Mock };
  page: { findMany: jest.Mock };
  $queryRaw: jest.Mock;
}

function buildPrisma(): FakePrisma {
  return {
    note: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    lesson: { findMany: jest.fn().mockResolvedValue([{ id: "lesson-1", title: "PEEP basics", moduleId: "module-1" }]) },
    page: { findMany: jest.fn().mockResolvedValue([{ id: "page-1", title: "Recruitment" }]) },
    $queryRaw: jest.fn().mockResolvedValue([{ id: "note-1" }, { id: "note-2" }]),
  };
}

function repositoryOf(prisma: FakePrisma): NotesPrismaRepository {
  return new NotesPrismaRepository(prisma as unknown as PrismaService);
}

describe("NotesPrismaRepository", () => {
  it("filters the list by page and by text matches of the same user, escaping LIKE wildcards", async () => {
    const prisma: FakePrisma = buildPrisma();

    await repositoryOf(prisma).getAll({ userId: "student-1", page: 1, limit: 10, pageId: "page-1", search: "  50%_ok  " });

    const values: unknown[] = prisma.$queryRaw.mock.calls[0].slice(1);
    const where: Record<string, unknown> = prisma.note.findMany.mock.calls[0][0].where;

    expect(values).toEqual(["student-1", "%50\\%\\_ok%"]);
    expect(where).toEqual({ userId: "student-1", pageId: "page-1", AND: [{ id: { in: ["note-1", "note-2"] } }] });
    expect(prisma.note.count.mock.calls[0][0].where).toBe(where);
  });

  it("ignores a blank search", async () => {
    const prisma: FakePrisma = buildPrisma();

    await repositoryOf(prisma).getAll({ userId: "student-1", page: 1, limit: 10, search: "   " });

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.note.findMany.mock.calls[0][0].where).toEqual({ userId: "student-1" });
  });

  it("reads lesson and page labels in two batch queries without repeating IDs", async () => {
    const prisma: FakePrisma = buildPrisma();

    const labels: NoteContentLabels = await repositoryOf(prisma).getContentLabels(["lesson-1", "lesson-1"], ["page-1"]);

    expect(prisma.lesson.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.lesson.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["lesson-1"] } });
    expect(prisma.page.findMany).toHaveBeenCalledTimes(1);
    expect(labels).toEqual({
      lessons: [{ lessonId: "lesson-1", lessonTitle: "PEEP basics", moduleId: "module-1" }],
      pages: [{ pageId: "page-1", pageTitle: "Recruitment" }],
    });
  });

  it("skips the page query when no note refers to a page", async () => {
    const prisma: FakePrisma = buildPrisma();

    await repositoryOf(prisma).getContentLabels(["lesson-1"], []);

    expect(prisma.page.findMany).not.toHaveBeenCalled();
  });
});
