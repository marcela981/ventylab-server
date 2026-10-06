/*
 * Funcionalidad: Módulo AiRatingsModule
 * Descripción: Registra las valoraciones de IA alineadas con QUEST (repositorio Prisma de ai_ratings, resolvedor de objetivos, casos de uso de upsert, lectura propia, estadísticas y exportación y los controladores /api/ai-ratings y /api/admin/ai-ratings); depende solo de AiTelemetryModule
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { RATING_TARGET_RESOLVER_TOKEN } from "@/features/ai-ratings/application/ports/rating-target-resolver.interface";
import { ExportAiRatingsUseCase } from "@/features/ai-ratings/application/use-cases/export-ai-ratings.usecase";
import { GetAiRatingStatsUseCase } from "@/features/ai-ratings/application/use-cases/get-ai-rating-stats.usecase";
import { GetMyAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/get-my-ai-rating.usecase";
import { UpsertAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/upsert-ai-rating.usecase";
import { AI_RATINGS_REPOSITORY_TOKEN } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";
import { AiRatingsPrismaRepository } from "@/features/ai-ratings/infrastructure/persistence/prisma/repositories/ai-ratings-prisma.repository";
import { RatingTargetPrismaResolver } from "@/features/ai-ratings/infrastructure/persistence/prisma/resolvers/rating-target-prisma.resolver";
import { AiRatingsAdminController } from "@/features/ai-ratings/presentation/controllers/ai-ratings-admin.controller";
import { AiRatingsController } from "@/features/ai-ratings/presentation/controllers/ai-ratings.controller";
import { AiTelemetryModule } from "@/features/ai-telemetry/ai-telemetry.module";
import { AuthModule } from "@/features/auth/auth.module";

@Module({
  imports: [AuthModule, AiTelemetryModule],
  controllers: [AiRatingsController, AiRatingsAdminController],
  providers: [
    { provide: AI_RATINGS_REPOSITORY_TOKEN, useClass: AiRatingsPrismaRepository },
    { provide: RATING_TARGET_RESOLVER_TOKEN, useClass: RatingTargetPrismaResolver },
    UpsertAiRatingUseCase,
    GetMyAiRatingUseCase,
    GetAiRatingStatsUseCase,
    ExportAiRatingsUseCase,
  ],
})
export class AiRatingsModule {}
