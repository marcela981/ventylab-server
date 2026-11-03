/*
 * Funcionalidad: Controlador UsersController
 * Descripción: Expone las rutas api/users de perfil propio (me), contraseña, estadísticas, estudiantes, listado paginado de usuarios (búsqueda también por código estudiantil, con la marca de superadministrador), cambio de rol, de estado de cuenta y de código estudiantil; las rutas me se declaran antes que las de :id. v1.3: la descripción del cambio de contraseña ya no menciona sesiones de NextAuth. v1.6: el listado y el detalle de estudiantes resuelven la foto subida como UserDTO (una lectura firmada por página)
 * Versión: 1.6
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { Paginated } from "@/common/domain/utils/paginated";
import { AVATAR_MAX_BYTES } from "@/common/domain/value-objects/avatar-upload-rules";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { DeprecatedRoute } from "@/common/presentation/decorators/deprecated-route.decorator";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { BLOCK4_ROUTES_DEPRECATED_AT } from "@/common/presentation/utils/deprecation.util";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ChangePasswordCommand } from "@/features/users/application/commands/change-password.command";
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { ChangeUserStatusCommand } from "@/features/users/application/commands/change-user-status.command";
import { ChangeUserStudentCodeCommand } from "@/features/users/application/commands/change-user-student-code.command";
import { GetStudentByIdCommand } from "@/features/users/application/commands/get-student-by-id.command";
import { UpdateProfileCommand } from "@/features/users/application/commands/update-profile.command";
import { StudentResult } from "@/features/users/application/results/student.result";
import { UserImageResolver } from "@/features/users/application/services/user-image.resolver";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { RemoveAvatarUseCase, UpdateAvatarUseCase } from "@/features/users/application/use-cases/change-avatar.usecase";
import { ChangePasswordUseCase } from "@/features/users/application/use-cases/change-password.usecase";
import { ChangeUserRoleUseCase } from "@/features/users/application/use-cases/change-user-role.usecase";
import { ChangeUserStatusUseCase } from "@/features/users/application/use-cases/change-user-status.usecase";
import { ChangeUserStudentCodeUseCase } from "@/features/users/application/use-cases/change-user-student-code.usecase";
import { GetStudentByIdUseCase } from "@/features/users/application/use-cases/get-student-by-id.usecase";
import { GetStudentsUseCase } from "@/features/users/application/use-cases/get-students.usecase";
import { GetUserByIdUseCase } from "@/features/users/application/use-cases/get-user-by-id.usecase";
import { GetUserStatsUseCase } from "@/features/users/application/use-cases/get-user-stats.usecase";
import { GetUsersUseCase } from "@/features/users/application/use-cases/get-users.usecase";
import { UpdateProfileUseCase } from "@/features/users/application/use-cases/update-profile.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type UserSortByValue } from "@/features/users/domain/repositories/users.repository";
import { AvatarFileRequiredError } from "@/features/users/domain/users.errors";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";
import { UserStats } from "@/features/users/domain/value-objects/user-stats";
import { ChangePasswordDTO } from "@/features/users/presentation/dtos/change-password.dto";
import { ChangeUserRoleDTO } from "@/features/users/presentation/dtos/change-user-role.dto";
import { ChangeUserStatusDTO } from "@/features/users/presentation/dtos/change-user-status.dto";
import { ChangeUserStudentCodeDTO } from "@/features/users/presentation/dtos/change-user-student-code.dto";
import { GetStudentsQueryDTO } from "@/features/users/presentation/dtos/get-students-query.dto";
import { GetUsersQueryDTO } from "@/features/users/presentation/dtos/get-users-query.dto";
import { StudentDTO } from "@/features/users/presentation/dtos/student.dto";
import { UpdateMeDTO } from "@/features/users/presentation/dtos/update-me.dto";
import { type UploadedAvatarFile } from "@/features/users/presentation/dtos/uploaded-avatar-file";
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
    private readonly _changeUserStudentCodeUseCase: ChangeUserStudentCodeUseCase,
    private readonly _updateAvatarUseCase: UpdateAvatarUseCase,
    private readonly _removeAvatarUseCase: RemoveAvatarUseCase,
    private readonly _userImageResolver: UserImageResolver,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
  ) {}

  @Get()
  @RequirePermissions("users:list")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get users",
    description:
      "Retrieves a paginated list of users filtered by search term (case-insensitive name, email or student code, or exact ID), role, group and account status; each user carries its student code and whether it is the superadmin",
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

    const images: Map<string, string | undefined> = await this._userImageResolver.resolve(users.data);

    return new APIResponseBuilder<UserDTO[]>()
      .setData(users.data.map((user: User) => UsersMapper.toDTO(user, this._superadminEmail, images.get(user.id))))
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
      .setData(await this._toDTO(user))
      .setMessage(await i18n.t("users.user_retrieved"))
      .build();
  }

  @Put("me/avatar")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: AVATAR_MAX_BYTES, files: 1 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary", description: "Profile photo: png, jpeg or webp of at most 2 MB (the client crops it square and resizes it to 512 px)" } },
    },
  })
  @ApiOperation({
    summary: "Upload own profile photo",
    description: "Stores the photo after checking its type, size and first bytes, replaces the previous uploaded photo (which is deleted) and returns the profile with the photo's signed URL as image",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Profile photo updated successfully", type: UserDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "No file or an empty file was sent" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  @ApiResponseDoc({ status: HttpStatus.PAYLOAD_TOO_LARGE, description: "The photo exceeds 2 MB" })
  @ApiResponseDoc({ status: HttpStatus.UNSUPPORTED_MEDIA_TYPE, description: "Not a png, jpeg or webp image, or the content does not match its type" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "File storage is not configured" })
  public async updateMyAvatar(
    @UploadedFile() file: UploadedAvatarFile | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<UserDTO>> {
    if (!file || file.size === 0) {
      throw new AvatarFileRequiredError();
    }

    const user: User = await this._updateAvatarUseCase.execute({
      ownerId: currentUser.sub,
      content: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      originalName: file.originalname,
    });

    return new APIResponseBuilder<UserDTO>()
      .setData(await this._toDTO(user))
      .setMessage(await i18n.t("users.avatar_updated"))
      .build();
  }

  @Delete("me/avatar")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove own profile photo",
    description: "Removes the uploaded photo and deletes its file; image falls back to the stored image (the Google picture), if any",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Profile photo removed successfully", type: UserDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async removeMyAvatar(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<UserDTO>> {
    const user: User = await this._removeAvatarUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<UserDTO>()
      .setData(await this._toDTO(user))
      .setMessage(await i18n.t("users.avatar_removed"))
      .build();
  }

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update own profile", description: "Updates the authenticated user's name or profile image URL (http(s) only; upload a photo with PUT /api/users/me/avatar)" })
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
  @DeprecatedRoute({ successor: "/api/auth/change-password", since: BLOCK4_ROUTES_DEPRECATED_AT })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change own password",
    description:
      "Deprecated alias of POST /api/auth/change-password without reissuing tokens: changes the authenticated user's password and revokes every refresh token issued so far (the current session too); access tokens stay valid until they expire",
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

    const images: Map<string, string | undefined> = await this._userImageResolver.resolve(students.data.map((student: StudentResult) => student.user));

    return new APIResponseBuilder<StudentDTO[]>()
      .setData(students.data.map((student: StudentResult) => UsersMapper.toStudentDTO(student, images.get(student.user.id))))
      .setMessage(await i18n.t("users.students_retrieved"))
      .setPagination(students.pagination)
      .build();
  }

  @Get("students/:id")
  @RequirePermissions("students:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get student by ID",
    description:
      "Retrieves a student with their institutional code, active STUDENT groups and lesson progress summary. Teachers only see students of the groups they created or supervise (or assigned to them).",
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
      .setData(UsersMapper.toStudentDTO(student, await this._userImageResolver.resolveOne(student.user)))
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

  @Patch(":id/student-code")
  @RequirePermissions("users:update_status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change user student code",
    description:
      "Sets (trimmed, 1 to 32 letters, digits or hyphens) or removes (null) the institutional student code of a user; the code is unique and the change is audited with its previous and new value",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Student code changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The student code is already assigned to another user" })
  public async changeUserStudentCode(
    @Param("id") id: string,
    @Body() dto: ChangeUserStudentCodeDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changeUserStudentCodeUseCase.execute(new ChangeUserStudentCodeCommand({ userId: id, studentCode: dto.studentCode, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("users.student_code_changed"))
      .build();
  }

  private async _toDTO(user: User): Promise<UserDTO> {
    return UsersMapper.toDTO(user, this._superadminEmail, await this._userImageResolver.resolveOne(user));
  }
}
