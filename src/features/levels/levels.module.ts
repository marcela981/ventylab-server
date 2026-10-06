/*
 * Funcionalidad: Módulo LevelsModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de niveles y declara sus importaciones y exportaciones de NestJS
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
import { AddLevelPrerequisiteUseCase } from "@/features/levels/application/use-cases/add-level-prerequisite.usecase";
import { CheckLevelCanDeleteUseCase } from "@/features/levels/application/use-cases/check-level-can-delete.usecase";
import { CreateLevelNodeUseCase } from "@/features/levels/application/use-cases/create-level-node.usecase";
import { CreateLevelUseCase } from "@/features/levels/application/use-cases/create-level.usecase";
import { DeleteLevelUseCase } from "@/features/levels/application/use-cases/delete-level.usecase";
import { GetLevelByIdUseCase } from "@/features/levels/application/use-cases/get-level-by-id.usecase";
import { GetLevelModulesUseCase } from "@/features/levels/application/use-cases/get-level-modules.usecase";
import { GetLevelPrerequisitesUseCase } from "@/features/levels/application/use-cases/get-level-prerequisites.usecase";
import { GetLevelUnlockStatusUseCase } from "@/features/levels/application/use-cases/get-level-unlock-status.usecase";
import { GetLevelsCurriculumUseCase } from "@/features/levels/application/use-cases/get-levels-curriculum.usecase";
import { GetLevelsUseCase } from "@/features/levels/application/use-cases/get-levels.usecase";
import { GetUserRoadmapUseCase } from "@/features/levels/application/use-cases/get-user-roadmap.usecase";
import { RemoveLevelPrerequisiteUseCase } from "@/features/levels/application/use-cases/remove-level-prerequisite.usecase";
import { ReorderLevelsUseCase } from "@/features/levels/application/use-cases/reorder-levels.usecase";
import { SetLevelPrerequisitesUseCase } from "@/features/levels/application/use-cases/set-level-prerequisites.usecase";
import { UpdateLevelNodeUseCase } from "@/features/levels/application/use-cases/update-level-node.usecase";
import { UpdateLevelUseCase } from "@/features/levels/application/use-cases/update-level.usecase";
import { LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";
import { LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { LevelsChangeLogHandlers } from "@/features/levels/infrastructure/events/levels-changelog.handlers";
import { LevelQueriesPrismaRepository } from "@/features/levels/infrastructure/persistence/prisma/repositories/level-queries-prisma.repository";
import { LevelsPrismaRepository } from "@/features/levels/infrastructure/persistence/prisma/repositories/levels-prisma.repository";
import { LevelsController } from "@/features/levels/presentation/controllers/levels.controller";
import { SectionsModule } from "@/features/sections/sections.module";

@Module({
  imports: [AuthModule, ChangeLogModule, CurriculumModule, SectionsModule],
  controllers: [LevelsController],
  providers: [
    LevelsChangeLogHandlers,
    {
      provide: LEVELS_REPOSITORY_TOKEN,
      useClass: LevelsPrismaRepository,
    },
    {
      provide: LEVEL_QUERIES_REPOSITORY_TOKEN,
      useClass: LevelQueriesPrismaRepository,
    },
    GetLevelsUseCase,
    GetLevelsCurriculumUseCase,
    GetUserRoadmapUseCase,
    GetLevelByIdUseCase,
    GetLevelModulesUseCase,
    GetLevelPrerequisitesUseCase,
    GetLevelUnlockStatusUseCase,
    CheckLevelCanDeleteUseCase,
    CreateLevelUseCase,
    UpdateLevelUseCase,
    DeleteLevelUseCase,
    ReorderLevelsUseCase,
    AddLevelPrerequisiteUseCase,
    RemoveLevelPrerequisiteUseCase,
    SetLevelPrerequisitesUseCase,
    CreateLevelNodeUseCase,
    UpdateLevelNodeUseCase,
  ],
  exports: [
    LEVELS_REPOSITORY_TOKEN,
    GetLevelUnlockStatusUseCase,
    GetUserRoadmapUseCase,
    CreateLevelNodeUseCase,
    UpdateLevelNodeUseCase,
    DeleteLevelUseCase,
  ],
})
export class LevelsModule {}
