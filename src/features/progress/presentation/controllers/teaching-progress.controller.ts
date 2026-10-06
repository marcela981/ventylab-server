/*
 * Funcionalidad: Controlador de progresión de enseñanza
 * Descripción: Expone las rutas autenticadas de progresión bajo /api/teaching (módulos desbloqueados y verificación de acceso a módulo y lección) y delega en los casos de uso de progreso
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CheckLessonAccessUseCase } from "@/features/progress/application/use-cases/check-lesson-access.usecase";
import { CheckModuleAccessUseCase } from "@/features/progress/application/use-cases/check-module-access.usecase";
import { GetUnlockedModulesUseCase } from "@/features/progress/application/use-cases/get-unlocked-modules.usecase";
import { type UnlockedModules } from "@/features/progress/domain/read-models/progress-views.read-model";
import { LessonAccessDTO, ModuleAccessDTO, UnlockedModulesDTO } from "@/features/progress/presentation/dtos/progress.dto";
import { ProgressMapper } from "@/features/progress/presentation/mappers/progress.mapper";

@ApiTags("Teaching progression")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/teaching")
export class TeachingProgressController {
  public constructor(
    private readonly _getUnlockedModulesUseCase: GetUnlockedModulesUseCase,
    private readonly _checkModuleAccessUseCase: CheckModuleAccessUseCase,
    private readonly _checkLessonAccessUseCase: CheckLessonAccessUseCase,
  ) {}

  @Get("modules/unlocked")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get unlocked modules", description: "Returns the IDs of the active modules the current user can open" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Unlocked modules retrieved successfully", type: UnlockedModulesDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getTeachingUnlockedModules(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<UnlockedModulesDTO>> {
    const unlocked: UnlockedModules = await this._getUnlockedModulesUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<UnlockedModulesDTO>()
      .setData(ProgressMapper.toUnlockedModulesDTO(unlocked))
      .setMessage(await i18n.t("progress.unlocked_modules_retrieved"))
      .build();
  }

  @Get("modules/:moduleId/access")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check module access", description: "Tells whether the current user can open the module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Access status retrieved successfully", type: ModuleAccessDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async checkTeachingModuleAccess(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleAccessDTO>> {
    const hasAccess: boolean = await this._checkModuleAccessUseCase.execute(currentUser.sub, moduleId);

    return new APIResponseBuilder<ModuleAccessDTO>()
      .setData(ProgressMapper.toModuleAccessDTO(moduleId, hasAccess))
      .setMessage(await i18n.t("progress.access_retrieved"))
      .build();
  }

  @Get("lessons/:lessonId/access")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check lesson access", description: "Tells whether the current user can open the lesson in sequence" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Access status retrieved successfully", type: LessonAccessDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async checkTeachingLessonAccess(
    @Param("lessonId") lessonId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonAccessDTO>> {
    const hasAccess: boolean = await this._checkLessonAccessUseCase.execute(currentUser.sub, lessonId);

    return new APIResponseBuilder<LessonAccessDTO>()
      .setData(ProgressMapper.toLessonAccessDTO(lessonId, hasAccess))
      .setMessage(await i18n.t("progress.access_retrieved"))
      .build();
  }
}
