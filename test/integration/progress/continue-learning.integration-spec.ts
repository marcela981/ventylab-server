/*
 * Funcionalidad: Prueba de integración de continueLearning
 * Descripción: Contra el PostgreSQL de Testcontainers verifica GetContinueLearningUseCase con ProgressAnalyticsPrismaRepository: elige la lección accedida más recientemente entre módulos, salta la que dejó de estar publicada y calcula el porcentaje del módulo; sin progreso devuelve undefined
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Lesson, type Module, type User } from "@prisma/client";

import { GetContinueLearningUseCase } from "@/features/progress/application/use-cases/get-continue-learning.usecase";

import { type ContentTree, createContentTree, createLesson, createPage, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

describe("continue learning against PostgreSQL", () => {
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

  function track(userId: string, courseModule: Module, lesson: Lesson, lastAccessedAt: Date): Promise<unknown> {
    return harness.prisma.userProgress.create({ data: { userId, moduleId: courseModule.id, lastAccessedLessonId: lesson.id, lastAccessedAt } });
  }

  it("should pick the most recent published lesson across modules with its module percentage", async () => {
    const student: User = await createStudent(harness.prisma);
    const older: ContentTree = await createContentTree(harness.prisma);
    const newer: ContentTree = await createContentTree(harness.prisma);
    const draftTree: ContentTree = await createContentTree(harness.prisma);
    const secondLesson: Lesson = await createLesson(harness.prisma, older.module);
    const useCase: GetContinueLearningUseCase = harness.app.get(GetContinueLearningUseCase);

    await createPage(harness.prisma, secondLesson, older.author);
    await harness.prisma.lesson.update({ where: { id: draftTree.lesson.id }, data: { status: "DRAFT" } });
    await harness.prisma.pageProgress.create({ data: { userId: student.id, pageId: older.page.id, completed: true, completedAt: new Date() } });
    await track(student.id, older.module, secondLesson, new Date("2026-10-01T10:00:00Z"));
    await track(student.id, newer.module, newer.lesson, new Date("2026-09-01T10:00:00Z"));
    await track(student.id, draftTree.module, draftTree.lesson, new Date("2026-10-20T10:00:00Z"));

    expect(await useCase.execute(student.id)).toEqual({
      moduleId: older.module.id,
      moduleTitle: older.module.title,
      lessonId: secondLesson.id,
      lessonTitle: secondLesson.title,
      percent: 50,
    });
  });

  it("should return undefined when the user has no accessed lesson", async () => {
    const student: User = await createStudent(harness.prisma);

    expect(await harness.app.get(GetContinueLearningUseCase).execute(student.id)).toBeUndefined();
  });
});
