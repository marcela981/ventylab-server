/*
 * Funcionalidad: Resultado QuizAttemptResult
 * Descripción: Resultado de calificar y registrar un intento de quiz (identificador, puntaje, aprobación y preguntas calificadas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradedQuestion } from "@/features/quizzes/domain/read-models/quiz.read-model";

export class QuizAttemptResult {
  public readonly attemptId: string;
  public readonly score: number;
  public readonly passed: boolean;
  public readonly totalQuestions: number;
  public readonly correctAnswers: number;
  public readonly gradedQuestions: GradedQuestion[];

  public constructor({
    attemptId,
    score,
    passed,
    totalQuestions,
    correctAnswers,
    gradedQuestions,
  }: {
    attemptId: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    gradedQuestions: GradedQuestion[];
  }) {
    this.attemptId = attemptId;
    this.score = score;
    this.passed = passed;
    this.totalQuestions = totalQuestions;
    this.correctAnswers = correctAnswers;
    this.gradedQuestions = gradedQuestions;
  }
}
