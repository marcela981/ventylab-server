/*
 * Funcionalidad: Módulo ProgressModule
 * Descripción: Registra la feature de progreso (controladores de /api/progress y de progresión en /api/teaching, casos de uso, repositorios Prisma y manejadores de eventos de logros); registra el progreso por páginas (vistas de página, progreso ponderado por lecciones, LearningProgressFacade) y el controlador de progreso de estudiantes; importa ModulesModule (GetModuleResumeUseCase), CurriculumModule (ComputeCurriculumUnlockUseCase) y UsersModule (GetUserByIdUseCase)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { CurriculumModule } from "@/features/curriculum/curriculum.module";
import { ModulesModule } from "@/features/modules/modules.module";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { CheckContentUnlockedUseCase } from "@/features/progress/application/use-cases/check-content-unlocked.usecase";
import { CheckLessonAccessUseCase } from "@/features/progress/application/use-cases/check-lesson-access.usecase";
import { CheckModuleAccessUseCase } from "@/features/progress/application/use-cases/check-module-access.usecase";
import { GetLearningProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-learning-progress-summary.usecase";
import { GetLessonProgressDetailsUseCase } from "@/features/progress/application/use-cases/get-lesson-progress-details.usecase";
import { GetLessonProgressUseCase } from "@/features/progress/application/use-cases/get-lesson-progress.usecase";
import { GetLevelLearningProgressUseCase } from "@/features/progress/application/use-cases/get-level-learning-progress.usecase";
import { GetMilestonesUseCase } from "@/features/progress/application/use-cases/get-milestones.usecase";
import { GetModuleLearningProgressUseCase } from "@/features/progress/application/use-cases/get-module-learning-progress.usecase";
import { GetModuleProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-module-progress-summary.usecase";
import { GetProgressOverviewUseCase } from "@/features/progress/application/use-cases/get-progress-overview.usecase";
import { GetSectionLearningProgressUseCase } from "@/features/progress/application/use-cases/get-section-learning-progress.usecase";
import { GetSkillsUseCase } from "@/features/progress/application/use-cases/get-skills.usecase";
import { GetUnlockedModulesUseCase } from "@/features/progress/application/use-cases/get-unlocked-modules.usecase";
import { GetUserAchievementsUseCase } from "@/features/progress/application/use-cases/get-user-achievements.usecase";
import { RecordLessonProgressUseCase } from "@/features/progress/application/use-cases/record-lesson-progress.usecase";
import { RecordPageViewUseCase } from "@/features/progress/application/use-cases/record-page-view.usecase";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";
import { ACHIEVEMENTS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/achievements.repository";
import { LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { PROGRESS_QUERIES_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress-queries.repository";
import { PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { ProgressEventsHandlers } from "@/features/progress/infrastructure/events/progress-events.handlers";
import { AchievementsPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/achievements-prisma.repository";
import { LearningProgressPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/learning-progress-prisma.repository";
import { ProgressPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/progress-prisma.repository";
import { ProgressQueriesPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/progress-queries-prisma.repository";
import { ProgressController } from "@/features/progress/presentation/controllers/progress.controller";
import { StudentProgressController } from "@/features/progress/presentation/controllers/student-progress.controller";
import { TeachingProgressController } from "@/features/progress/presentation/controllers/teaching-progress.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, CurriculumModule, ModulesModule, UsersModule],
  controllers: [ProgressController, StudentProgressController, TeachingProgressController],
  providers: [
    ProgressEventsHandlers,
    {
      provide: PROGRESS_REPOSITORY_TOKEN,
      useClass: ProgressPrismaRepository,
    },
    {
      provide: PROGRESS_QUERIES_REPOSITORY_TOKEN,
      useClass: ProgressQueriesPrismaRepository,
    },
    {
      provide: ACHIEVEMENTS_REPOSITORY_TOKEN,
      useClass: AchievementsPrismaRepository,
    },
    {
      provide: LEARNING_PROGRESS_REPOSITORY_TOKEN,
      useClass: LearningProgressPrismaRepository,
    },
    GetProgressOverviewUseCase,
    GetModuleProgressSummaryUseCase,
    GetLessonProgressUseCase,
    GetLessonProgressDetailsUseCase,
    RecordLessonProgressUseCase,
    UpdateStepProgressUseCase,
    CheckModuleAccessUseCase,
    CheckLessonAccessUseCase,
    GetUnlockedModulesUseCase,
    GetUserAchievementsUseCase,
    UnlockAchievementsUseCase,
    GetMilestonesUseCase,
    GetSkillsUseCase,
    RecordPageViewUseCase,
    GetModuleLearningProgressUseCase,
    GetLevelLearningProgressUseCase,
    GetSectionLearningProgressUseCase,
    GetLearningProgressSummaryUseCase,
    CheckContentUnlockedUseCase,
    LearningProgressFacade,
  ],
  exports: [
    PROGRESS_REPOSITORY_TOKEN,
    ACHIEVEMENTS_REPOSITORY_TOKEN,
    GetProgressOverviewUseCase,
    GetModuleProgressSummaryUseCase,
    GetUserAchievementsUseCase,
    UnlockAchievementsUseCase,
    LearningProgressFacade,
    GetModuleLearningProgressUseCase,
    GetLevelLearningProgressUseCase,
    GetSectionLearningProgressUseCase,
    CheckContentUnlockedUseCase,
  ],
})
export class ProgressModule {}
