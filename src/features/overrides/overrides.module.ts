/*
 * Funcionalidad: Módulo OverridesModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de personalizaciones de contenido por estudiante y declara sus importaciones y exportaciones de NestJS
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { ChangeLogModule } from "@/features/changelog/changelog.module";
import { LessonsModule } from "@/features/lessons/lessons.module";
import { LevelsModule } from "@/features/levels/levels.module";
import { CanManageOverridesUseCase } from "@/features/overrides/application/use-cases/can-manage-overrides.usecase";
import { CreateOverrideUseCase } from "@/features/overrides/application/use-cases/create-override.usecase";
import { DeleteOverrideUseCase } from "@/features/overrides/application/use-cases/delete-override.usecase";
import { GetOverrideByIdUseCase } from "@/features/overrides/application/use-cases/get-override-by-id.usecase";
import { GetStudentOverridesUseCase } from "@/features/overrides/application/use-cases/get-student-overrides.usecase";
import { UpdateOverrideUseCase } from "@/features/overrides/application/use-cases/update-override.usecase";
import { OVERRIDES_REPOSITORY_TOKEN } from "@/features/overrides/domain/repositories/overrides.repository";
import { OverridesChangeLogHandlers } from "@/features/overrides/infrastructure/events/overrides-changelog.handlers";
import { OverridesPrismaRepository } from "@/features/overrides/infrastructure/persistence/prisma/repositories/overrides-prisma.repository";
import { OverridesController } from "@/features/overrides/presentation/controllers/overrides.controller";
import { StepsModule } from "@/features/steps/steps.module";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, ChangeLogModule, UsersModule, LevelsModule, LessonsModule, StepsModule],
  controllers: [OverridesController],
  providers: [
    OverridesChangeLogHandlers,
    {
      provide: OVERRIDES_REPOSITORY_TOKEN,
      useClass: OverridesPrismaRepository,
    },
    CanManageOverridesUseCase,
    CreateOverrideUseCase,
    GetStudentOverridesUseCase,
    GetOverrideByIdUseCase,
    UpdateOverrideUseCase,
    DeleteOverrideUseCase,
  ],
  exports: [OVERRIDES_REPOSITORY_TOKEN],
})
export class OverridesModule {}
