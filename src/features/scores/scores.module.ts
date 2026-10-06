/*
 * Funcionalidad: Módulo ScoresModule
 * Descripción: Registra la feature de calificaciones (controlador /api/scores, casos de uso, repositorio Prisma y el manejador que registra la nota de las entregas de actividades calificadas); exporta el repositorio y UpsertScoreUseCase
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { DeleteScoreUseCase } from "@/features/scores/application/use-cases/delete-score.usecase";
import { GetGraderScoresUseCase } from "@/features/scores/application/use-cases/get-grader-scores.usecase";
import { GetStudentScoresUseCase } from "@/features/scores/application/use-cases/get-student-scores.usecase";
import { UpsertScoreUseCase } from "@/features/scores/application/use-cases/upsert-score.usecase";
import { SCORES_REPOSITORY_TOKEN } from "@/features/scores/domain/repositories/scores.repository";
import { ScoresEventsHandlers } from "@/features/scores/infrastructure/events/scores-events.handlers";
import { ScoresPrismaRepository } from "@/features/scores/infrastructure/persistence/prisma/repositories/scores-prisma.repository";
import { ScoresController } from "@/features/scores/presentation/controllers/scores.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ScoresController],
  providers: [
    {
      provide: SCORES_REPOSITORY_TOKEN,
      useClass: ScoresPrismaRepository,
    },
    UpsertScoreUseCase,
    DeleteScoreUseCase,
    GetStudentScoresUseCase,
    GetGraderScoresUseCase,
    ScoresEventsHandlers,
  ],
  exports: [SCORES_REPOSITORY_TOKEN, UpsertScoreUseCase],
})
export class ScoresModule {}
