/*
 * Funcionalidad: Pruebas del repositorio Prisma ModuleQueriesPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que el conteo de quizzes de cada lección de un módulo cuente las evaluaciones QUIZ del alcance de quizzes (nunca la relación congelada quizzes)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ModuleLessonItem } from "@/features/modules/domain/read-models/module-views.read-model";
import { ModuleQueriesPrismaRepository } from "@/features/modules/infrastructure/persistence/prisma/repositories/module-queries-prisma.repository";
import { QUIZ_EVALUATION_SCOPE } from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";

describe("ModuleQueriesPrismaRepository.getLessons", () => {
  it("counts the QUIZ evaluations of the quizzes scope linked to each lesson", async () => {
    const date: Date = new Date(0);
    const findMany: jest.Mock = jest.fn().mockResolvedValue([
      {
        id: "lesson-1",
        moduleId: "module-1",
        title: "Lesson",
        slug: null,
        content: null,
        order: 1,
        estimatedTime: null,
        aiGenerated: false,
        isActive: true,
        status: "PUBLISHED",
        color: null,
        tags: [],
        hasRequiredQuiz: true,
        createdAt: date,
        updatedAt: date,
        _count: { evaluations: 2 },
      },
    ]);
    const repository: ModuleQueriesPrismaRepository = new ModuleQueriesPrismaRepository({ lesson: { findMany } } as unknown as PrismaService);

    const lessons: ModuleLessonItem[] = await repository.getLessons("module-1", true);

    expect(findMany).toHaveBeenCalledWith({
      where: { moduleId: "module-1" },
      orderBy: { order: "asc" },
      include: { _count: { select: { evaluations: { where: QUIZ_EVALUATION_SCOPE } } } },
    });
    expect(lessons[0]?.quizCount).toBe(2);
  });
});
