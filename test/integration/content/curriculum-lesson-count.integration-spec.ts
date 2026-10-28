/*
 * Funcionalidad: Prueba de integración de lessonCount del árbol curricular
 * Descripción: Contra el PostgreSQL de Testcontainers verifica que CurriculumQueriesPrismaRepository.getTreeSource cuenta en lessonCount solo las lecciones publicadas con al menos una página publicada (excluye borradores, lecciones vacías y lecciones con solo páginas en borrador), igual para estudiantes y staff
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Lesson, type Level, type Module, type Section, type User } from "@prisma/client";

import { type CurriculumTreeSource, type CurriculumTreeSourceLevel } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";

import { createLesson, createLevel, createModule, createPage, createSection, createTeacher } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

function lessonCountOf(source: CurriculumTreeSource, moduleId: string): number | undefined {
  return source.levels
    .flatMap((level: CurriculumTreeSourceLevel) => level.modules)
    .find((module: CurriculumTreeSourceLevel["modules"][number]) => module.id === moduleId)?.lessonCount;
}

describe("curriculum tree lessonCount against PostgreSQL", () => {
  let harness: IntegrationApp;
  let repository: ICurriculumQueriesRepository;

  beforeAll(async () => {
    harness = await createIntegrationApp();
    repository = harness.app.get<ICurriculumQueriesRepository>(CURRICULUM_QUERIES_REPOSITORY_TOKEN);
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it("should count only published lessons that have at least one published page", async () => {
    const author: User = await createTeacher(harness.prisma);
    const section: Section = await createSection(harness.prisma);
    const level: Level = await createLevel(harness.prisma, section);
    const courseModule: Module = await createModule(harness.prisma, level);
    const withPages: Lesson = await createLesson(harness.prisma, courseModule, { order: 1 });
    const draftLesson: Lesson = await createLesson(harness.prisma, courseModule, { order: 2, status: "DRAFT" });
    const draftPagesOnly: Lesson = await createLesson(harness.prisma, courseModule, { order: 3 });

    await createLesson(harness.prisma, courseModule, { order: 4 });
    await createPage(harness.prisma, withPages, author);
    await createPage(harness.prisma, withPages, author, { status: "DRAFT" });
    await createPage(harness.prisma, draftLesson, author);
    await createPage(harness.prisma, draftPagesOnly, author, { status: "DRAFT" });

    const studentTree: CurriculumTreeSource = await repository.getTreeSource(false);
    const staffTree: CurriculumTreeSource = await repository.getTreeSource(true);

    expect(lessonCountOf(studentTree, courseModule.id)).toBe(1);
    expect(lessonCountOf(staffTree, courseModule.id)).toBe(1);
  });

  it("should report 0 for a published module whose lessons have no published pages", async () => {
    const section: Section = await createSection(harness.prisma);
    const level: Level = await createLevel(harness.prisma, section);
    const courseModule: Module = await createModule(harness.prisma, level);

    await createLesson(harness.prisma, courseModule);

    expect(lessonCountOf(await repository.getTreeSource(false), courseModule.id)).toBe(0);
  });
});
