/*
 * Funcionalidad: Módulo PagesModule
 * Descripción: Registra el controlador, los casos de uso de lectura y escritura de páginas y bloques, los repositorios Prisma y el saneador HTML; importa CurriculumModule, LessonsModule y ModulesModule y exporta las lecturas de páginas que reutiliza la feature de progreso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { CurriculumModule } from "@/features/curriculum/curriculum.module";
import { LessonsModule } from "@/features/lessons/lessons.module";
import { ModulesModule } from "@/features/modules/modules.module";
import { HTML_SANITIZER_TOKEN } from "@/features/pages/application/ports/html-sanitizer.interface";
import { CreatePageBlockUseCase } from "@/features/pages/application/use-cases/create-page-block.usecase";
import { CreatePageUseCase } from "@/features/pages/application/use-cases/create-page.usecase";
import { DeletePageBlockUseCase } from "@/features/pages/application/use-cases/delete-page-block.usecase";
import { DeletePageUseCase } from "@/features/pages/application/use-cases/delete-page.usecase";
import { GetLessonContentSourceUseCase } from "@/features/pages/application/use-cases/get-lesson-content-source.usecase";
import { GetLessonPagesUseCase } from "@/features/pages/application/use-cases/get-lesson-pages.usecase";
import { GetModulePagesUseCase } from "@/features/pages/application/use-cases/get-module-pages.usecase";
import { GetPageByIdUseCase } from "@/features/pages/application/use-cases/get-page-by-id.usecase";
import { GetPageByLegacyJsonIdUseCase } from "@/features/pages/application/use-cases/get-page-by-legacy-json-id.usecase";
import { ReorderPageBlocksUseCase } from "@/features/pages/application/use-cases/reorder-page-blocks.usecase";
import { ReorderPagesUseCase } from "@/features/pages/application/use-cases/reorder-pages.usecase";
import { UpdatePageBlockUseCase } from "@/features/pages/application/use-cases/update-page-block.usecase";
import { UpdatePageUseCase } from "@/features/pages/application/use-cases/update-page.usecase";
import { PAGE_BLOCKS_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-blocks.repository";
import { PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";
import { PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";
import { PageBlocksPrismaRepository } from "@/features/pages/infrastructure/persistence/prisma/repositories/page-blocks-prisma.repository";
import { PageQueriesPrismaRepository } from "@/features/pages/infrastructure/persistence/prisma/repositories/page-queries-prisma.repository";
import { PagesPrismaRepository } from "@/features/pages/infrastructure/persistence/prisma/repositories/pages-prisma.repository";
import { SanitizeHtmlSanitizer } from "@/features/pages/infrastructure/security/sanitize-html.sanitizer";
import { PagesController } from "@/features/pages/presentation/controllers/pages.controller";

@Module({
  imports: [AuthModule, CurriculumModule, LessonsModule, ModulesModule],
  controllers: [PagesController],
  providers: [
    {
      provide: PAGE_QUERIES_REPOSITORY_TOKEN,
      useClass: PageQueriesPrismaRepository,
    },
    {
      provide: PAGES_REPOSITORY_TOKEN,
      useClass: PagesPrismaRepository,
    },
    {
      provide: PAGE_BLOCKS_REPOSITORY_TOKEN,
      useClass: PageBlocksPrismaRepository,
    },
    {
      provide: HTML_SANITIZER_TOKEN,
      useClass: SanitizeHtmlSanitizer,
    },
    GetPageByIdUseCase,
    GetPageByLegacyJsonIdUseCase,
    GetLessonContentSourceUseCase,
    GetModulePagesUseCase,
    GetLessonPagesUseCase,
    CreatePageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,
    ReorderPagesUseCase,
    CreatePageBlockUseCase,
    UpdatePageBlockUseCase,
    DeletePageBlockUseCase,
    ReorderPageBlocksUseCase,
  ],
  exports: [PAGE_QUERIES_REPOSITORY_TOKEN, GetLessonPagesUseCase, GetPageByIdUseCase],
})
export class PagesModule {}
