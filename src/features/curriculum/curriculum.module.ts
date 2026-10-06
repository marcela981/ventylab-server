/*
 * Funcionalidad: Módulo CurriculumModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de currículo y declara sus importaciones y exportaciones de NestJS
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { CheckModuleUnlockedUseCase } from "@/features/curriculum/application/use-cases/check-module-unlocked.usecase";
import { ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import { DeleteCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/delete-curriculum-subtree.usecase";
import { GetCurriculumLevelUseCase } from "@/features/curriculum/application/use-cases/get-curriculum-level.usecase";
import { GetCurriculumOverviewUseCase } from "@/features/curriculum/application/use-cases/get-curriculum-overview.usecase";
import { GetNextModuleUseCase } from "@/features/curriculum/application/use-cases/get-next-module.usecase";
import { GetStudentCurriculumTreeUseCase } from "@/features/curriculum/application/use-cases/get-student-curriculum-tree.usecase";
import { InspectCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/inspect-curriculum-subtree.usecase";
import { CURRICULUM_QUERIES_REPOSITORY_TOKEN } from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { CURRICULUM_SUBTREE_REPOSITORY_TOKEN } from "@/features/curriculum/domain/repositories/curriculum-subtree.repository";
import { CurriculumQueriesPrismaRepository } from "@/features/curriculum/infrastructure/persistence/prisma/repositories/curriculum-queries-prisma.repository";
import { CurriculumSubtreePrismaRepository } from "@/features/curriculum/infrastructure/persistence/prisma/repositories/curriculum-subtree-prisma.repository";
import { CurriculumController } from "@/features/curriculum/presentation/controllers/curriculum.controller";

@Module({
  imports: [AuthModule],
  controllers: [CurriculumController],
  providers: [
    {
      provide: CURRICULUM_QUERIES_REPOSITORY_TOKEN,
      useClass: CurriculumQueriesPrismaRepository,
    },
    GetCurriculumLevelUseCase,
    GetCurriculumOverviewUseCase,
    CheckModuleUnlockedUseCase,
    {
      provide: CURRICULUM_SUBTREE_REPOSITORY_TOKEN,
      useClass: CurriculumSubtreePrismaRepository,
    },
    GetNextModuleUseCase,
    ComputeCurriculumUnlockUseCase,
    GetStudentCurriculumTreeUseCase,
    InspectCurriculumSubtreeUseCase,
    DeleteCurriculumSubtreeUseCase,
  ],
  exports: [
    CheckModuleUnlockedUseCase,
    GetNextModuleUseCase,
    ComputeCurriculumUnlockUseCase,
    InspectCurriculumSubtreeUseCase,
    DeleteCurriculumSubtreeUseCase,
  ],
})
export class CurriculumModule {}
