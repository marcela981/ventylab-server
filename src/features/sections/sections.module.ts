/*
 * Funcionalidad: Módulo SectionsModule
 * Descripción: Registra el controlador, los casos de uso y los repositorios de la feature de secciones; importa CurriculumModule para la eliminación guardada de subárboles y exporta SECTIONS_REPOSITORY_TOKEN para validar secciones desde niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { CurriculumModule } from "@/features/curriculum/curriculum.module";
import { CreateSectionUseCase } from "@/features/sections/application/use-cases/create-section.usecase";
import { DeleteSectionUseCase } from "@/features/sections/application/use-cases/delete-section.usecase";
import { GetSectionByIdUseCase } from "@/features/sections/application/use-cases/get-section-by-id.usecase";
import { GetSectionLevelsUseCase } from "@/features/sections/application/use-cases/get-section-levels.usecase";
import { GetSectionsUseCase } from "@/features/sections/application/use-cases/get-sections.usecase";
import { ReorderSectionsUseCase } from "@/features/sections/application/use-cases/reorder-sections.usecase";
import { UpdateSectionUseCase } from "@/features/sections/application/use-cases/update-section.usecase";
import { SECTION_QUERIES_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/section-queries.repository";
import { SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { SectionQueriesPrismaRepository } from "@/features/sections/infrastructure/persistence/prisma/repositories/section-queries-prisma.repository";
import { SectionsPrismaRepository } from "@/features/sections/infrastructure/persistence/prisma/repositories/sections-prisma.repository";
import { SectionsController } from "@/features/sections/presentation/controllers/sections.controller";

@Module({
  imports: [AuthModule, CurriculumModule],
  controllers: [SectionsController],
  providers: [
    {
      provide: SECTIONS_REPOSITORY_TOKEN,
      useClass: SectionsPrismaRepository,
    },
    {
      provide: SECTION_QUERIES_REPOSITORY_TOKEN,
      useClass: SectionQueriesPrismaRepository,
    },
    GetSectionsUseCase,
    GetSectionByIdUseCase,
    GetSectionLevelsUseCase,
    CreateSectionUseCase,
    UpdateSectionUseCase,
    ReorderSectionsUseCase,
    DeleteSectionUseCase,
  ],
  exports: [SECTIONS_REPOSITORY_TOKEN],
})
export class SectionsModule {}
