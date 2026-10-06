/*
 * Funcionalidad: Módulo del editor del currículo
 * Descripción: Registra el controlador, los casos de uso y el repositorio Prisma del árbol del currículo, e importa los módulos de niveles, módulos y lecciones cuyos casos de uso de nodos reutiliza
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { CreateCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/create-curriculum-node.usecase";
import { DeleteCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/delete-curriculum-node.usecase";
import { GetCurriculumTreeUseCase } from "@/features/curriculum-editor/application/use-cases/get-curriculum-tree.usecase";
import { UpdateCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/update-curriculum-node.usecase";
import { CURRICULUM_TREE_REPOSITORY_TOKEN } from "@/features/curriculum-editor/domain/repositories/curriculum-tree.repository";
import { CurriculumTreePrismaRepository } from "@/features/curriculum-editor/infrastructure/persistence/prisma/repositories/curriculum-tree-prisma.repository";
import { CurriculumEditorController } from "@/features/curriculum-editor/presentation/controllers/curriculum-editor.controller";
import { LessonsModule } from "@/features/lessons/lessons.module";
import { LevelsModule } from "@/features/levels/levels.module";
import { ModulesModule } from "@/features/modules/modules.module";

@Module({
  imports: [AuthModule, LevelsModule, ModulesModule, LessonsModule],
  controllers: [CurriculumEditorController],
  providers: [
    {
      provide: CURRICULUM_TREE_REPOSITORY_TOKEN,
      useClass: CurriculumTreePrismaRepository,
    },
    GetCurriculumTreeUseCase,
    CreateCurriculumNodeUseCase,
    UpdateCurriculumNodeUseCase,
    DeleteCurriculumNodeUseCase,
  ],
})
export class CurriculumEditorModule {}
