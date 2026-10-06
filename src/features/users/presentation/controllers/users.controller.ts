/*
 * Funcionalidad: Controlador UsersController
 * Descripción: Expone las rutas api/users de perfil propio (me), contraseña, estadísticas, estudiantes, listado paginado de usuarios y cambio de rol y de estado de cuenta; las rutas me se declaran antes que las de :id
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ChangePasswordCommand } from "@/features/users/application/commands/change-password.command";
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { ChangeUserStatusCommand } from "@/features/users/application/commands/change-user-status.command";
import { GetStudentByIdCommand } from "@/features/users/application/commands/get-student-by-id.command";
import { UpdateProfileCommand } from "@/features/users/application/commands/update-profile.command";
import { StudentResult } from "@/features/users/application/results/student.result";
import { ChangePasswordUseCase } from "@/features/users/application/use-cases/change-password.usecase";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";
import { ChangeUserStatusUseCase } from "@/features/users/application/use-cases/change-user-status.usecase";
import { GetStudentByIdUseCase } from "@/features/users/application/use-cases/get-student-by-id.usecase";
import { GetStudentsUseCase } from "@/features/users/application/use-cases/get-students.usecase";
import { GetUserByIdUseCase } from "@/features/users/application/use-cases/get-user-by-id.usecase";
import { GetUserStatsUseCase } from "@/features/users/application/use-cases/get-user-stats.usecase";
import { GetUsersUseCase } from "@/features/users/application/use-cases/get-users.usecase";
import { UpdateProfileUseCase } from "@/features/users/application/use-cases/update-profile.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type UserSortByValue } from "@/features/users/domain/repositories/users.repository";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";
import { UserStats } from "@/features/users/domain/value-objects/user-stats";
import { ChangePasswordDTO } from "@/features/users/presentation/dtos/change-password.dto";
import { ChangeUserRoleDTO } from "@/features/users/presentation/dtos/change-user-role.dto";
import { ChangeUserStatusDTO } from "@/features/users/presentation/dtos/change-user-status.dto";
import { GetStudentsQueryDTO } from "@/features/users/presentation/dtos/get-students-query.dto";
import { GetUsersQueryDTO } from "@/features/users/presentation/dtos/get-users-query.dto";
import { StudentDTO } from "@/features/users/presentation/dtos/student.dto";
import { UpdateMeDTO } from "@/features/users/presentation/dtos/update-me.dto";
import { UserStatsDTO } from "@/features/users/presentation/dtos/user-stats.dto";
import { UserDTO } from "@/features/users/presentation/dtos/user.dto";
import { UsersMapper } from "@/features/users/presentation/mappers/users.mapper";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("api/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  public constructor(
    private readonly _getUserByIdUseCase: GetUserByIdUseCase,
    private readonly _updateProfileUseCase: UpdateProfileUseCase,
    private readonly _changePasswordUseCase: ChangePasswordUseCase,
    private readonly _getUserStatsUseCase: GetUserStatsUseCase,
    private readonly _getStudentsUseCase: GetStudentsUseCase,
    private readonly _getStudentByIdUseCase: GetStudentByIdUseCase,
    private readonly _getUsersUseCase: GetUsersUseCase,
    private readonly _changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly _changeUserStatusUseCase: ChangeUserStatusUseCase,
  ) {}

  @Get()
  @RequirePermissions("users:list")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get users",
    description: "Retrieves a paginated list of users filtered by search term (name, email or exact ID), role, group and account status",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Users retrieved successfully", type: UserDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getUsers(@Query() query: GetUsersQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<UserDTO[]>> {
    const users: Paginated<User> = await this._getUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      ids: query.ids,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      search: query.search,
      roles: query.role ? [query.role as UserRoleValue] : undefined,
      groupId: query.groupId,
      isActive: query.isActive,
      sortBy: query.sortBy as UserSortByValue | undefined,
      sortOrder: query.sortOrder,
    });

    return new APIResponseBuilder<UserDTO[]>()
      .setData(users.data.map((user: User) => UsersMapper.toDTO(user)))
      .setMessage(await i18n.t("users.users_retrieved"))
      .setPagination(users.pagination)
      .build();
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get current user", description: "Retrieves the authenticated user's profile" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Current user retrieved successfully", type: UserDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getCurrentUser(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<UserDTO>> {
    const user: User = await this._getUserByIdUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<UserDTO>()
      .setData(UsersMapper.toDTO(user))
      .setMessage(await i18n.t("users.user_retrieved"))
      .build();
  }

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update own profile", description: "Updates the authenticated user's name or profile image" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Profile updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async updateMe(
    @Body() dto: UpdateMeDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateProfileUseCase.execute(
      new UpdateProfileCommand({
        userId: currentUser.sub,
        name: dto.name,
        image: dto.image,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("users.profile_updated"))
      .build();
  }

  @Post("me/change-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change own password",
    description: "Changes the authenticated user's password and closes every NextAuth session of the user",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Password changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, wrong current password, or no password set" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async changePassword(
    @Body() dto: ChangePasswordDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changePasswordUseCase.execute(
      new ChangePasswordCommand({
        userId: currentUser.sub,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("users.password_changed"))
      .build();
  }

  @Get("me/stats")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get own statistics", description: "Retrieves lesson, achievement and quiz statistics for the authenticated user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Statistics retrieved successfully", type: UserStatsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMyStats(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<UserStatsDTO>> {
    const stats: UserStats = await this._getUserStatsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<UserStatsDTO>()
      .setData(UsersMapper.toStatsDTO(stats))
      .setMessage(await i18n.t("users.stats_retrieved"))
      .build();
  }

  @Get("students")
  @RequirePermissions("students:read_all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all students", description: "Retrieves a paginated list of students with their lesson progress summary" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Students retrieved successfully", type: StudentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getStudents(@Query() query: GetStudentsQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<StudentDTO[]>> {
    const students: Paginated<StudentResult> = await this._getStudentsUseCase.execute({
      page: query.page,
      limit: query.limit,
      ids: query.ids,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      search: query.search,
      sortBy: query.sortBy as UserSortByValue | undefined,
      sortOrder: query.sortOrder,
    });

    return new APIResponseBuilder<StudentDTO[]>()
      .setData(students.data.map((student: StudentResult) => UsersMapper.toStudentDTO(student)))
      .setMessage(await i18n.t("users.students_retrieved"))
      .setPagination(students.pagination)
      .build();
  }

  @Get("students/:id")
  @RequirePermissions("students:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get student by ID",
    description: "Retrieves a student with their lesson progress summary. Teachers only see students assigned to them.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Student retrieved successfully", type: StudentDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "User is not a student" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getStudentById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentDTO>> {
    const student: StudentResult = await this._getStudentByIdUseCase.execute(
      new GetStudentByIdCommand({
        studentId: id,
        requesterId: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<StudentDTO>()
      .setData(UsersMapper.toStudentDTO(student))
      .setMessage(await i18n.t("users.student_retrieved"))
      .build();
  }

  @Patch(":id/role")
  @RequirePermissions("users:update_role")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change user role",
    description:
      "Changes the role of another user in one transaction: leaves the groups that no longer fit the new role, revokes refresh tokens, " +
      "records the audit entry and notifies the user. The superadmin's role cannot change.",
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
      .setMessage(await i18n.t("users.role_changed"))
      .build();
  }

  @Patch(":id/status")
  @RequirePermissions("users:update_status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change user account status",
    description: "Activates or deactivates another user's account; deactivation revokes refresh tokens. The superadmin cannot be deactivated.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Account status changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or own status change" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or superadmin target" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async changeUserStatus(
    @Param("id") id: string,
    @Body() dto: ChangeUserStatusDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changeUserStatusUseCase.execute(new ChangeUserStatusCommand({ userId: id, isActive: dto.isActive, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("users.status_changed"))
      .build();
  }
}
