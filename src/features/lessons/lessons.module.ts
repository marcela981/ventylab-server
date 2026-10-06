/*
 * Funcionalidad: Módulo LessonsModule
 * Descripción: Registra controladores, casos de uso, repositorios y manejadores de eventos de la feature de lecciones y declara sus importaciones y exportaciones de NestJS
 * Versión: 1.2
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
import { CompleteLessonUseCase } from "@/features/lessons/application/use-cases/complete-lesson.usecase";
import { CreateLessonUseCase } from "@/features/lessons/application/use-cases/create-lesson.usecase";
import { DeleteLessonUseCase } from "@/features/lessons/application/use-cases/delete-lesson.usecase";
import { GetAdjacentLessonUseCase } from "@/features/lessons/application/use-cases/get-adjacent-lesson.usecase";
import { GetLessonByIdUseCase } from "@/features/lessons/application/use-cases/get-lesson-by-id.usecase";
import { GetLessonContentUseCase } from "@/features/lessons/application/use-cases/get-lesson-content.usecase";
import { GetLessonStepsUseCase } from "@/features/lessons/application/use-cases/get-lesson-steps.usecase";
import { RecordLessonAccessUseCase } from "@/features/lessons/application/use-cases/record-lesson-access.usecase";
import { ReorderLessonsUseCase } from "@/features/lessons/application/use-cases/reorder-lessons.usecase";
import { SaveLessonBlocksUseCase } from "@/features/lessons/application/use-cases/save-lesson-blocks.usecase";
import { UpdateLessonUseCase } from "@/features/lessons/application/use-cases/update-lesson.usecase";
import { LESSON_PROGRESS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-progress.repository";
import { LESSON_QUERIES_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-queries.repository";
import { LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { LessonsChangeLogHandlers } from "@/features/lessons/infrastructure/events/lessons-changelog.handlers";
import { LessonProgressPrismaRepository } from "@/features/lessons/infrastructure/persistence/prisma/repositories/lesson-progress-prisma.repository";
import { LessonQueriesPrismaRepository } from "@/features/lessons/infrastructure/persistence/prisma/repositories/lesson-queries-prisma.repository";
import { LessonsPrismaRepository } from "@/features/lessons/infrastructure/persistence/prisma/repositories/lessons-prisma.repository";
import { LessonsController } from "@/features/lessons/presentation/controllers/lessons.controller";
import { ModulesModule } from "@/features/modules/modules.module";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, ChangeLogModule, CurriculumModule, ModulesModule, UsersModule],
  controllers: [LessonsController],
  providers: [
    LessonsChangeLogHandlers,
    {
      provide: LESSONS_REPOSITORY_TOKEN,
      useClass: LessonsPrismaRepository,
    },
    {
      provide: LESSON_QUERIES_REPOSITORY_TOKEN,
      useClass: LessonQueriesPrismaRepository,
    },
    {
      provide: LESSON_PROGRESS_REPOSITORY_TOKEN,
      useClass: LessonProgressPrismaRepository,
    },
    GetLessonByIdUseCase,
    GetAdjacentLessonUseCase,
    GetLessonStepsUseCase,
    GetLessonContentUseCase,
    CreateLessonUseCase,
    UpdateLessonUseCase,
    DeleteLessonUseCase,
    SaveLessonBlocksUseCase,
    CompleteLessonUseCase,
    RecordLessonAccessUseCase,
    ReorderLessonsUseCase,
  ],
  exports: [
    LESSONS_REPOSITORY_TOKEN,
    LESSON_PROGRESS_REPOSITORY_TOKEN,
    GetLessonByIdUseCase,
    CompleteLessonUseCase,
    RecordLessonAccessUseCase,
    GetLessonContentUseCase,
    SaveLessonBlocksUseCase,
  ],
})
export class LessonsModule {}
