/*
 * Funcionalidad: Módulo ChangeLogModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de historial de cambios y declara sus importaciones y exportaciones de NestJS
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { GetChangeStatsUseCase } from "@/features/changelog/application/use-cases/get-change-stats.usecase";
import { GetChangeLogUseCase } from "@/features/changelog/application/use-cases/get-changelog.usecase";
import { GetEntityHistoryUseCase } from "@/features/changelog/application/use-cases/get-entity-history.usecase";
import { GetRecentChangesUseCase } from "@/features/changelog/application/use-cases/get-recent-changes.usecase";
import { RecordChangeUseCase } from "@/features/changelog/application/use-cases/record-change.usecase";
import { CHANGELOG_REPOSITORY_TOKEN } from "@/features/changelog/domain/repositories/changelog.repository";
import { ChangeLogPrismaRepository } from "@/features/changelog/infrastructure/persistence/prisma/repositories/changelog-prisma.repository";
import { ChangeLogController } from "@/features/changelog/presentation/controllers/changelog.controller";

@Module({
  imports: [AuthModule],
  controllers: [ChangeLogController],
  providers: [
    {
      provide: CHANGELOG_REPOSITORY_TOKEN,
      useClass: ChangeLogPrismaRepository,
    },
    RecordChangeUseCase,
    GetChangeLogUseCase,
    GetRecentChangesUseCase,
    GetChangeStatsUseCase,
    GetEntityHistoryUseCase,
  ],
  exports: [RecordChangeUseCase],
})
export class ChangeLogModule {}
