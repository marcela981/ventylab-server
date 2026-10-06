/*
 * Funcionalidad: Módulo UsersModule
 * Descripción: Registra controlador, casos de uso, repositorios (usuarios, estadísticas y membresías de grupo), el correo del superadministrador, el arranque que fuerza su rol ADMIN y los manejadores de eventos de la feature de usuarios; exporta UsersFacade y los proveedores que aún usan otras features
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { ChangePasswordUseCase } from "@/features/users/application/use-cases/change-password.usecase";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";
import { ChangeUserStatusUseCase } from "@/features/users/application/use-cases/change-user-status.usecase";
import { CreateUserUseCase } from "@/features/users/application/use-cases/create-user.usecase";
import { EnsureSuperadminUseCase } from "@/features/users/application/use-cases/ensure-superadmin.usecase";
import { FindOrCreateGoogleUserUseCase } from "@/features/users/application/use-cases/find-or-create-google-user.usecase";
import { GetStudentByIdUseCase } from "@/features/users/application/use-cases/get-student-by-id.usecase";
import { GetStudentsUseCase } from "@/features/users/application/use-cases/get-students.usecase";
import { GetUserByIdUseCase } from "@/features/users/application/use-cases/get-user-by-id.usecase";
import { GetUserStatsUseCase } from "@/features/users/application/use-cases/get-user-stats.usecase";
import { GetUsersUseCase } from "@/features/users/application/use-cases/get-users.usecase";
import { UpdateProfileUseCase } from "@/features/users/application/use-cases/update-profile.usecase";
import { USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/user-group-memberships.repository";
import { USER_STATISTICS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/user-statistics.repository";
import { USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { SuperadminBootstrapService } from "@/features/users/infrastructure/bootstrap/superadmin-bootstrap.service";
import { UsersEventsHandlers } from "@/features/users/infrastructure/events/users-events.handlers";
import { UserGroupMembershipsPrismaRepository } from "@/features/users/infrastructure/persistence/prisma/repositories/user-group-memberships-prisma.repository";
import { UserStatisticsPrismaRepository } from "@/features/users/infrastructure/persistence/prisma/repositories/user-statistics-prisma.repository";
import { UsersPrismaRepository } from "@/features/users/infrastructure/persistence/prisma/repositories/users-prisma.repository";
import { UsersController } from "@/features/users/presentation/controllers/users.controller";

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: SUPERADMIN_EMAIL_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>): string =>
        configService.get("SUPERADMIN_EMAIL", { infer: true }),
    },
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersPrismaRepository,
    },
    {
      provide: USER_STATISTICS_REPOSITORY_TOKEN,
      useClass: UserStatisticsPrismaRepository,
    },
    {
      provide: USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN,
      useClass: UserGroupMembershipsPrismaRepository,
    },
    CreateUserUseCase,
    GetUserByIdUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    ChangeUserRoleUseCase,
    GetUserStatsUseCase,
    GetStudentsUseCase,
    GetStudentByIdUseCase,
    GetUsersUseCase,
    ChangeUserStatusUseCase,
    FindOrCreateGoogleUserUseCase,
    EnsureSuperadminUseCase,
    UsersFacade,
    SuperadminBootstrapService,
    UsersEventsHandlers,
  ],
  exports: [
    USERS_REPOSITORY_TOKEN,
    SUPERADMIN_EMAIL_TOKEN,
    CreateUserUseCase,
    GetUserByIdUseCase,
    ChangeUserRoleUseCase,
    UsersFacade,
  ],
})
export class UsersModule {}
