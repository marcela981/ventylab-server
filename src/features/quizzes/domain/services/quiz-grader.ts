/*
 * Funcionalidad: Servicio de dominio de calificación de quizzes
 * Descripción: Califica las respuestas de un intento contra las opciones correctas del quiz (porcentaje redondeado y aprobación según passingScore)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type GradedQuestion,
  type QuizAnswer,
  type QuizGrading,
  type QuizOption,
  type QuizQuestion,
} from "@/features/quizzes/domain/read-models/quiz.read-model";

export function gradeQuizAttempt(questions: QuizQuestion[], answers: QuizAnswer[], passingScore: number): QuizGrading {
  let correct: number = 0;
  const gradedQuestions: GradedQuestion[] = [];

  for (const question of questions) {
    const userAnswer: QuizAnswer | undefined = answers.find((answer: QuizAnswer) => answer.questionId === question.id);
    const correctOption: QuizOption | undefined = question.options.find((option: QuizOption) => option.isCorrect);
    const selectedOption: QuizOption | undefined = userAnswer
      ? question.options.find((option: QuizOption) => option.id === userAnswer.selectedOptionId)
      : undefined;

    const isCorrect: boolean = !!selectedOption?.isCorrect;

    if (isCorrect) {
      correct++;
    }

    gradedQuestions.push({
      questionId: question.id,
      selectedOptionId: userAnswer?.selectedOptionId ?? "",
      correctOptionId: correctOption?.id ?? "",
      isCorrect,
      explanation: question.explanation,
      feedback: selectedOption?.feedback,
    });
  }

  const totalQuestions: number = questions.length;
  const score: number = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return {
    score,
    passed: score >= passingScore,
    totalQuestions,
    correctAnswers: correct,
    gradedQuestions,
  };
}
