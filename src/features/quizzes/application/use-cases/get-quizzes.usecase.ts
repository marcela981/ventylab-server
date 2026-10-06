/*
 * Funcionalidad: Caso de uso GetQuizzesUseCase
 * Descripción: Lista los quizzes activos, opcionalmente filtrados por módulo, sin incluir las preguntas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type QuizSummary } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type IQuizzesRepository, QUIZZES_REPOSITORY_TOKEN } from "@/features/quizzes/domain/repositories/quizzes.repository";

@Injectable()
export class GetQuizzesUseCase {
  public constructor(
    @Inject(QUIZZES_REPOSITORY_TOKEN)
    private readonly _quizzesRepository: IQuizzesRepository,
  ) {}

  public async execute(moduleId?: string): Promise<QuizSummary[]> {
    return await this._quizzesRepository.getActiveQuizzes(moduleId);
  }
}
