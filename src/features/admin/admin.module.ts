/*
 * Funcionalidad: Módulo AdminModule
 * Descripción: Registra la feature de panel de administración (controlador /api/admin, casos de uso de lectura y repositorio de modelo de lectura Prisma); importa UsersModule para el cambio de rol, ProgressModule para contar logros y AiModule para el catálogo de proveedores de IA (AiGateway)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { GetAdminStudentProgressUseCase } from "@/features/admin/application/use-cases/get-admin-student-progress.usecase";
import { GetAdminStudentsUseCase } from "@/features/admin/application/use-cases/get-admin-students.usecase";
import { GetAdminTeachersUseCase } from "@/features/admin/application/use-cases/get-admin-teachers.usecase";
import { GetAiProvidersUseCase } from "@/features/admin/application/use-cases/get-ai-providers.usecase";
import { GetPlatformStatisticsUseCase } from "@/features/admin/application/use-cases/get-platform-statistics.usecase";
import { ADMIN_DASHBOARD_REPOSITORY_TOKEN } from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { AdminDashboardPrismaRepository } from "@/features/admin/infrastructure/persistence/prisma/repositories/admin-dashboard-prisma.repository";
import { AdminController } from "@/features/admin/presentation/controllers/admin.controller";
import { AiModule } from "@/features/ai/ai.module";
import { AuthModule } from "@/features/auth/auth.module";
import { ProgressModule } from "@/features/progress/progress.module";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, UsersModule, ProgressModule, AiModule],
  controllers: [AdminController],
  providers: [
    {
      provide: ADMIN_DASHBOARD_REPOSITORY_TOKEN,
      useClass: AdminDashboardPrismaRepository,
    },
    GetAdminStudentsUseCase,
    GetAdminStudentProgressUseCase,
    GetAdminTeachersUseCase,
    GetAiProvidersUseCase,
    GetPlatformStatisticsUseCase,
  ],
  exports: [GetPlatformStatisticsUseCase],
})
export class AdminModule {}
