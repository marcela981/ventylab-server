/*
 * Funcionalidad: Pruebas del lector de contenido del tutor
 * Descripción: Verifica con GetPageByIdUseCase real que una página en borrador responde 404 a un estudiante y es visible para quien gestiona contenido (chequeo 10), y que el texto de la página incluye descripción, objetivos y secciones activas con los títulos de lección y módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TutorPageContent } from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { CurriculumTutorContentReader } from "@/features/ai-tutor/infrastructure/content/curriculum-tutor-content-reader";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { type GetLessonByIdUseCase } from "@/features/lessons/application/use-cases/get-lesson-by-id.usecase";
import { type GetModuleByIdUseCase } from "@/features/modules/application/use-cases/get-module-by-id.usecase";
import { type GetModuleLessonsUseCase } from "@/features/modules/application/use-cases/get-module-lessons.usecase";
import { type GetLessonPagesUseCase } from "@/features/pages/application/use-cases/get-lesson-pages.usecase";
import { type GetModulePagesUseCase } from "@/features/pages/application/use-cases/get-module-pages.usecase";
import { GetPageByIdUseCase } from "@/features/pages/application/use-cases/get-page-by-id.usecase";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { type PageSectionView, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository } from "@/features/pages/domain/repositories/page-queries.repository";

function section(order: number, title: string, text: string, isActive: boolean = true): PageSectionView {
  return {
    id: `s-${order}`,
    pageId: "page-1",
    order,
    type: "text",
    title,
    content: { doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] } },
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function pageView(): PageView {
  return {
    id: "page-1",
    moduleId: "module-1",
    lessonId: "lesson-1",
    title: "Modos ventilatorios",
    slug: "modos",
    order: 1,
    type: "content",
    description: "Introducción a los modos",
    difficulty: "beginner",
    learningObjectives: ["Distinguir volumen y presión control"],
    prerequisites: [],
    keyTakeaways: [],
    tags: [],
    hasRequiredQuiz: false,
    version: 1,
    isActive: true,
    isPublished: false,
    status: "DRAFT",
    createdBy: "teacher-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    sections: [section(2, "Presión control", "Se fija la presión inspiratoria"), section(1, "Volumen control", "Se fija el volumen tidal"), section(3, "Oculta", "No debe salir", false)],
    module: { id: "module-1", title: "Fundamentos", isActive: true },
  };
}

function buildReader(chain: ContentStatusChain): CurriculumTutorContentReader {
  const queries: IPageQueriesRepository = {
    getStatusChain: () => Promise.resolve(chain),
    getById: () => Promise.resolve(pageView()),
    getVisibleByLegacyJsonId: () => Promise.resolve(undefined),
    getVisibleByLegacyLessonId: () => Promise.resolve(undefined),
    getVisibleByModule: () => Promise.resolve([]),
    getVisibleByLesson: () => Promise.resolve([]),
  };
  const getLessonById: Pick<GetLessonByIdUseCase, "execute"> = {
    execute: () => Promise.resolve({ id: "lesson-1", title: "Parámetros básicos" } as Awaited<ReturnType<GetLessonByIdUseCase["execute"]>>),
  };

  return new CurriculumTutorContentReader(
    new GetPageByIdUseCase(queries),
    {} as GetLessonPagesUseCase,
    {} as GetModulePagesUseCase,
    getLessonById as GetLessonByIdUseCase,
    {} as GetModuleByIdUseCase,
    {} as GetModuleLessonsUseCase,
  );
}

describe("CurriculumTutorContentReader", () => {
  it("should answer 404 for a draft page when the reader cannot manage content (check 10)", async () => {
    const reader: CurriculumTutorContentReader = buildReader(["PUBLISHED", "PUBLISHED", "DRAFT"]);

    const read: Promise<TutorPageContent> = reader.getPage("page-1", false);

    await expect(read).rejects.toBeInstanceOf(PageNotFoundError);
  });

  it("should return the plain text of a draft page with lesson and module titles to a content manager", async () => {
    const reader: CurriculumTutorContentReader = buildReader(["PUBLISHED", "PUBLISHED", "DRAFT"]);

    const page: TutorPageContent = await reader.getPage("page-1", true);

    expect(page).toMatchObject({ id: "page-1", title: "Modos ventilatorios", moduleTitle: "Fundamentos", lessonTitle: "Parámetros básicos" });
    expect(page.text).toContain("Introducción a los modos");
    expect(page.text).toContain("- Distinguir volumen y presión control");
    expect(page.text.indexOf("Se fija el volumen tidal")).toBeLessThan(page.text.indexOf("Se fija la presión inspiratoria"));
    expect(page.text).not.toContain("No debe salir");
  });
});
