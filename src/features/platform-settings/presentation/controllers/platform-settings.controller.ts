/*
 * Funcionalidad: Controlador de ajustes de la plataforma
 * Descripción: Rutas de administración (permiso settings:manage) para listar los ajustes por categoría con su valor efectivo, origen, valor por defecto, límites, descripción y versión, actualizar un ajuste con concurrencia optimista y restablecerlo a su valor por defecto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ResetPlatformSettingCommand } from "@/features/platform-settings/application/commands/reset-platform-setting.command";
import { UpdatePlatformSettingCommand } from "@/features/platform-settings/application/commands/update-platform-setting.command";
import { type PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { GetPlatformSettingsUseCase } from "@/features/platform-settings/application/use-cases/get-platform-settings.usecase";
import { ResetPlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/reset-platform-setting.usecase";
import { UpdatePlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/update-platform-setting.usecase";
import { type PlatformSettingCategoryValue } from "@/features/platform-settings/domain/registry/platform-setting-values";
import {
  GetPlatformSettingsQueryDTO,
  ResetPlatformSettingDTO,
  UpdatePlatformSettingDTO,
} from "@/features/platform-settings/presentation/dtos/platform-setting-request.dto";
import { PlatformSettingDTO } from "@/features/platform-settings/presentation/dtos/platform-setting.dto";
import { PlatformSettingsMapper } from "@/features/platform-settings/presentation/mappers/platform-settings.mapper";

@ApiTags("Platform settings")
@ApiBearerAuth("JWT-auth")
@Controller("api/platform-settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("settings:manage")
export class PlatformSettingsController {
  public constructor(
    private readonly _getPlatformSettingsUseCase: GetPlatformSettingsUseCase,
    private readonly _updatePlatformSettingUseCase: UpdatePlatformSettingUseCase,
    private readonly _resetPlatformSettingUseCase: ResetPlatformSettingUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List platform settings",
    description: "Every editable setting (optionally of one category) with its effective value, origin (DEFAULT or OVERRIDE), default, hard limits, description and version",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Settings retrieved successfully", type: PlatformSettingDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getPlatformSettings(@Query() query: GetPlatformSettingsQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<PlatformSettingDTO[]>> {
    const views: PlatformSettingView[] = this._getPlatformSettingsUseCase.execute(query.category as PlatformSettingCategoryValue | undefined);

    return new APIResponseBuilder<PlatformSettingDTO[]>()
      .setData(PlatformSettingsMapper.toDTOList(views))
      .setMessage(await i18n.t("platform-settings.settings_retrieved"))
      .build();
  }

  @Patch(":key")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update a platform setting",
    description: "Overrides the setting value; `version` must be the version read (optimistic concurrency). Changes apply without a restart and are audited",
  })
  @ApiParam({ name: "key", description: "Setting key", example: "telemetry.flushIntervalMs" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Setting updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Unknown setting key" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The setting changed since the given version" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Invalid value, value outside the hard limits, or AI provider without credentials" })
  public async updatePlatformSetting(
    @Param("key") key: string,
    @Body() dto: UpdatePlatformSettingDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updatePlatformSettingUseCase.execute(new UpdatePlatformSettingCommand({ key, value: dto.value, version: dto.version, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("platform-settings.setting_updated")).build();
  }

  @Post(":key/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset a platform setting",
    description: "Removes the override so the default applies again; `version` must be the version read (optimistic concurrency). Audited",
  })
  @ApiParam({ name: "key", description: "Setting key", example: "telemetry.flushIntervalMs" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Setting reset successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Unknown setting key" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The setting changed since the given version" })
  public async resetPlatformSetting(
    @Param("key") key: string,
    @Body() dto: ResetPlatformSettingDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._resetPlatformSettingUseCase.execute(new ResetPlatformSettingCommand({ key, version: dto.version, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("platform-settings.setting_reset")).build();
  }
}
