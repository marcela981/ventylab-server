/*
 * Funcionalidad: Módulo QuizzesModule
 * Descripción: Registra la feature de quizzes (controlador, casos de uso, repositorio Prisma y manejador de eventos); importa ProgressModule para desbloquear logros tras cada intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { ProgressModule } from "@/features/progress/progress.module";
import { AttemptQuizUseCase } from "@/features/quizzes/application/use-cases/attempt-quiz.usecase";
import { GetMyQuizAttemptUseCase } from "@/features/quizzes/application/use-cases/get-my-quiz-attempt.usecase";
import { GetMyQuizAttemptsUseCase } from "@/features/quizzes/application/use-cases/get-my-quiz-attempts.usecase";
import { GetQuizByIdUseCase } from "@/features/quizzes/application/use-cases/get-quiz-by-id.usecase";
import { GetQuizzesUseCase } from "@/features/quizzes/application/use-cases/get-quizzes.usecase";
import { QUIZZES_REPOSITORY_TOKEN } from "@/features/quizzes/domain/repositories/quizzes.repository";
import { QuizzesEventsHandlers } from "@/features/quizzes/infrastructure/events/quizzes-events.handlers";
import { QuizzesPrismaRepository } from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";
import { QuizzesController } from "@/features/quizzes/presentation/controllers/quizzes.controller";

@Module({
  imports: [AuthModule, ProgressModule],
  controllers: [QuizzesController],
  providers: [
    {
      provide: QUIZZES_REPOSITORY_TOKEN,
      useClass: QuizzesPrismaRepository,
    },
    GetQuizzesUseCase,
    GetQuizByIdUseCase,
    GetMyQuizAttemptsUseCase,
    GetMyQuizAttemptUseCase,
    AttemptQuizUseCase,
    QuizzesEventsHandlers,
  ],
  exports: [QUIZZES_REPOSITORY_TOKEN],
})
export class QuizzesModule {}
