/*
 * Funcionalidad: Módulo ModulesModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de módulos y declara sus importaciones y exportaciones de NestJS
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { ChangeLogModule } from "@/features/changelog/changelog.module";
import { CurriculumModule } from "@/features/curriculum/curriculum.module";
import { LevelsModule } from "@/features/levels/levels.module";
import { AddModulePrerequisiteUseCase } from "@/features/modules/application/use-cases/add-module-prerequisite.usecase";
import { CreateModuleNodeUseCase } from "@/features/modules/application/use-cases/create-module-node.usecase";
import { CreateModuleUseCase } from "@/features/modules/application/use-cases/create-module.usecase";
import { DeleteModuleUseCase } from "@/features/modules/application/use-cases/delete-module.usecase";
import { GetModuleByIdUseCase } from "@/features/modules/application/use-cases/get-module-by-id.usecase";
import { GetModuleFullUseCase } from "@/features/modules/application/use-cases/get-module-full.usecase";
import { GetModuleLessonsCountUseCase } from "@/features/modules/application/use-cases/get-module-lessons-count.usecase";
import { GetModuleLessonsUseCase } from "@/features/modules/application/use-cases/get-module-lessons.usecase";
import { GetModuleProgressUseCase } from "@/features/modules/application/use-cases/get-module-progress.usecase";
import { GetModuleResumeUseCase } from "@/features/modules/application/use-cases/get-module-resume.usecase";
import { GetModulesUseCase } from "@/features/modules/application/use-cases/get-modules.usecase";
import { RemoveModulePrerequisiteUseCase } from "@/features/modules/application/use-cases/remove-module-prerequisite.usecase";
import { ReorderModulesUseCase } from "@/features/modules/application/use-cases/reorder-modules.usecase";
import { SetModulePrerequisitesUseCase } from "@/features/modules/application/use-cases/set-module-prerequisites.usecase";
import { UpdateModuleNodeUseCase } from "@/features/modules/application/use-cases/update-module-node.usecase";
import { UpdateModuleUseCase } from "@/features/modules/application/use-cases/update-module.usecase";
import { MODULE_PROGRESS_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-progress.repository";
import { MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";
import { MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";
import { ModulesChangeLogHandlers } from "@/features/modules/infrastructure/events/modules-changelog.handlers";
import { ModuleProgressPrismaRepository } from "@/features/modules/infrastructure/persistence/prisma/repositories/module-progress-prisma.repository";
import { ModuleQueriesPrismaRepository } from "@/features/modules/infrastructure/persistence/prisma/repositories/module-queries-prisma.repository";
import { ModulesPrismaRepository } from "@/features/modules/infrastructure/persistence/prisma/repositories/modules-prisma.repository";
import { ModulesController } from "@/features/modules/presentation/controllers/modules.controller";

@Module({
  imports: [AuthModule, ChangeLogModule, CurriculumModule, LevelsModule],
  controllers: [ModulesController],
  providers: [
    ModulesChangeLogHandlers,
    {
      provide: MODULES_REPOSITORY_TOKEN,
      useClass: ModulesPrismaRepository,
    },
    {
      provide: MODULE_QUERIES_REPOSITORY_TOKEN,
      useClass: ModuleQueriesPrismaRepository,
    },
    {
      provide: MODULE_PROGRESS_REPOSITORY_TOKEN,
      useClass: ModuleProgressPrismaRepository,
    },
    GetModulesUseCase,
    GetModuleByIdUseCase,
    GetModuleLessonsCountUseCase,
    GetModuleLessonsUseCase,
    GetModuleProgressUseCase,
    GetModuleResumeUseCase,
    CreateModuleUseCase,
    UpdateModuleUseCase,
    DeleteModuleUseCase,
    AddModulePrerequisiteUseCase,
    RemoveModulePrerequisiteUseCase,
    SetModulePrerequisitesUseCase,
    ReorderModulesUseCase,
    GetModuleFullUseCase,
    CreateModuleNodeUseCase,
    UpdateModuleNodeUseCase,
  ],
  exports: [
    MODULES_REPOSITORY_TOKEN,
    MODULE_PROGRESS_REPOSITORY_TOKEN,
    GetModuleProgressUseCase,
    GetModuleResumeUseCase,
    CreateModuleNodeUseCase,
    UpdateModuleNodeUseCase,
    DeleteModuleUseCase,
  ],
})
export class ModulesModule {}
