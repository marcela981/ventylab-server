/*
 * Funcionalidad: Visibilidad de respuestas de quizzes
 * Descripción: Oculta en las preguntas de un quiz todo lo que revela la respuesta correcta (isCorrect y feedback de cada opción, explicación de la pregunta) hasta que el estudiante registre su intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type PublicQuizOption,
  type PublicQuizQuestion,
  type QuizOption,
  type QuizQuestion,
} from "@/features/quizzes/domain/read-models/quiz.read-model";

export function hideQuizAnswers(questions: QuizQuestion[]): PublicQuizQuestion[] {
  return questions.map((question: QuizQuestion): PublicQuizQuestion => ({
    id: question.id,
    type: question.type,
    text: question.text,
    options: question.options.map((option: QuizOption): PublicQuizOption => ({
      id: option.id,
      text: option.text,
    })),
  }));
}
