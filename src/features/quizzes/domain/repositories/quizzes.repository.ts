/*
 * Funcionalidad: Repositorio de quizzes
 * Descripción: Contrato y token del repositorio de quizzes e intentos (listados, detalle, intentos del usuario, bloqueo por usuario y quiz, guardado del intento)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import {
  type QuizAttemptSummary,
  type QuizDetail,
  type QuizSummary,
} from "@/features/quizzes/domain/read-models/quiz.read-model";

export const QUIZZES_REPOSITORY_TOKEN: unique symbol = Symbol("QUIZZES_REPOSITORY_TOKEN");

export interface IQuizzesRepository {
  getActiveQuizzes(moduleId?: string): Promise<QuizSummary[]>;
  getById(quizId: string, transaction?: unknown): Promise<QuizDetail | undefined>;
  getAttemptsByUser(userId: string): Promise<QuizAttemptSummary[]>;
  getLatestAttempt(userId: string, quizId: string): Promise<QuizAttemptSummary | undefined>;
  hasAttempt(userId: string, quizId: string, transaction?: unknown): Promise<boolean>;
  lockUserQuiz(userId: string, quizId: string, transaction: unknown): Promise<void>;
  save(attempt: QuizAttempt, transaction?: unknown): Promise<void>;
}
