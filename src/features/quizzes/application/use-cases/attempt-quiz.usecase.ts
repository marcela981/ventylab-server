/*
 * Funcionalidad: Caso de uso AttemptQuizUseCase
 * Descripción: Califica y registra el único intento permitido de un usuario en un quiz; serializa intentos concurrentes con un bloqueo por usuario y quiz dentro de la transacción y publica QuizAttemptedEvent tras el commit
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { AttemptQuizCommand } from "@/features/quizzes/application/commands/attempt-quiz.command";
import { QuizAttemptResult } from "@/features/quizzes/application/results/quiz-attempt.result";
import { QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import { QuizAlreadyAttemptedError, QuizNotFoundError } from "@/features/quizzes/domain/quizzes.errors";
import { type QuizDetail, type QuizGrading } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type IQuizzesRepository, QUIZZES_REPOSITORY_TOKEN } from "@/features/quizzes/domain/repositories/quizzes.repository";
import { gradeQuizAttempt } from "@/features/quizzes/domain/services/quiz-grader";

/**
 * @throws {QuizAlreadyAttemptedError} If the user already has an attempt for this quiz
 * @throws {QuizNotFoundError} If the quiz does not exist
 */
@Injectable()
export class AttemptQuizUseCase {
  public constructor(
    @Inject(QUIZZES_REPOSITORY_TOKEN)
    private readonly _quizzesRepository: IQuizzesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: AttemptQuizCommand): Promise<QuizAttemptResult> {
    const { userId, quizId, answers } = command;

    if (await this._quizzesRepository.hasAttempt(userId, quizId)) {
      throw new QuizAlreadyAttemptedError();
    }

    const quiz: QuizDetail | undefined = await this._quizzesRepository.getById(quizId);

    if (!quiz) {
      throw new QuizNotFoundError();
    }

    const grading: QuizGrading = gradeQuizAttempt(quiz.questions, answers, quiz.passingScore);

    const { attempt, events } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ attempt: QuizAttempt; events: DomainEvent[] }> => {
        await this._quizzesRepository.lockUserQuiz(userId, quizId, transaction);

        if (await this._quizzesRepository.hasAttempt(userId, quizId, transaction)) {
          throw new QuizAlreadyAttemptedError();
        }

        const created: QuizAttempt = QuizAttempt.create({
          userId,
          quizId,
          score: grading.score,
          passed: grading.passed,
          answers,
        });

        await this._quizzesRepository.save(created, transaction);

        return { attempt: created, events: created.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return new QuizAttemptResult({
      attemptId: attempt.id,
      score: grading.score,
      passed: grading.passed,
      totalQuestions: grading.totalQuestions,
      correctAnswers: grading.correctAnswers,
      gradedQuestions: grading.gradedQuestions,
    });
  }
}
