/*
 * Funcionalidad: Controlador del panel de administración
 * Descripción: Endpoints /api/admin para el panel docente y administrativo: listado y detalle de estudiantes, listado de profesores, cambio de rol (delegado en ChangeUserRoleUseCase de usuarios) y estadísticas de la plataforma
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { GetAdminStudentProgressUseCase } from "@/features/admin/application/use-cases/get-admin-student-progress.usecase";
import { GetAdminStudentsUseCase } from "@/features/admin/application/use-cases/get-admin-students.usecase";
import { GetAdminTeachersUseCase } from "@/features/admin/application/use-cases/get-admin-teachers.usecase";
import { GetPlatformStatisticsUseCase } from "@/features/admin/application/use-cases/get-platform-statistics.usecase";
import {
  type AdminStudentListItem,
  type AdminStudentProgressDetail,
  type AdminStudentSortByValue,
  type AdminTeacherItem,
  type PlatformStatistics,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { AdminTeacherDTO, PlatformStatisticsDTO } from "@/features/admin/presentation/dtos/admin-platform.dto";
import { ChangeUserRoleDTO, GetAdminStudentsQueryDTO, GetAdminTeachersQueryDTO } from "@/features/admin/presentation/dtos/admin-request.dto";
import { AdminStudentListItemDTO, AdminStudentProgressDTO } from "@/features/admin/presentation/dtos/admin-student.dto";
import { AdminMapper } from "@/features/admin/presentation/mappers/admin.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";

@ApiTags("Admin")
@ApiBearerAuth("JWT-auth")
@Controller("api/admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  public constructor(
    private readonly _getAdminStudentsUseCase: GetAdminStudentsUseCase,
    private readonly _getAdminStudentProgressUseCase: GetAdminStudentProgressUseCase,
    private readonly _getAdminTeachersUseCase: GetAdminTeachersUseCase,
    private readonly _changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly _getPlatformStatisticsUseCase: GetPlatformStatisticsUseCase,
  ) {}

  @Get("students")
  @RequirePermissions("students:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get dashboard students",
    description: "Paginated students with progress summary and group; myGroups=true limits it to the caller's groups as teacher",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Students retrieved successfully", type: AdminStudentListItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getStudents(
    @Query() query: GetAdminStudentsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AdminStudentListItemDTO[]>> {
    const students: Paginated<AdminStudentListItem> = await this._getAdminStudentsUseCase.execute({
      page: query.page,
      limit: query.limit,
      groupId: query.groupId,
      teacherId: query.myGroups === "true" ? currentUser.sub : undefined,
      search: query.search,
      sortBy: (query.sortBy ?? "name") as AdminStudentSortByValue,
      sortOrder: query.sortOrder ?? "asc",
    });

    return new APIResponseBuilder<AdminStudentListItemDTO[]>()
      .setData(students.data.map((student: AdminStudentListItem) => AdminMapper.toStudentListItemDTO(student)))
      .setMessage(await i18n.t("admin.students_retrieved"))
      .setPagination(students.pagination)
      .build();
  }

  @Get("students/:id/progress")
  @RequirePermissions("students:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get dashboard student progress", description: "Full activity detail and statistics of a student" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Student progress retrieved successfully", type: AdminStudentProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "The user is not a student" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getStudentProgress(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<AdminStudentProgressDTO>> {
    const detail: AdminStudentProgressDetail = await this._getAdminStudentProgressUseCase.execute(id);

    return new APIResponseBuilder<AdminStudentProgressDTO>()
      .setData(AdminMapper.toStudentProgressDTO(detail))
      .setMessage(await i18n.t("admin.student_progress_retrieved"))
      .build();
  }

  @Get("teachers")
  @RequirePermissions("users:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get dashboard teachers", description: "Teachers and admins ordered by name with their groups and student counts" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Teachers retrieved successfully", type: AdminTeacherDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getTeachers(@Query() query: GetAdminTeachersQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<AdminTeacherDTO[]>> {
    const teachers: AdminTeacherItem[] = await this._getAdminTeachersUseCase.execute(query.search);

    return new APIResponseBuilder<AdminTeacherDTO[]>()
      .setData(teachers.map((teacher: AdminTeacherItem) => AdminMapper.toTeacherDTO(teacher)))
      .setMessage(await i18n.t("admin.teachers_retrieved"))
      .build();
  }

  @Patch("users/:id/role")
  @RequirePermissions("users:update_role")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change user role",
    description: "Alias of PATCH api/users/:id/role: changes the role of another user with the same effects; the superadmin's role cannot change",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Role changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Invalid role or own role change" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or superadmin target" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async changeUserRole(
    @Param("id") id: string,
    @Body() dto: ChangeUserRoleDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changeUserRoleUseCase.execute(new ChangeUserRoleCommand({ userId: id, role: dto.role, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("admin.role_changed"))
      .build();
  }

  @Get("statistics")
  @RequirePermissions("admin-statistics:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get platform statistics", description: "Platform-wide counts, progress metrics, recent activity and ventilator reservation status" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Statistics retrieved successfully", type: PlatformStatisticsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getStatistics(@I18n() i18n: I18nContext): Promise<APIResponse<PlatformStatisticsDTO>> {
    const statistics: PlatformStatistics = await this._getPlatformStatisticsUseCase.execute();

    return new APIResponseBuilder<PlatformStatisticsDTO>()
      .setData(AdminMapper.toStatisticsDTO(statistics))
      .setMessage(await i18n.t("admin.statistics_retrieved"))
      .build();
  }
}
