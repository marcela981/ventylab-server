/*
 * Funcionalidad: Controlador de evaluaciones (autoría)
 * Descripción: Rutas /api/evaluations para gestionar evaluaciones: listado paginado y detalle de gestión (con respuestas correctas), creación, edición, cambio de estado, borrado o archivado, duplicado, altas, ediciones y bajas de escenarios, preguntas y opciones, y reordenamientos por lotes; requiere evaluations:read o evaluations:manage
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AddEvaluationOptionCommand } from "@/features/evaluation/application/commands/add-evaluation-option.command";
import { AddEvaluationQuestionCommand } from "@/features/evaluation/application/commands/add-evaluation-question.command";
import { AddEvaluationScenarioCommand } from "@/features/evaluation/application/commands/add-evaluation-scenario.command";
import { ChangeEvaluationStatusCommand } from "@/features/evaluation/application/commands/change-evaluation-status.command";
import { CreateEvaluationCommand } from "@/features/evaluation/application/commands/create-evaluation.command";
import { DeleteEvaluationCommand } from "@/features/evaluation/application/commands/delete-evaluation.command";
import { DuplicateEvaluationCommand } from "@/features/evaluation/application/commands/duplicate-evaluation.command";
import { RemoveEvaluationOptionCommand } from "@/features/evaluation/application/commands/remove-evaluation-option.command";
import { RemoveEvaluationQuestionCommand } from "@/features/evaluation/application/commands/remove-evaluation-question.command";
import { RemoveEvaluationScenarioCommand } from "@/features/evaluation/application/commands/remove-evaluation-scenario.command";
import { ReorderEvaluationOptionsCommand } from "@/features/evaluation/application/commands/reorder-evaluation-options.command";
import { ReorderEvaluationQuestionsCommand } from "@/features/evaluation/application/commands/reorder-evaluation-questions.command";
import { ReorderEvaluationScenariosCommand } from "@/features/evaluation/application/commands/reorder-evaluation-scenarios.command";
import { UpdateEvaluationOptionCommand } from "@/features/evaluation/application/commands/update-evaluation-option.command";
import { UpdateEvaluationQuestionCommand } from "@/features/evaluation/application/commands/update-evaluation-question.command";
import { UpdateEvaluationScenarioCommand } from "@/features/evaluation/application/commands/update-evaluation-scenario.command";
import { UpdateEvaluationCommand } from "@/features/evaluation/application/commands/update-evaluation.command";
import { type EvaluationDetailResult, type EvaluationListItemResult } from "@/features/evaluation/application/results/evaluation-detail.result";
import { AddEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-option.usecase";
import { AddEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-question.usecase";
import { AddEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-scenario.usecase";
import { ChangeEvaluationStatusUseCase } from "@/features/evaluation/application/use-cases/change-evaluation-status.usecase";
import { CreateEvaluationUseCase } from "@/features/evaluation/application/use-cases/create-evaluation.usecase";
import { type DeleteEvaluationOutcome, DeleteEvaluationUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation.usecase";
import { DuplicateEvaluationUseCase } from "@/features/evaluation/application/use-cases/duplicate-evaluation.usecase";
import { GetEvaluationDetailUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-detail.usecase";
import { GetEvaluationsUseCase } from "@/features/evaluation/application/use-cases/get-evaluations.usecase";
import { RemoveEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-option.usecase";
import { RemoveEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-question.usecase";
import { RemoveEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-scenario.usecase";
import { ReorderEvaluationOptionsUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-options.usecase";
import { ReorderEvaluationQuestionsUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-questions.usecase";
import { ReorderEvaluationScenariosUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-scenarios.usecase";
import { UpdateEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-option.usecase";
import { UpdateEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-question.usecase";
import { UpdateEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-scenario.usecase";
import { UpdateEvaluationUseCase } from "@/features/evaluation/application/use-cases/update-evaluation.usecase";
import { type EvaluationSortByValue } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";
import {
  CreateEvaluationOptionDTO,
  CreateEvaluationQuestionDTO,
  CreateEvaluationScenarioDTO,
  QuestionReorderItemDTO,
  ReorderItemDTO,
  ReorderItemsDTO,
  ReorderQuestionsDTO,
  UpdateEvaluationOptionDTO,
  UpdateEvaluationQuestionDTO,
  UpdateEvaluationScenarioDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-content-request.dto";
import {
  ChangeEvaluationStatusDTO,
  CreateEvaluationDTO,
  GetEvaluationsQueryDTO,
  UpdateEvaluationDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-request.dto";
import {
  DeleteEvaluationResultDTO,
  EvaluationDetailDTO,
  EvaluationIdDTO,
  EvaluationSummaryDTO,
} from "@/features/evaluation/presentation/dtos/evaluation.dto";
import { EvaluationsMapper } from "@/features/evaluation/presentation/mappers/evaluations.mapper";
import { type CurrentCaller, toEvaluationActor } from "@/features/evaluation/presentation/types/current-caller";

@ApiTags("Evaluations")
@ApiBearerAuth("JWT-auth")
@Controller("api/evaluations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvaluationsController {
  public constructor(
    private readonly _getEvaluationsUseCase: GetEvaluationsUseCase,
    private readonly _getEvaluationDetailUseCase: GetEvaluationDetailUseCase,
    private readonly _createEvaluationUseCase: CreateEvaluationUseCase,
    private readonly _updateEvaluationUseCase: UpdateEvaluationUseCase,
    private readonly _deleteEvaluationUseCase: DeleteEvaluationUseCase,
    private readonly _changeEvaluationStatusUseCase: ChangeEvaluationStatusUseCase,
    private readonly _duplicateEvaluationUseCase: DuplicateEvaluationUseCase,
    private readonly _addEvaluationScenarioUseCase: AddEvaluationScenarioUseCase,
    private readonly _updateEvaluationScenarioUseCase: UpdateEvaluationScenarioUseCase,
    private readonly _removeEvaluationScenarioUseCase: RemoveEvaluationScenarioUseCase,
    private readonly _reorderEvaluationScenariosUseCase: ReorderEvaluationScenariosUseCase,
    private readonly _addEvaluationQuestionUseCase: AddEvaluationQuestionUseCase,
    private readonly _updateEvaluationQuestionUseCase: UpdateEvaluationQuestionUseCase,
    private readonly _removeEvaluationQuestionUseCase: RemoveEvaluationQuestionUseCase,
    private readonly _reorderEvaluationQuestionsUseCase: ReorderEvaluationQuestionsUseCase,
    private readonly _addEvaluationOptionUseCase: AddEvaluationOptionUseCase,
    private readonly _updateEvaluationOptionUseCase: UpdateEvaluationOptionUseCase,
    private readonly _removeEvaluationOptionUseCase: RemoveEvaluationOptionUseCase,
    private readonly _reorderEvaluationOptionsUseCase: ReorderEvaluationOptionsUseCase,
  ) {}

  @Get()
  @RequirePermissions("evaluations:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get evaluations",
    description: "Paginated manager list filtered by type, status (archived ones only when requested), title search and mine=true; each item tells whether the caller can edit it",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluations retrieved successfully", type: EvaluationSummaryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getEvaluations(
    @Query() query: GetEvaluationsQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationSummaryDTO[]>> {
    const result: Paginated<EvaluationListItemResult> = await this._getEvaluationsUseCase.execute(
      {
        page: Number(query.page),
        limit: Number(query.limit),
        ids: query.ids,
        createdAtFrom: query.createdAtFrom,
        createdAtTo: query.createdAtTo,
        sortOrder: query.sortOrder,
        type: query.type as EvaluationTypeValue | undefined,
        status: query.status as EvaluationStatusValue | undefined,
        search: query.search,
        createdById: query.mine === "true" ? currentUser.sub : undefined,
        sortBy: query.sortBy as EvaluationSortByValue | undefined,
      },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<EvaluationSummaryDTO[]>()
      .setData(result.data.map((item: EvaluationListItemResult) => EvaluationsMapper.toSummaryDTO(item)))
      .setMessage(await i18n.t("evaluation.evaluations_retrieved"))
      .setPagination(result.pagination)
      .build();
  }

  @Post()
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create evaluation", description: "Creates a DRAFT evaluation owned by the caller and returns its ID" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Evaluation created successfully", type: EvaluationIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown module, level or lesson" })
  public async createEvaluation(
    @Body() dto: CreateEvaluationDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationIdDTO>> {
    const id: string = await this._createEvaluationUseCase.execute(
      new CreateEvaluationCommand({
        actor: toEvaluationActor(currentUser),
        type: dto.type as EvaluationTypeValue,
        title: dto.title,
        description: dto.description,
        moduleId: dto.moduleId,
        levelId: dto.levelId,
        lessonId: dto.lessonId,
        durationMinutes: dto.durationMinutes,
        maxAttempts: dto.maxAttempts,
        shuffleQuestions: dto.shuffleQuestions,
        showResultsImmediately: dto.showResultsImmediately,
      }),
    );

    return new APIResponseBuilder<EvaluationIdDTO>()
      .setData(new EvaluationIdDTO({ id }))
      .setMessage(await i18n.t("evaluation.evaluation_created"))
      .build();
  }

  @Get(":id")
  @RequirePermissions("evaluations:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get evaluation for management",
    description: "Full evaluation with scenarios, questions and options including the correct answers, signed media URLs, usage counts and READY issues",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluation retrieved successfully", type: EvaluationDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async getEvaluation(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationDetailDTO>> {
    const result: EvaluationDetailResult = await this._getEvaluationDetailUseCase.execute(id, toEvaluationActor(currentUser));

    return new APIResponseBuilder<EvaluationDetailDTO>()
      .setData(EvaluationsMapper.toDetailDTO(result))
      .setMessage(await i18n.t("evaluation.evaluation_retrieved"))
      .build();
  }

  @Patch(":id")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update evaluation", description: "Updates the general data of an evaluation the caller manages; null clears nullable fields" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluation updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown module, level or lesson" })
  public async updateEvaluation(
    @Param("id") id: string,
    @Body() dto: UpdateEvaluationDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateEvaluationUseCase.execute(
      new UpdateEvaluationCommand({
        evaluationId: id,
        actor: toEvaluationActor(currentUser),
        title: dto.title ?? undefined,
        description: dto.description,
        moduleId: dto.moduleId,
        levelId: dto.levelId,
        lessonId: dto.lessonId,
        durationMinutes: dto.durationMinutes,
        maxAttempts: dto.maxAttempts ?? undefined,
        shuffleQuestions: dto.shuffleQuestions ?? undefined,
        showResultsImmediately: dto.showResultsImmediately ?? undefined,
        order: dto.order ?? undefined,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.evaluation_updated")).build();
  }

  @Delete(":id")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete evaluation", description: "Deletes an evaluation without attempts or assignments; otherwise archives it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluation deleted or archived", type: DeleteEvaluationResultDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async deleteEvaluation(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<DeleteEvaluationResultDTO>> {
    const outcome: DeleteEvaluationOutcome = await this._deleteEvaluationUseCase.execute(
      new DeleteEvaluationCommand({ evaluationId: id, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<DeleteEvaluationResultDTO>()
      .setData(new DeleteEvaluationResultDTO({ outcome }))
      .setMessage(await i18n.t(outcome === "deleted" ? "evaluation.evaluation_deleted" : "evaluation.evaluation_archived"))
      .build();
  }

  @Patch(":id/status")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change evaluation status",
    description: "DRAFT→READY validates the evaluation (422 with the issues listed in the detail), READY→DRAFT requires no submitted attempts (409), any status can be ARCHIVED and ARCHIVED is final",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluation status changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Transition not allowed or submitted attempts exist" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "The evaluation is not ready" })
  public async changeEvaluationStatus(
    @Param("id") id: string,
    @Body() dto: ChangeEvaluationStatusDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changeEvaluationStatusUseCase.execute(
      new ChangeEvaluationStatusCommand({ evaluationId: id, actor: toEvaluationActor(currentUser), status: dto.status as EvaluationStatusValue }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.evaluation_status_changed")).build();
  }

  @Post(":id/duplicate")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Duplicate evaluation",
    description: "Deep copies scenarios, questions and options into a new DRAFT owned by the caller (title suffixed with (copy)); assignments and attempts are never copied",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Evaluation duplicated successfully", type: EvaluationIdDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async duplicateEvaluation(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationIdDTO>> {
    const copyId: string = await this._duplicateEvaluationUseCase.execute(
      new DuplicateEvaluationCommand({ evaluationId: id, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<EvaluationIdDTO>()
      .setData(new EvaluationIdDTO({ id: copyId }))
      .setMessage(await i18n.t("evaluation.evaluation_duplicated"))
      .build();
  }

  @Post(":id/scenarios")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add evaluation scenario", description: "Appends a scenario (Tiptap content and media) and returns its ID" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Scenario added successfully", type: EvaluationIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media" })
  public async addEvaluationScenario(
    @Param("id") id: string,
    @Body() dto: CreateEvaluationScenarioDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationIdDTO>> {
    const scenarioId: string = await this._addEvaluationScenarioUseCase.execute(
      new AddEvaluationScenarioCommand({ evaluationId: id, actor: toEvaluationActor(currentUser), content: dto.content, mediaIds: dto.mediaIds }),
    );

    return new APIResponseBuilder<EvaluationIdDTO>()
      .setData(new EvaluationIdDTO({ id: scenarioId }))
      .setMessage(await i18n.t("evaluation.scenario_added"))
      .build();
  }

  @Put(":id/scenarios/order")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder evaluation scenarios", description: "Applies the new scenario order in one transactional statement" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Scenarios reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, or ids that do not belong to the evaluation" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async reorderEvaluationScenarios(
    @Param("id") id: string,
    @Body() dto: ReorderItemsDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._reorderEvaluationScenariosUseCase.execute(
      new ReorderEvaluationScenariosCommand({
        evaluationId: id,
        actor: toEvaluationActor(currentUser),
        items: dto.items.map((item: ReorderItemDTO) => ({ id: item.id, order: item.order })),
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.items_reordered")).build();
  }

  @Patch(":id/scenarios/:scenarioId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update evaluation scenario", description: "Updates the content or media of a scenario" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Scenario updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or scenario not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media" })
  public async updateEvaluationScenario(
    @Param("id") id: string,
    @Param("scenarioId") scenarioId: string,
    @Body() dto: UpdateEvaluationScenarioDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateEvaluationScenarioUseCase.execute(
      new UpdateEvaluationScenarioCommand({
        evaluationId: id,
        scenarioId,
        actor: toEvaluationActor(currentUser),
        content: dto.content ?? undefined,
        mediaIds: dto.mediaIds ?? undefined,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.scenario_updated")).build();
  }

  @Delete(":id/scenarios/:scenarioId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove evaluation scenario", description: "Removes a scenario; its questions stay in the evaluation without scenario" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Scenario removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or scenario not found" })
  public async removeEvaluationScenario(
    @Param("id") id: string,
    @Param("scenarioId") scenarioId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeEvaluationScenarioUseCase.execute(
      new RemoveEvaluationScenarioCommand({ evaluationId: id, scenarioId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.scenario_removed")).build();
  }

  @Post(":id/questions")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add evaluation question", description: "Appends a question with its options and returns its ID; blocked once attempts were submitted" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Question added successfully", type: EvaluationIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or scenario not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The evaluation has submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media or clinical case, options on a non-choice question, or a READY evaluation would become invalid" })
  public async addEvaluationQuestion(
    @Param("id") id: string,
    @Body() dto: CreateEvaluationQuestionDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationIdDTO>> {
    const questionId: string = await this._addEvaluationQuestionUseCase.execute(
      new AddEvaluationQuestionCommand({
        evaluationId: id,
        actor: toEvaluationActor(currentUser),
        type: dto.type as EvaluationQuestionTypeValue,
        prompt: dto.prompt,
        points: dto.points,
        explanation: dto.explanation,
        scenarioId: dto.scenarioId,
        mediaIds: dto.mediaIds,
        clinicalCaseId: dto.clinicalCaseId,
        rubric: dto.rubric,
        options: dto.options?.map((option: CreateEvaluationOptionDTO) => ({ content: option.content, isCorrect: option.isCorrect, mediaId: option.mediaId })),
      }),
    );

    return new APIResponseBuilder<EvaluationIdDTO>()
      .setData(new EvaluationIdDTO({ id: questionId }))
      .setMessage(await i18n.t("evaluation.question_added"))
      .build();
  }

  @Put(":id/questions/order")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reorder evaluation questions",
    description: "Applies the new question order (and optional scenario moves) in one transactional statement; allowed after attempts were submitted",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Questions reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, or ids or scenarios that do not belong to the evaluation" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async reorderEvaluationQuestions(
    @Param("id") id: string,
    @Body() dto: ReorderQuestionsDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._reorderEvaluationQuestionsUseCase.execute(
      new ReorderEvaluationQuestionsCommand({
        evaluationId: id,
        actor: toEvaluationActor(currentUser),
        items: dto.items.map((item: QuestionReorderItemDTO) => ({ id: item.id, order: item.order, scenarioId: item.scenarioId })),
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.items_reordered")).build();
  }

  @Patch(":id/questions/:questionId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update evaluation question",
    description: "Prompt, explanation, media and scenario can always change; type, points, rubric and clinical case are blocked once attempts were submitted",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Question updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid rich text" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation, question or scenario not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Structural change with submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media or clinical case, or a READY evaluation would become invalid" })
  public async updateEvaluationQuestion(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: UpdateEvaluationQuestionDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateEvaluationQuestionUseCase.execute(
      new UpdateEvaluationQuestionCommand({
        evaluationId: id,
        questionId,
        actor: toEvaluationActor(currentUser),
        type: (dto.type ?? undefined) as EvaluationQuestionTypeValue | undefined,
        prompt: dto.prompt ?? undefined,
        points: dto.points ?? undefined,
        explanation: dto.explanation,
        scenarioId: dto.scenarioId,
        mediaIds: dto.mediaIds ?? undefined,
        clinicalCaseId: dto.clinicalCaseId,
        rubric: dto.rubric,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.question_updated")).build();
  }

  @Delete(":id/questions/:questionId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove evaluation question", description: "Removes a question and its options; blocked once attempts were submitted" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Question removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or question not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The evaluation has submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "A READY evaluation would become invalid" })
  public async removeEvaluationQuestion(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeEvaluationQuestionUseCase.execute(
      new RemoveEvaluationQuestionCommand({ evaluationId: id, questionId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.question_removed")).build();
  }

  @Post(":id/questions/:questionId/options")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add question option", description: "Appends an option to a choice question and returns its ID; blocked once attempts were submitted" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Option added successfully", type: EvaluationIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or question not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The evaluation has submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media, non-choice question, or a READY evaluation would become invalid" })
  public async addEvaluationOption(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: CreateEvaluationOptionDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationIdDTO>> {
    const optionId: string = await this._addEvaluationOptionUseCase.execute(
      new AddEvaluationOptionCommand({
        evaluationId: id,
        questionId,
        actor: toEvaluationActor(currentUser),
        content: dto.content,
        isCorrect: dto.isCorrect,
        mediaId: dto.mediaId,
      }),
    );

    return new APIResponseBuilder<EvaluationIdDTO>()
      .setData(new EvaluationIdDTO({ id: optionId }))
      .setMessage(await i18n.t("evaluation.option_added"))
      .build();
  }

  @Put(":id/questions/:questionId/options/order")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder question options", description: "Applies the new option order in one transactional statement" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Options reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, or ids that do not belong to the question" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or question not found" })
  public async reorderEvaluationOptions(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: ReorderItemsDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._reorderEvaluationOptionsUseCase.execute(
      new ReorderEvaluationOptionsCommand({
        evaluationId: id,
        questionId,
        actor: toEvaluationActor(currentUser),
        items: dto.items.map((item: ReorderItemDTO) => ({ id: item.id, order: item.order })),
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.items_reordered")).build();
  }

  @Patch(":id/questions/:questionId/options/:optionId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update question option", description: "Text and media can always change; isCorrect is blocked once attempts were submitted" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Option updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation, question or option not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Correct answer change with submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Unknown media, or a READY evaluation would become invalid" })
  public async updateEvaluationOption(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Param("optionId") optionId: string,
    @Body() dto: UpdateEvaluationOptionDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateEvaluationOptionUseCase.execute(
      new UpdateEvaluationOptionCommand({
        evaluationId: id,
        questionId,
        optionId,
        actor: toEvaluationActor(currentUser),
        content: dto.content ?? undefined,
        isCorrect: dto.isCorrect ?? undefined,
        mediaId: dto.mediaId,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.option_updated")).build();
  }

  @Delete(":id/questions/:questionId/options/:optionId")
  @RequirePermissions("evaluations:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove question option", description: "Removes an option; blocked once attempts were submitted" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Option removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller cannot manage this evaluation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation, question or option not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The evaluation has submitted attempts" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "A READY evaluation would become invalid" })
  public async removeEvaluationOption(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Param("optionId") optionId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeEvaluationOptionUseCase.execute(
      new RemoveEvaluationOptionCommand({ evaluationId: id, questionId, optionId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.option_removed")).build();
  }
}
