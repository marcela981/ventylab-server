/*
 * Funcionalidad: Módulo ActivitiesModule
 * Descripción: Registra la feature de actividades con sus tres agregados (actividad, asignación a grupo, entrega), sus controladores (/api/activities, /api/activity-assignments, /api/activity-submissions), casos de uso y repositorios Prisma; el puerto de pertenencia a grupos se resuelve con el repositorio exportado por GroupsModule
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AssignActivityUseCase } from "@/features/activities/application/use-cases/assign-activity.usecase";
import { CreateActivityUseCase } from "@/features/activities/application/use-cases/create-activity.usecase";
import { DeleteActivityUseCase } from "@/features/activities/application/use-cases/delete-activity.usecase";
import { GetActivitiesUseCase } from "@/features/activities/application/use-cases/get-activities.usecase";
import { GetActivityAssignmentsUseCase } from "@/features/activities/application/use-cases/get-activity-assignments.usecase";
import { GetActivityByIdUseCase } from "@/features/activities/application/use-cases/get-activity-by-id.usecase";
import { GetActivityCatalogItemUseCase } from "@/features/activities/application/use-cases/get-activity-catalog-item.usecase";
import { GetActivityCatalogUseCase } from "@/features/activities/application/use-cases/get-activity-catalog.usecase";
import { GetActivitySubmissionsUseCase } from "@/features/activities/application/use-cases/get-activity-submissions.usecase";
import { GetMySubmissionForActivityUseCase } from "@/features/activities/application/use-cases/get-my-submission-for-activity.usecase";
import { GetMySubmissionsUseCase } from "@/features/activities/application/use-cases/get-my-submissions.usecase";
import { GetSubmissionByIdUseCase } from "@/features/activities/application/use-cases/get-submission-by-id.usecase";
import { GradeSubmissionUseCase } from "@/features/activities/application/use-cases/grade-submission.usecase";
import { PublishActivityUseCase } from "@/features/activities/application/use-cases/publish-activity.usecase";
import { RemoveActivityAssignmentUseCase } from "@/features/activities/application/use-cases/remove-activity-assignment.usecase";
import { ResetSubmissionUseCase } from "@/features/activities/application/use-cases/reset-submission.usecase";
import { SaveSubmissionDraftUseCase } from "@/features/activities/application/use-cases/save-submission-draft.usecase";
import { StartSubmissionUseCase } from "@/features/activities/application/use-cases/start-submission.usecase";
import { SubmitSubmissionUseCase } from "@/features/activities/application/use-cases/submit-submission.usecase";
import { UpdateActivityUseCase } from "@/features/activities/application/use-cases/update-activity.usecase";
import { ACTIVITIES_REPOSITORY_TOKEN } from "@/features/activities/domain/repositories/activities.repository";
import { ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN } from "@/features/activities/domain/repositories/activity-assignments.repository";
import { ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN } from "@/features/activities/domain/repositories/activity-group-membership.repository";
import { ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN } from "@/features/activities/domain/repositories/activity-submissions.repository";
import { ActivitiesPrismaRepository } from "@/features/activities/infrastructure/persistence/prisma/repositories/activities-prisma.repository";
import { ActivityAssignmentsPrismaRepository } from "@/features/activities/infrastructure/persistence/prisma/repositories/activity-assignments-prisma.repository";
import { ActivitySubmissionsPrismaRepository } from "@/features/activities/infrastructure/persistence/prisma/repositories/activity-submissions-prisma.repository";
import { ActivitiesController } from "@/features/activities/presentation/controllers/activities.controller";
import { ActivityAssignmentsController } from "@/features/activities/presentation/controllers/activity-assignments.controller";
import { ActivitySubmissionsController } from "@/features/activities/presentation/controllers/activity-submissions.controller";
import { AuthModule } from "@/features/auth/auth.module";
import { GROUPS_REPOSITORY_TOKEN } from "@/features/groups/domain/repositories/groups.repository";
import { GroupsModule } from "@/features/groups/groups.module";

@Module({
  imports: [AuthModule, GroupsModule],
  controllers: [ActivitiesController, ActivityAssignmentsController, ActivitySubmissionsController],
  providers: [
    {
      provide: ACTIVITIES_REPOSITORY_TOKEN,
      useClass: ActivitiesPrismaRepository,
    },
    {
      provide: ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN,
      useClass: ActivityAssignmentsPrismaRepository,
    },
    {
      provide: ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
      useClass: ActivitySubmissionsPrismaRepository,
    },
    {
      provide: ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN,
      useExisting: GROUPS_REPOSITORY_TOKEN,
    },
    GetActivitiesUseCase,
    GetActivityCatalogUseCase,
    GetActivityCatalogItemUseCase,
    GetActivityByIdUseCase,
    CreateActivityUseCase,
    UpdateActivityUseCase,
    DeleteActivityUseCase,
    PublishActivityUseCase,
    GetActivitySubmissionsUseCase,
    GetActivityAssignmentsUseCase,
    AssignActivityUseCase,
    RemoveActivityAssignmentUseCase,
    GetMySubmissionsUseCase,
    GetMySubmissionForActivityUseCase,
    GetSubmissionByIdUseCase,
    StartSubmissionUseCase,
    SaveSubmissionDraftUseCase,
    SubmitSubmissionUseCase,
    GradeSubmissionUseCase,
    ResetSubmissionUseCase,
  ],
  exports: [ACTIVITIES_REPOSITORY_TOKEN, ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN, ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN],
})
export class ActivitiesModule {}
