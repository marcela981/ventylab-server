/*
 * Funcionalidad: Caso de uso GetQuizByIdUseCase
 * Descripción: Obtiene un quiz activo con sus preguntas; oculta las respuestas correctas, el feedback y la explicación hasta que el usuario registre su intento, salvo que pueda gestionar quizzes; rechaza quizzes inexistentes o inactivos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { QuizInactiveError, QuizNotFoundError } from "@/features/quizzes/domain/quizzes.errors";
import { type QuizDetail, type QuizDetailView } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type IQuizzesRepository, QUIZZES_REPOSITORY_TOKEN } from "@/features/quizzes/domain/repositories/quizzes.repository";
import { hideQuizAnswers } from "@/features/quizzes/domain/services/quiz-answer-visibility";

export interface GetQuizByIdQuery {
  quizId: string;
  userId: string;
  canManageQuizzes: boolean;
}

/**
 * @throws {QuizNotFoundError} If the quiz does not exist
 * @throws {QuizInactiveError} If the quiz is inactive
 */
@Injectable()
export class GetQuizByIdUseCase {
  public constructor(
    @Inject(QUIZZES_REPOSITORY_TOKEN)
    private readonly _quizzesRepository: IQuizzesRepository,
  ) {}

  public async execute(query: GetQuizByIdQuery): Promise<QuizDetailView> {
    const quiz: QuizDetail | undefined = await this._quizzesRepository.getById(query.quizId);

    if (!quiz) {
      throw new QuizNotFoundError();
    }

    if (!quiz.isActive) {
      throw new QuizInactiveError();
    }

    const answersRevealed: boolean = query.canManageQuizzes || (await this._quizzesRepository.hasAttempt(query.userId, query.quizId));

    return {
      ...quiz,
      questions: answersRevealed ? quiz.questions : hideQuizAnswers(quiz.questions),
      answersRevealed,
    };
  }
}
