/*
 * Funcionalidad: Comando AttemptQuizCommand
 * Descripción: Datos del intento de un quiz (usuario, quiz y respuestas seleccionadas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type QuizAnswer } from "@/features/quizzes/domain/read-models/quiz.read-model";

export class AttemptQuizCommand {
  public readonly userId: string;
  public readonly quizId: string;
  public readonly answers: QuizAnswer[];

  public constructor({ userId, quizId, answers }: { userId: string; quizId: string; answers: QuizAnswer[] }) {
    this.userId = userId;
    this.quizId = quizId;
    this.answers = answers;
  }
}
