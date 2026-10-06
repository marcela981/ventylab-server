/*
 * Funcionalidad: Pruebas de GetModuleFullUseCase
 * Descripción: Cuenta las consultas del contenido completo de un módulo con un PrismaService simulado (una sola consulta anidada) y una resolución de media en un único lote, y verifica la visibilidad por estado para estudiantes y docentes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IMediaUrlResolver, type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { GetModuleFullUseCase } from "@/features/modules/application/use-cases/get-module-full.usecase";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type ModuleFullContent } from "@/features/modules/domain/read-models/module-views.read-model";
import { ModuleQueriesPrismaRepository } from "@/features/modules/infrastructure/persistence/prisma/repositories/module-queries-prisma.repository";

interface QueryCounter {
  calls: string[];
  prisma: PrismaService;
}

function buildModuleRow(levelStatus: string): Record<string, unknown> {
  const block: Record<string, unknown> = { id: "b1", order: 0, type: "IMAGE", title: null, content: {}, estimatedTime: null, mediaId: "m1" };
  const page: Record<string, unknown> = {
    id: "p1",
    lessonId: "l1",
    title: "Page",
    slug: "page",
    order: 0,
    type: "THEORY",
    status: "PUBLISHED",
    estimatedMinutes: null,
    sections: [block],
  };

  return {
    id: "mod1",
    levelId: "lvl1",
    title: "Module",
    description: null,
    difficulty: null,
    estimatedTime: null,
    thumbnail: null,
    order: 0,
    status: "PUBLISHED",
    level: { status: levelStatus, section: { status: "PUBLISHED" } },
    lessons: [{ id: "l1", title: "Lesson", slug: null, order: 0, status: "PUBLISHED", estimatedTime: null, pages: [page] }],
    pages: [],
  };
}

function buildCountingPrisma(row: Record<string, unknown>): QueryCounter {
  const calls: string[] = [];
  const prisma: PrismaService = new Proxy({} as PrismaService, {
    get: (_target: PrismaService, model: string | symbol): unknown =>
      new Proxy(
        {},
        {
          get: (_modelTarget: object, method: string | symbol): unknown => (): Promise<unknown> => {
            calls.push(`${String(model)}.${String(method)}`);

            return Promise.resolve(row);
          },
        },
      ),
  });

  return { calls, prisma };
}

function buildResolver(): { resolver: IMediaUrlResolver; batches: string[][] } {
  const batches: string[][] = [];
  const resolver: IMediaUrlResolver = {
    resolveMany: (mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>> => {
      batches.push(mediaIds);

      return Promise.resolve(new Map<string, ResolvedMediaURL>([["m1", { mediaId: "m1", url: "https://cdn.example/m1", mimeType: "image/png", kind: "IMAGE" }]]));
    },
  };

  return { resolver, batches };
}

describe("GetModuleFullUseCase", () => {
  it("loads the module tree with one query and resolves media in one batch", async () => {
    const { calls, prisma } = buildCountingPrisma(buildModuleRow("PUBLISHED"));
    const { resolver, batches } = buildResolver();
    const useCase: GetModuleFullUseCase = new GetModuleFullUseCase(new ModuleQueriesPrismaRepository(prisma), resolver);

    const content: ModuleFullContent = await useCase.execute("mod1", false);

    expect(calls).toEqual(["module.findUnique"]);
    expect(batches).toEqual([["m1"]]);
    expect(content.lessons[0].pages[0].blocks[0].mediaUrl).toBe("https://cdn.example/m1");
  });

  it("returns null media URLs when no resolver is available", async () => {
    const { prisma } = buildCountingPrisma(buildModuleRow("PUBLISHED"));
    const useCase: GetModuleFullUseCase = new GetModuleFullUseCase(new ModuleQueriesPrismaRepository(prisma));

    const content: ModuleFullContent = await useCase.execute("mod1", false);

    expect(content.lessons[0].pages[0].blocks[0].mediaUrl).toBeNull();
  });

  it("hides a module with a draft ancestor from students but not from teachers", async () => {
    const { prisma } = buildCountingPrisma(buildModuleRow("DRAFT"));
    const useCase: GetModuleFullUseCase = new GetModuleFullUseCase(new ModuleQueriesPrismaRepository(prisma));

    const studentRead: Promise<ModuleFullContent> = useCase.execute("mod1", false);
    const teacherContent: ModuleFullContent = await useCase.execute("mod1", true);

    await expect(studentRead).rejects.toBeInstanceOf(ModuleNotFoundError);
    expect(teacherContent.id).toBe("mod1");
  });
});
