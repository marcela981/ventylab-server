/*
 * Funcionalidad: Pruebas de GetLessonByIdUseCase
 * Descripción: Un estudiante o un lector anónimo recibe los quizzes de la lección sin isCorrect, feedback ni explicaciones; el staff los recibe completos; una lección no visible responde LessonNotFoundError
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GetLessonByIdUseCase } from "@/features/lessons/application/use-cases/get-lesson-by-id.usecase";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonDetail } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { type ILessonQueriesRepository } from "@/features/lessons/domain/repositories/lesson-queries.repository";

const QUESTIONS: unknown = [
  {
    id: "q1",
    type: "multiple-choice",
    text: "¿Qué mide la presión meseta?",
    explanation: "La carga elástica.",
    options: [
      { id: "a", text: "La carga elástica", isCorrect: true, feedback: "Correcto" },
      { id: "b", text: "La carga resistiva", isCorrect: false, feedback: "No" },
    ],
  },
];

const LESSON: LessonDetail = {
  id: "lesson-1",
  quizzes: [{ id: "quiz-1", title: "Quiz", questions: QUESTIONS, passingScore: 70, order: 1, isActive: true }],
} as unknown as LessonDetail;

function useCase(visible: boolean = true): GetLessonByIdUseCase {
  const repository: Partial<ILessonQueriesRepository> = {
    getStatusChain: jest.fn().mockResolvedValue(visible ? ["PUBLISHED", "PUBLISHED", "PUBLISHED", "PUBLISHED"] : ["PUBLISHED", "PUBLISHED", "PUBLISHED", "DRAFT"]),
    getDetail: jest.fn().mockResolvedValue(LESSON),
  };

  return new GetLessonByIdUseCase(repository as ILessonQueriesRepository);
}

describe("GetLessonByIdUseCase", () => {
  it("hides the answer key of the lesson quizzes from readers who are not staff", async () => {
    const lesson: LessonDetail = await useCase().execute("lesson-1", false);

    expect(lesson.quizzes[0]?.questions).toEqual([
      { id: "q1", type: "multiple-choice", text: "¿Qué mide la presión meseta?", options: [{ id: "a", text: "La carga elástica" }, { id: "b", text: "La carga resistiva" }] },
    ]);
    expect(JSON.stringify(lesson)).not.toMatch(/isCorrect|feedback|explanation/);
  });

  it("returns the full quizzes to staff", async () => {
    expect((await useCase().execute("lesson-1", true)).quizzes[0]?.questions).toEqual(QUESTIONS);
  });

  it("does not show a lesson that is not visible to the reader", async () => {
    await expect(useCase(false).execute("lesson-1", false)).rejects.toBeInstanceOf(LessonNotFoundError);
  });
});
