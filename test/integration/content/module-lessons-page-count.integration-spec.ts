/*
 * Funcionalidad: Prueba de integración de pageCount en la lista de lecciones de un módulo
 * Descripción: Contra el PostgreSQL de Testcontainers verifica que ModuleQueriesPrismaRepository.getLessons (GET /api/modules/:id/lessons) devuelve en pageCount el número de páginas PUBLISHED de cada lección (no el JSON heredado Lesson.content, que daba 0), excluye las páginas en borrador y deja 0 en una lección sin páginas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Lesson } from "@prisma/client";

import { type ModuleLessonItem } from "@/features/modules/domain/read-models/module-views.read-model";
import { type IModuleQueriesRepository, MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";

import { type ContentTree, createContentTree, createLesson, createPage } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

describe("module lesson list pageCount against PostgreSQL", () => {
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

  it("should count the published pages of each lesson for students and staff", async () => {
    const tree: ContentTree = await createContentTree(harness.prisma);
    const emptyLesson: Lesson = await createLesson(harness.prisma, tree.module);

    await createPage(harness.prisma, tree.lesson, tree.author);
    await createPage(harness.prisma, tree.lesson, tree.author, { status: "DRAFT" });

    const repository: IModuleQueriesRepository = harness.app.get<IModuleQueriesRepository>(MODULE_QUERIES_REPOSITORY_TOKEN);

    for (const canManage of [false, true]) {
      const counts: Record<string, number> = Object.fromEntries(
        (await repository.getLessons(tree.module.id, canManage)).map((lesson: ModuleLessonItem): [string, number] => [lesson.id, lesson.pageCount]),
      );

      expect(counts).toEqual({ [tree.lesson.id]: 2, [emptyLesson.id]: 0 });
    }
  });
});
