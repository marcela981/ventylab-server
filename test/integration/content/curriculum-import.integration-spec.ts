/*
 * Funcionalidad: Prueba de integración de la importación del currículo
 * Descripción: Contra el PostgreSQL de Testcontainers con las migraciones aplicadas: la simulación no escribe; la primera importación crea secciones, niveles, módulos, lecciones, páginas, bloques y revisiones; la segunda no cambia ninguna fila; un cambio de contenido sube la versión y guarda una revisión nueva sin tocar las demás páginas; una página del editor dentro de un módulo gestionado se conserva (o se archiva con la política archive) y se reordena después de las importadas; los módulos y lecciones retirados se archivan sin borrarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient, type User } from "@prisma/client";

import { curriculumId } from "@/features/curriculum/infrastructure/content-import/curriculum-ids";
import { buildCurriculumPlan, type CurriculumPlan } from "@/features/curriculum/infrastructure/content-import/curriculum-plan.builder";
import { type EntityCounts, importCurriculum, type ImportOptions, type ImportReport } from "@/features/curriculum/infrastructure/content-import/curriculum.importer";
import { type CurriculumManifest } from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";

import { createTeacher } from "../../factories";
import { createTestPrismaClient, resetDatabase } from "../../support/database";

function lessonSource(marker: string): string {
  return [
    "<!-- page: conceptos | THEORY | Conceptos -->",
    "<!-- block: INTRODUCTION | Introducción -->",
    `Texto ${marker}. ![Diagrama](/learning/diagrams/x-uno.svg "Figura: uno")`,
    "<!-- block: EQUATION -->",
    "C = \\frac{V_T}{\\Delta P}",
    "<!-- page: caso | CASE_STUDY | Caso -->",
    "<!-- block: CASE_STUDY | Ejemplo clínico -->",
    "Caso.",
    "<!-- page: sintesis | THEORY | Síntesis -->",
    "<!-- block: SUMMARY | Puntos clave -->",
    "- Punto.",
    "<!-- block: CALLOUT:warning | Errores frecuentes -->",
    "- Error.",
    "<!-- block: REFERENCES | Referencias -->",
    "- Ref.",
  ].join("\n");
}

const MANIFEST: CurriculumManifest = {
  levels: [
    {
      id: "level-it-a",
      track: "mecanica",
      title: "Nivel IT A",
      description: "A",
      order: 1,
      difficulty: "beginner",
      sequentialModules: false,
      modules: [{ key: "it-legacy", legacy: true, title: "Legacy", description: "d", lessons: [{ slug: "uno", title: "Uno", legacyId: "it-legacy-lesson", estimatedMinutes: 30, objectives: ["o"] }] }],
    },
    {
      id: "level-it-b",
      track: "mecanica",
      title: "Nivel IT B",
      description: "B",
      order: 2,
      difficulty: "advanced",
      sequentialModules: true,
      prerequisiteLevelId: "level-it-a",
      modules: [
        { key: "it-nuevo-1", legacy: false, title: "Nuevo 1", description: "d", lessons: [{ slug: "dos", title: "Dos", estimatedMinutes: 20, objectives: [] }] },
        { key: "it-nuevo-2", legacy: false, title: "Nuevo 2", description: "d", lessons: [{ slug: "tres", title: "Tres", estimatedMinutes: 20, objectives: [] }] },
      ],
    },
  ],
  retiredModuleIds: ["it-retired-module"],
  retiredLessonIds: ["it-retired-lesson"],
};

describe("curriculum import against PostgreSQL", () => {
  const db: PrismaClient = createTestPrismaClient();
  let author: User;

  function plan(marker: string = "v1"): CurriculumPlan {
    return buildCurriculumPlan(MANIFEST, (): string => lessonSource(marker));
  }

  function options(overrides: Partial<ImportOptions> = {}): ImportOptions {
    return { apply: true, authorId: author.id, foreignPages: "keep", now: new Date("2026-11-04T12:00:00Z"), ...overrides };
  }

  async function snapshot(): Promise<unknown> {
    return {
      levels: await db.level.findMany({ orderBy: { id: "asc" } }),
      modules: await db.module.findMany({ orderBy: { id: "asc" } }),
      lessons: await db.lesson.findMany({ orderBy: { id: "asc" } }),
      pages: await db.page.findMany({ orderBy: { id: "asc" } }),
      sections: await db.pageSection.findMany({ orderBy: { id: "asc" } }),
      revisions: await db.pageRevision.findMany({ orderBy: { id: "asc" } }),
      prerequisites: await db.modulePrerequisite.findMany({ orderBy: { moduleId: "asc" }, select: { moduleId: true, prerequisiteId: true } }),
      levelPrerequisites: await db.levelPrerequisite.findMany({ select: { levelId: true, prerequisiteLevelId: true } }),
    };
  }

  beforeEach(async () => {
    await resetDatabase(db);
    author = await createTeacher(db);
    // A retired July module and lesson, as in production.
    await db.module.create({ data: { id: "it-retired-module", title: "Retirado" } });
    await db.lesson.create({ data: { id: "it-retired-lesson", moduleId: "it-retired-module", title: "Retirada" } });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("does not write anything in a dry run", async () => {
    const report: ImportReport = await importCurriculum(db, plan(), options({ apply: false, authorId: null }));

    expect(report.applied).toBe(false);
    expect(report.counts.pages.created).toBe(9);
    expect(await db.page.count()).toBe(0);
    expect(await db.level.count()).toBe(0);
  });

  it("creates the whole tree, then changes nothing on a second run", async () => {
    const first: ImportReport = await importCurriculum(db, plan(), options());

    expect(first.counts.levels.created).toBe(2);
    expect(first.counts.modules).toMatchObject({ created: 3, archived: 1 });
    expect(first.counts.lessons).toMatchObject({ created: 3, archived: 1 });
    expect(await db.page.count({ where: { status: "PUBLISHED", isPublished: true } })).toBe(9);
    expect(await db.pageSection.count()).toBe(18);
    expect(await db.pageRevision.count()).toBe(9);
    expect(await db.level.findUnique({ where: { id: "level-it-b" }, select: { section: { select: { slug: true } } } })).toEqual({ section: { slug: "mecanica" } });
    expect(await db.modulePrerequisite.findMany({ select: { moduleId: true, prerequisiteId: true } })).toEqual([
      { moduleId: curriculumId("module:it-nuevo-2"), prerequisiteId: curriculumId("module:it-nuevo-1") },
    ]);
    expect(await db.module.findUnique({ where: { id: "it-retired-module" }, select: { status: true, isActive: true } })).toEqual({ status: "ARCHIVED", isActive: false });

    const before: unknown = await snapshot();
    const second: ImportReport = await importCurriculum(db, plan(), options());

    expect(await snapshot()).toEqual(before);
    expect(Object.values(second.counts).every((counts: EntityCounts): boolean => counts.created === 0 && counts.updated === 0 && counts.archived === 0 && counts.removed === 0)).toBe(true);
  });

  it("bumps the version and stores a revision only for the pages whose content changed", async () => {
    await importCurriculum(db, plan(), options());

    const changed: CurriculumPlan = buildCurriculumPlan(MANIFEST, (moduleKey: string): string => lessonSource(moduleKey === "it-legacy" ? "v2" : "v1"));
    const report: ImportReport = await importCurriculum(db, changed, options());
    const pageId: string = curriculumId("page:it-legacy/uno/conceptos");

    expect(report.counts.pageContents).toMatchObject({ updated: 1, unchanged: 8 });
    expect(await db.page.findUnique({ where: { id: pageId }, select: { version: true } })).toEqual({ version: 2 });
    expect(await db.pageRevision.count({ where: { pageId } })).toBe(2);
    expect(await db.pageSection.findFirst({ where: { pageId, order: 1 }, select: { content: true } })).toEqual({
      content: { markdown: "Texto v2. ![Diagrama](/learning/diagrams/x-uno.svg \"Figura: uno\")" },
    });
  });

  it("keeps an editor page of a managed module after the imported ones, or archives it", async () => {
    await importCurriculum(db, plan(), options());
    await db.page.create({
      data: { id: "editor-page", moduleId: "it-legacy", lessonId: "it-legacy-lesson", title: "Del editor", slug: "del-editor", order: 1000, createdBy: author.id, isPublished: true },
    });

    const kept: ImportReport = await importCurriculum(db, plan(), options());

    expect(kept.foreignPages).toEqual([{ moduleId: "it-legacy", pageId: "editor-page", slug: "del-editor", title: "Del editor" }]);
    expect(await db.page.findUnique({ where: { id: "editor-page" }, select: { order: true, slug: true, status: true } })).toEqual({ order: 4, slug: "del-editor", status: "PUBLISHED" });

    await importCurriculum(db, plan(), options({ foreignPages: "archive" }));

    expect(await db.page.findUnique({ where: { id: "editor-page" }, select: { status: true, isActive: true } })).toEqual({ status: "ARCHIVED", isActive: false });
    expect(await db.page.count({ where: { moduleId: "it-legacy", status: "PUBLISHED" } })).toBe(3);
  });

  it("refuses to write without an author or with content problems", async () => {
    await expect(importCurriculum(db, plan(), options({ authorId: null }))).rejects.toThrow("author");
    await expect(importCurriculum(db, buildCurriculumPlan(MANIFEST, (): null => null), options())).rejects.toThrow("content problems");
  });
});
