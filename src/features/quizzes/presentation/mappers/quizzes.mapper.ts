/*
 * Funcionalidad: Mapper de presentación de quizzes
 * Descripción: Convierte modelos de lectura y resultados de quizzes a sus DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type QuizAttemptResult } from "@/features/quizzes/application/results/quiz-attempt.result";
import {
  type GradedQuestion,
  type QuizAttemptSummary,
  type QuizDetailView,
  type QuizSummary,
} from "@/features/quizzes/domain/read-models/quiz.read-model";
import {
  GradedQuestionDTO,
  QuizAttemptResultDTO,
  QuizAttemptSummaryDTO,
  QuizDetailDTO,
  QuizSummaryDTO,
} from "@/features/quizzes/presentation/dtos/quiz.dto";

export class QuizzesMapper {
  public static toSummaryDTO(quiz: QuizSummary): QuizSummaryDTO {
    return new QuizSummaryDTO({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? null,
      moduleId: quiz.moduleId ?? null,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit ?? null,
      order: quiz.order,
      createdAt: quiz.createdAt,
    });
  }

  public static toSummaryDTOList(quizzes: QuizSummary[]): QuizSummaryDTO[] {
    return quizzes.map((quiz: QuizSummary) => QuizzesMapper.toSummaryDTO(quiz));
  }

  public static toDetailDTO(quiz: QuizDetailView): QuizDetailDTO {
    return new QuizDetailDTO({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? null,
      moduleId: quiz.moduleId ?? null,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit ?? null,
      order: quiz.order,
      createdAt: quiz.createdAt,
      lessonId: quiz.lessonId ?? null,
      questions: quiz.questions as unknown as Record<string, unknown>[],
      answersRevealed: quiz.answersRevealed,
      isActive: quiz.isActive,
      updatedAt: quiz.updatedAt,
    });
  }

  public static toAttemptSummaryDTO(attempt: QuizAttemptSummary): QuizAttemptSummaryDTO {
    return new QuizAttemptSummaryDTO({
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      passed: attempt.passed,
      completedAt: attempt.completedAt ?? null,
    });
  }

  public static toAttemptSummaryDTOList(attempts: QuizAttemptSummary[]): QuizAttemptSummaryDTO[] {
    return attempts.map((attempt: QuizAttemptSummary) => QuizzesMapper.toAttemptSummaryDTO(attempt));
  }

  public static toAttemptResultDTO(result: QuizAttemptResult): QuizAttemptResultDTO {
    return new QuizAttemptResultDTO({
      attemptId: result.attemptId,
      score: result.score,
      passed: result.passed,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      gradedQuestions: result.gradedQuestions.map(
        (question: GradedQuestion) =>
          new GradedQuestionDTO({
            questionId: question.questionId,
            selectedOptionId: question.selectedOptionId,
            correctOptionId: question.correctOptionId,
            isCorrect: question.isCorrect,
            explanation: question.explanation ?? null,
            feedback: question.feedback ?? null,
          }),
      ),
    });
  }
}
