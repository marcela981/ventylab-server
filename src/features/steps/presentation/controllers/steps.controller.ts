/*
 * Funcionalidad: Controlador StepsController
 * Descripción: Expone las rutas HTTP [api/steps, api/cards] de la feature de pasos (tarjetas), aplica guardias y permisos y responde con APIResponseBuilder; depende de CreateStepUseCase, DeleteStepUseCase, GetAdjacentStepUseCase, GetStepByIdUseCase, GetStepsUseCase, ReorderStepsUseCase y otros
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

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CreateStepCommand } from "@/features/steps/application/commands/create-step.command";
import { DeleteStepCommand } from "@/features/steps/application/commands/delete-step.command";
import { ReorderStepsCommand } from "@/features/steps/application/commands/reorder-steps.command";
import { UpdateStepCommand } from "@/features/steps/application/commands/update-step.command";
import { CreateStepUseCase } from "@/features/steps/application/use-cases/create-step.usecase";
import { DeleteStepUseCase } from "@/features/steps/application/use-cases/delete-step.usecase";
import { GetAdjacentStepUseCase } from "@/features/steps/application/use-cases/get-adjacent-step.usecase";
import { GetStepByIdUseCase } from "@/features/steps/application/use-cases/get-step-by-id.usecase";
import { GetStepsUseCase } from "@/features/steps/application/use-cases/get-steps.usecase";
import { ReorderStepsUseCase } from "@/features/steps/application/use-cases/reorder-steps.usecase";
import { UpdateStepUseCase } from "@/features/steps/application/use-cases/update-step.usecase";
import { type StepDetail, type StepListItem, type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";
import { CreateStepDTO, GetStepsQueryDTO, ReorderStepsDTO, UpdateStepDTO } from "@/features/steps/presentation/dtos/step-request.dto";
import { StepDetailDTO, StepDTO, StepListItemDTO } from "@/features/steps/presentation/dtos/step.dto";
import { StepsMapper } from "@/features/steps/presentation/mappers/steps.mapper";

@ApiTags("Steps")
@Controller(["api/steps", "api/cards"])
export class StepsController {
  public constructor(
    private readonly _getStepsUseCase: GetStepsUseCase,
    private readonly _getStepByIdUseCase: GetStepByIdUseCase,
    private readonly _getAdjacentStepUseCase: GetAdjacentStepUseCase,
    private readonly _reorderStepsUseCase: ReorderStepsUseCase,
    private readonly _createStepUseCase: CreateStepUseCase,
    private readonly _updateStepUseCase: UpdateStepUseCase,
    private readonly _deleteStepUseCase: DeleteStepUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get steps", description: "Retrieves a paginated list of steps, optionally filtered by lesson" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Steps retrieved successfully", type: StepListItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  public async getSteps(@Query() query: GetStepsQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<StepListItemDTO[]>> {
    const steps: Paginated<StepListItem> = await this._getStepsUseCase.execute({
      page: query.page,
      limit: query.limit,
      lessonId: query.lessonId,
      includeInactive: query.includeInactive ?? false,
    });

    return new APIResponseBuilder<StepListItemDTO[]>()
      .setData(steps.data.map((step: StepListItem) => StepsMapper.toListItemDTO(step)))
      .setMessage(await i18n.t("steps.steps_retrieved"))
      .setPagination(steps.pagination)
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("steps:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder steps", description: "Sets each step's order to its position in the given list" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Steps reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or steps outside the lesson" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async reorderSteps(
    @Body() dto: ReorderStepsDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._reorderStepsUseCase.execute(new ReorderStepsCommand({ lessonId: dto.lessonId, stepIds: dto.stepIds, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("steps.steps_reordered"))
      .build();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("steps:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create step", description: "Creates a step in an active lesson; the order defaults to the end of the lesson" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Step created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or inactive lesson" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate order in the lesson" })
  public async createStep(@Body() dto: CreateStepDTO, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._createStepUseCase.execute(
      new CreateStepCommand({
        lessonId: dto.lessonId,
        title: dto.title,
        content: dto.content,
        contentType: dto.contentType,
        order: dto.order,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("steps.step_created"))
      .build();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get step by ID", description: "Retrieves a step with its lesson and module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Step retrieved successfully", type: StepDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Step not found" })
  public async getStepById(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<StepDetailDTO>> {
    const step: StepDetail = await this._getStepByIdUseCase.execute(id);

    return new APIResponseBuilder<StepDetailDTO>()
      .setData(StepsMapper.toDetailDTO(step))
      .setMessage(await i18n.t("steps.step_retrieved"))
      .build();
  }

  @Get(":id/next")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get next step", description: "Retrieves the next active step of the same lesson, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Next step retrieved", type: StepDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Step not found" })
  public async getNextStep(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<StepDTO | null>> {
    const step: StepSummary | undefined = await this._getAdjacentStepUseCase.execute(id, "next");

    return new APIResponseBuilder<StepDTO | null>()
      .setData(step ? StepsMapper.toDTO(step) : null)
      .setMessage(await i18n.t(step ? "steps.next_step_retrieved" : "steps.no_next_step"))
      .build();
  }

  @Get(":id/previous")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get previous step", description: "Retrieves the previous active step of the same lesson, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Previous step retrieved", type: StepDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Step not found" })
  public async getPreviousStep(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<StepDTO | null>> {
    const step: StepSummary | undefined = await this._getAdjacentStepUseCase.execute(id, "previous");

    return new APIResponseBuilder<StepDTO | null>()
      .setData(step ? StepsMapper.toDTO(step) : null)
      .setMessage(await i18n.t(step ? "steps.previous_step_retrieved" : "steps.no_previous_step"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("steps:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update step", description: "Updates a step's title, content, content type, order or active flag" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Step updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Step not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate order in the lesson" })
  public async updateStep(
    @Param("id") id: string,
    @Body() dto: UpdateStepDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateStepUseCase.execute(
      new UpdateStepCommand({
        stepId: id,
        title: dto.title,
        content: dto.content,
        contentType: dto.contentType,
        order: dto.order,
        isActive: dto.isActive,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("steps.step_updated"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("steps:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate step", description: "Soft deletes a step" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Step deactivated successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Step not found" })
  public async deleteStep(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteStepUseCase.execute(new DeleteStepCommand({ stepId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("steps.step_deactivated"))
      .build();
  }
}
