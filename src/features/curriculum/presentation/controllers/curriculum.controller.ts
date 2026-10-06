/*
 * Funcionalidad: Controlador CurriculumController
 * Descripción: Expone las rutas HTTP api/curriculum de la feature de currículo, aplica guardias y permisos y responde con APIResponseBuilder; depende de CheckModuleUnlockedUseCase, GetCurriculumLevelUseCase, GetCurriculumOverviewUseCase, GetNextModuleUseCase
 * Versión: 1.1
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
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CheckModuleUnlockedUseCase } from "@/features/curriculum/application/use-cases/check-module-unlocked.usecase";
import { GetCurriculumLevelUseCase } from "@/features/curriculum/application/use-cases/get-curriculum-level.usecase";
import { GetCurriculumOverviewUseCase } from "@/features/curriculum/application/use-cases/get-curriculum-overview.usecase";
import { GetNextModuleUseCase } from "@/features/curriculum/application/use-cases/get-next-module.usecase";
import { GetStudentCurriculumTreeUseCase } from "@/features/curriculum/application/use-cases/get-student-curriculum-tree.usecase";
import { type StudentCurriculumTree } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  type CurriculumLevelView,
  type CurriculumNextModule,
  type CurriculumOverview,
} from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";
import {
  BEGINNER_CURRICULUM_LEVEL,
  type CurriculumLevelValue,
  PREREQUISITOS_CURRICULUM_LEVEL,
} from "@/features/curriculum/domain/value-objects/curriculum-level";
import { CurriculumLevelParamsDTO } from "@/features/curriculum/presentation/dtos/curriculum-request.dto";
import { StudentCurriculumTreeDTO } from "@/features/curriculum/presentation/dtos/curriculum-tree.dto";
import {
  CurriculumLevelDTO,
  CurriculumOverviewDTO,
  ModuleUnlockStatusDTO,
  NextModuleDTO,
} from "@/features/curriculum/presentation/dtos/curriculum.dto";
import { CurriculumTreeMapper } from "@/features/curriculum/presentation/mappers/curriculum-tree.mapper";
import { CurriculumMapper } from "@/features/curriculum/presentation/mappers/curriculum.mapper";

@ApiTags("Curriculum")
@Controller("api/curriculum")
export class CurriculumController {
  public constructor(
    private readonly _getCurriculumOverviewUseCase: GetCurriculumOverviewUseCase,
    private readonly _getCurriculumLevelUseCase: GetCurriculumLevelUseCase,
    private readonly _checkModuleUnlockedUseCase: CheckModuleUnlockedUseCase,
    private readonly _getNextModuleUseCase: GetNextModuleUseCase,
    private readonly _getStudentCurriculumTreeUseCase: GetStudentCurriculumTreeUseCase,
  ) {}

  @Get("tree")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get curriculum tree",
    description:
      "Retrieves sections with their levels and modules; each level and module carries locked and missingPrerequisites for the current user. Students see only published content",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Curriculum tree retrieved successfully", type: StudentCurriculumTreeDTO })
  public async getCurriculumTree(
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentCurriculumTreeDTO>> {
    const tree: StudentCurriculumTree = await this._getStudentCurriculumTreeUseCase.execute(
      currentUser?.sub,
      canManageContent(currentUser?.permissions, "levels:update"),
    );

    return new APIResponseBuilder<StudentCurriculumTreeDTO>()
      .setData(CurriculumTreeMapper.toDTO(tree))
      .setMessage(await i18n.t("curriculum.tree_retrieved"))
      .build();
  }

  @Get("overview")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get curriculum overview", description: "Retrieves the prerequisites and beginner levels, with progress when authenticated" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Curriculum overview retrieved successfully", type: CurriculumOverviewDTO })
  public async getCurriculumOverview(
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CurriculumOverviewDTO>> {
    const overview: CurriculumOverview = await this._getCurriculumOverviewUseCase.execute(currentUser?.sub);

    return new APIResponseBuilder<CurriculumOverviewDTO>()
      .setData(CurriculumMapper.toOverviewDTO(overview))
      .setMessage(await i18n.t("curriculum.overview_retrieved"))
      .build();
  }

  @Get("beginner")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get beginner curriculum", description: "Retrieves the beginner modules, sequentially locked when authenticated" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Beginner modules retrieved successfully", type: CurriculumLevelDTO })
  public async getBeginnerCurriculum(
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CurriculumLevelDTO>> {
    const level: CurriculumLevelView = await this._getCurriculumLevelUseCase.execute(BEGINNER_CURRICULUM_LEVEL, currentUser?.sub);

    return new APIResponseBuilder<CurriculumLevelDTO>()
      .setData(CurriculumMapper.toLevelDTO(level))
      .setMessage(await i18n.t("curriculum.beginner_retrieved"))
      .build();
  }

  @Get("prerequisitos")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get prerequisites curriculum", description: "Retrieves the optional prerequisite modules, never locked" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisite modules retrieved successfully", type: CurriculumLevelDTO })
  public async getPrerequisitosCurriculum(
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CurriculumLevelDTO>> {
    const level: CurriculumLevelView = await this._getCurriculumLevelUseCase.execute(PREREQUISITOS_CURRICULUM_LEVEL, currentUser?.sub);

    return new APIResponseBuilder<CurriculumLevelDTO>()
      .setData(CurriculumMapper.toLevelDTO(level))
      .setMessage(await i18n.t("curriculum.prerequisitos_retrieved"))
      .build();
  }

  @Get("level/:level")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get curriculum level", description: "Retrieves the modules of a curriculum level" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level modules retrieved successfully", type: CurriculumLevelDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Invalid level" })
  public async getCurriculumLevel(
    @Param() params: CurriculumLevelParamsDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CurriculumLevelDTO>> {
    const level: CurriculumLevelView = await this._getCurriculumLevelUseCase.execute(params.level as CurriculumLevelValue, currentUser?.sub);

    return new APIResponseBuilder<CurriculumLevelDTO>()
      .setData(CurriculumMapper.toLevelDTO(level))
      .setMessage(await i18n.t("curriculum.level_retrieved"))
      .build();
  }

  @Get("modules/:moduleId/unlocked")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check module unlock", description: "Checks whether a module is unlocked for the current user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Unlock status retrieved", type: ModuleUnlockStatusDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async checkModuleUnlocked(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleUnlockStatusDTO>> {
    const isUnlocked: boolean = await this._checkModuleUnlockedUseCase.execute(currentUser.sub, moduleId);

    return new APIResponseBuilder<ModuleUnlockStatusDTO>()
      .setData(CurriculumMapper.toUnlockStatusDTO(moduleId, isUnlocked))
      .setMessage(await i18n.t("curriculum.unlock_status_retrieved"))
      .build();
  }

  @Get("modules/:moduleId/next")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get next module", description: "Retrieves the module that follows the given one in its curriculum level" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Next module retrieved", type: NextModuleDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getNextModule(@Param("moduleId") moduleId: string, @I18n() i18n: I18nContext): Promise<APIResponse<NextModuleDTO>> {
    const nextModule: CurriculumNextModule | undefined = await this._getNextModuleUseCase.execute(moduleId);

    return new APIResponseBuilder<NextModuleDTO>()
      .setData(CurriculumMapper.toNextModuleDTO(moduleId, nextModule))
      .setMessage(await i18n.t(nextModule ? "curriculum.next_module_retrieved" : "curriculum.no_next_module"))
      .build();
  }
}
