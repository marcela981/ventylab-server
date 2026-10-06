/*
 * Funcionalidad: Módulo StepsModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de pasos (tarjetas) y declara sus importaciones y exportaciones de NestJS
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
import { CreateStepUseCase } from "@/features/steps/application/use-cases/create-step.usecase";
import { DeleteStepUseCase } from "@/features/steps/application/use-cases/delete-step.usecase";
import { GetAdjacentStepUseCase } from "@/features/steps/application/use-cases/get-adjacent-step.usecase";
import { GetStepByIdUseCase } from "@/features/steps/application/use-cases/get-step-by-id.usecase";
import { GetStepsUseCase } from "@/features/steps/application/use-cases/get-steps.usecase";
import { ReorderStepsUseCase } from "@/features/steps/application/use-cases/reorder-steps.usecase";
import { UpdateStepUseCase } from "@/features/steps/application/use-cases/update-step.usecase";
import { STEP_QUERIES_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/step-queries.repository";
import { STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { StepsChangeLogHandlers } from "@/features/steps/infrastructure/events/steps-changelog.handlers";
import { StepQueriesPrismaRepository } from "@/features/steps/infrastructure/persistence/prisma/repositories/step-queries-prisma.repository";
import { StepsPrismaRepository } from "@/features/steps/infrastructure/persistence/prisma/repositories/steps-prisma.repository";
import { StepsController } from "@/features/steps/presentation/controllers/steps.controller";

@Module({
  imports: [AuthModule, ChangeLogModule, LessonsModule],
  controllers: [StepsController],
  providers: [
    StepsChangeLogHandlers,
    {
      provide: STEPS_REPOSITORY_TOKEN,
      useClass: StepsPrismaRepository,
    },
    {
      provide: STEP_QUERIES_REPOSITORY_TOKEN,
      useClass: StepQueriesPrismaRepository,
    },
    GetStepsUseCase,
    GetStepByIdUseCase,
    GetAdjacentStepUseCase,
    CreateStepUseCase,
    UpdateStepUseCase,
    DeleteStepUseCase,
    ReorderStepsUseCase,
  ],
  exports: [STEPS_REPOSITORY_TOKEN],
})
export class StepsModule {}
