/*
 * Funcionalidad: Caso de uso GetMyQuizAttemptUseCase
 * Descripción: Obtiene el intento más reciente del usuario autenticado en un quiz, o ninguno si no lo ha presentado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type QuizAttemptSummary } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type IQuizzesRepository, QUIZZES_REPOSITORY_TOKEN } from "@/features/quizzes/domain/repositories/quizzes.repository";

@Injectable()
export class GetMyQuizAttemptUseCase {
  public constructor(
    @Inject(QUIZZES_REPOSITORY_TOKEN)
    private readonly _quizzesRepository: IQuizzesRepository,
  ) {}

  public async execute(userId: string, quizId: string): Promise<QuizAttemptSummary | undefined> {
    return await this._quizzesRepository.getLatestAttempt(userId, quizId);
  }
}
