/*
 * Funcionalidad: Controlador OverridesController
 * Descripción: Expone las rutas HTTP api/overrides de la feature de personalizaciones de contenido por estudiante, aplica guardias y permisos y responde con APIResponseBuilder; depende de CreateOverrideUseCase, DeleteOverrideUseCase, GetOverrideByIdUseCase, GetStudentOverridesUseCase, UpdateOverrideUseCase
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CreateOverrideCommand } from "@/features/overrides/application/commands/create-override.command";
import { DeleteOverrideCommand } from "@/features/overrides/application/commands/delete-override.command";
import { GetOverrideByIdCommand } from "@/features/overrides/application/commands/get-override-by-id.command";
import { GetStudentOverridesCommand } from "@/features/overrides/application/commands/get-student-overrides.command";
import { UpdateOverrideCommand } from "@/features/overrides/application/commands/update-override.command";
import { CreateOverrideUseCase } from "@/features/overrides/application/use-cases/create-override.usecase";
import { DeleteOverrideUseCase } from "@/features/overrides/application/use-cases/delete-override.usecase";
import { GetOverrideByIdUseCase } from "@/features/overrides/application/use-cases/get-override-by-id.usecase";
import { GetStudentOverridesUseCase } from "@/features/overrides/application/use-cases/get-student-overrides.usecase";
import { UpdateOverrideUseCase } from "@/features/overrides/application/use-cases/update-override.usecase";
import { type ContentOverrideView } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";
import { ContentOverrideDTO, ContentOverridesListDTO } from "@/features/overrides/presentation/dtos/content-override.dto";
import { CreateOverrideDTO, GetOverridesQueryDTO, UpdateOverrideDTO } from "@/features/overrides/presentation/dtos/override-request.dto";
import { OverridesMapper } from "@/features/overrides/presentation/mappers/overrides.mapper";

@ApiTags("Content overrides")
@ApiBearerAuth("JWT-auth")
@Controller("api/overrides")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OverridesController {
  public constructor(
    private readonly _createOverrideUseCase: CreateOverrideUseCase,
    private readonly _getStudentOverridesUseCase: GetStudentOverridesUseCase,
    private readonly _getOverrideByIdUseCase: GetOverrideByIdUseCase,
    private readonly _updateOverrideUseCase: UpdateOverrideUseCase,
    private readonly _deleteOverrideUseCase: DeleteOverrideUseCase,
  ) {}

  @Post()
  @RequirePermissions("overrides:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create content override", description: "Creates a per-student override of a level, lesson or card" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Override created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid override data or target user is not a student" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Student or target entity not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Override already exists" })
  public async createOverride(
    @Body() dto: CreateOverrideDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._createOverrideUseCase.execute(
      new CreateOverrideCommand({
        studentId: dto.studentId,
        entityType: dto.entityType as OverrideEntityTypeValue,
        entityId: dto.entityId,
        overrideData: OverridesMapper.toOverrideData(dto.overrideData),
        requesterId: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("overrides.override_created"))
      .build();
  }

  @Get()
  @RequirePermissions("overrides:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get student overrides", description: "Retrieves the overrides of a student, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Overrides retrieved successfully", type: ContentOverridesListDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  public async getStudentOverrides(
    @Query() query: GetOverridesQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ContentOverridesListDTO>> {
    const overrides: ContentOverrideView[] = await this._getStudentOverridesUseCase.execute(
      new GetStudentOverridesCommand({
        studentId: query.studentId,
        entityType: query.entityType as OverrideEntityTypeValue | undefined,
        includeInactive: query.includeInactive ?? false,
        requesterId: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<ContentOverridesListDTO>()
      .setData(OverridesMapper.toListDTO(query.studentId, overrides))
      .setMessage(await i18n.t("overrides.overrides_retrieved"))
      .build();
  }

  @Get(":id")
  @RequirePermissions("overrides:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get content override by ID", description: "Retrieves one override with its student and creator" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Override retrieved successfully", type: ContentOverrideDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Override not found" })
  public async getOverrideById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ContentOverrideDTO>> {
    const override: ContentOverrideView = await this._getOverrideByIdUseCase.execute(
      new GetOverrideByIdCommand({ overrideId: id, requesterId: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<ContentOverrideDTO>()
      .setData(OverridesMapper.toDTO(override))
      .setMessage(await i18n.t("overrides.override_retrieved"))
      .build();
  }

  @Put(":id")
  @RequirePermissions("overrides:update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update content override", description: "Replaces the override data or toggles the active flag" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Override updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid override data" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Override not found" })
  public async updateOverride(
    @Param("id") id: string,
    @Body() dto: UpdateOverrideDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateOverrideUseCase.execute(
      new UpdateOverrideCommand({
        overrideId: id,
        overrideData: dto.overrideData ? OverridesMapper.toOverrideData(dto.overrideData) : undefined,
        isActive: dto.isActive,
        requesterId: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("overrides.override_updated"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("overrides:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate content override", description: "Soft deletes an override" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Override deactivated successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student not assigned to the teacher" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Override not found" })
  public async deleteOverride(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteOverrideUseCase.execute(new DeleteOverrideCommand({ overrideId: id, requesterId: currentUser.sub, requesterRole: currentUser.role }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("overrides.override_deleted"))
      .build();
  }
}
