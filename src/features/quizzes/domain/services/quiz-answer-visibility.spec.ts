/*
 * Funcionalidad: Pruebas de visibilidad de respuestas de quizzes
 * Descripción: Verifica que hideQuizAnswers elimine isCorrect, feedback y explicación sin alterar el resto de la pregunta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PublicQuizQuestion, type QuizQuestion } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { hideQuizAnswers } from "@/features/quizzes/domain/services/quiz-answer-visibility";

describe("hideQuizAnswers", () => {
  it("removes every field that reveals the correct answer", () => {
    const questions: QuizQuestion[] = [
      {
        id: "q1",
        type: "multiple_choice",
        text: "What is PEEP?",
        explanation: "PEEP keeps alveoli open at end of expiration",
        options: [
          { id: "q1-a", text: "Positive end-expiratory pressure", isCorrect: true, feedback: "Correct" },
          { id: "q1-b", text: "Peak expiratory pressure", isCorrect: false, feedback: "That is a different parameter" },
        ],
      },
    ];

    const result: PublicQuizQuestion[] = hideQuizAnswers(questions);

    expect(result).toEqual([
      {
        id: "q1",
        type: "multiple_choice",
        text: "What is PEEP?",
        options: [
          { id: "q1-a", text: "Positive end-expiratory pressure" },
          { id: "q1-b", text: "Peak expiratory pressure" },
        ],
      },
    ]);
  });

  it("does not mutate the stored questions", () => {
    const questions: QuizQuestion[] = [
      { id: "q1", type: "true_false", text: "PEEP can be zero", options: [{ id: "q1-a", text: "True", isCorrect: true }] },
    ];

    hideQuizAnswers(questions);

    expect(questions[0]?.options[0]?.isCorrect).toBe(true);
  });
});
