/*
 * Funcionalidad: Pruebas del repositorio Prisma LessonQueriesPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que el detalle de una lección lea sus quizzes de las evaluaciones QUIZ del alcance de quizzes (nunca de la relación congelada quizzes) y los entregue con la forma heredada (preguntas JSON reconstruidas, nota mínima, tiempo, orden y estado activo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonDetail } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { LessonQueriesPrismaRepository } from "@/features/lessons/infrastructure/persistence/prisma/repositories/lesson-queries-prisma.repository";
import { QUIZ_EVALUATION_SCOPE } from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";

interface PrismaMock {
  lesson: { findUnique: jest.Mock };
  evaluation: { findMany: jest.Mock };
}

function lessonRow(): Record<string, unknown> {
  const date: Date = new Date(0);

  return {
    id: "lesson-1",
    moduleId: "module-1",
    title: "Lesson",
    slug: null,
    content: null,
    order: 1,
    estimatedTime: null,
    aiGenerated: false,
    sourcePrompt: null,
    isActive: true,
    status: "PUBLISHED",
    color: null,
    tags: [],
    blocks: null,
    hasRequiredQuiz: false,
    lastModifiedBy: null,
    lastModifiedAt: null,
    createdAt: date,
    updatedAt: date,
    module: { id: "module-1", levelId: null, title: "Module", difficulty: null, order: 0, isActive: true },
  };
}

function quizEvaluationRow(): Record<string, unknown> {
  return {
    id: "quiz-1",
    title: "Quiz",
    description: "Legacy description",
    moduleId: "module-1",
    lessonId: "lesson-1",
    durationMinutes: 15,
    status: "ARCHIVED",
    order: 2,
    legacySource: "quiz",
    legacyPassingScore: 70,
    legacyModuleRef: "module-1",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    questions: [
      {
        id: "quiz-1:q1",
        order: 0,
        type: "TRUE_FALSE",
        prompt: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Is PEEP positive?" }] }] },
        points: 1,
        explanation: null,
        legacyType: "true_false",
        legacyRef: "q1",
        options: [
          { id: "quiz-1:q1:a", order: 0, content: "True", isCorrect: true, legacyFeedback: null, legacyRef: "a" },
          { id: "quiz-1:q1:b", order: 1, content: "False", isCorrect: false, legacyFeedback: "No", legacyRef: "b" },
        ],
      },
    ],
  };
}

describe("LessonQueriesPrismaRepository.getDetail", () => {
  let prisma: PrismaMock;
  let repository: LessonQueriesPrismaRepository;

  beforeEach(() => {
    prisma = { lesson: { findUnique: jest.fn() }, evaluation: { findMany: jest.fn().mockResolvedValue([]) } };
    repository = new LessonQueriesPrismaRepository(prisma as unknown as PrismaService);
  });

  it("loads the lesson without the frozen quizzes relation and its quizzes from the QUIZ evaluation scope", async () => {
    prisma.lesson.findUnique.mockResolvedValue(lessonRow());
    prisma.evaluation.findMany.mockResolvedValue([quizEvaluationRow()]);

    const detail: LessonDetail | undefined = await repository.getDetail("lesson-1");

    expect(prisma.lesson.findUnique).toHaveBeenCalledWith({ where: { id: "lesson-1" }, include: { module: true } });
    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [QUIZ_EVALUATION_SCOPE, { lessonId: "lesson-1" }] },
      orderBy: { order: "asc" },
    }));
    expect(detail?.quizzes).toEqual([
      {
        id: "quiz-1",
        title: "Quiz",
        description: "Legacy description",
        questions: [
          {
            id: "q1",
            type: "true_false",
            text: "Is PEEP positive?",
            options: [
              { id: "a", text: "True", isCorrect: true },
              { id: "b", text: "False", isCorrect: false, feedback: "No" },
            ],
          },
        ],
        passingScore: 70,
        timeLimit: 15,
        order: 2,
        isActive: false,
      },
    ]);
  });

  it("returns undefined without querying evaluations when the lesson does not exist", async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    const detail: LessonDetail | undefined = await repository.getDetail("missing");

    expect(detail).toBeUndefined();
    expect(prisma.evaluation.findMany).not.toHaveBeenCalled();
  });
});
