/*
 * Funcionalidad: Controlador de casos clínicos
 * Descripción: Endpoints autenticados de /api/clinical-cases (alias /api/cases): listado y detalle (solo publicados sin clinical-cases:manage), evaluación con retroalimentación de IA (límite de 10 solicitudes por minuto; la configuración experta solo se revela con clinical-cases:view_expert), historial de intentos y gestión docente (definición, creación, reemplazo, estado, duplicado, validación por experto y eliminación); respuestas sin caché
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { I18n, I18nContext } from "nestjs-i18n";

import { Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ChangeClinicalCaseStatusCommand } from "@/features/clinical-cases/application/commands/change-clinical-case-status.command";
import { CreateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/create-clinical-case.command";
import { DeleteClinicalCaseCommand } from "@/features/clinical-cases/application/commands/delete-clinical-case.command";
import { DuplicateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/duplicate-clinical-case.command";
import { EvaluateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/evaluate-clinical-case.command";
import { UpdateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/update-clinical-case.command";
import { ValidateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/validate-clinical-case.command";
import {
  ClinicalCaseAttemptsResult,
  ClinicalCaseDetailResult,
  ClinicalCaseEvaluationResult,
} from "@/features/clinical-cases/application/results/clinical-case.results";
import { ChangeClinicalCaseStatusUseCase } from "@/features/clinical-cases/application/use-cases/change-clinical-case-status.usecase";
import { CreateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/create-clinical-case.usecase";
import { DeleteClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/delete-clinical-case.usecase";
import { DuplicateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/duplicate-clinical-case.usecase";
import { EvaluateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/evaluate-clinical-case.usecase";
import { GetClinicalCaseAttemptsUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case-attempts.usecase";
import { GetClinicalCaseDefinitionUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case-definition.usecase";
import { GetClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case.usecase";
import { GetClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-cases.usecase";
import { UpdateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/update-clinical-case.usecase";
import { ValidateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/validate-clinical-case.usecase";
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseListItem } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";
import { ClinicalCaseDefinitionDTO, ClinicalCaseIdDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-definition.dto";
import { ClinicalCaseEvaluationDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-evaluation.dto";
import { ChangeClinicalCaseStatusDTO, UpsertClinicalCaseDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-management.dto";
import { EvaluateClinicalCaseDTO, GetClinicalCasesQueryDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-request.dto";
import { ClinicalCaseAttemptsDTO, ClinicalCaseDetailDTO, ClinicalCaseListItemDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case.dto";
import { ClinicalCaseManagementMapper } from "@/features/clinical-cases/presentation/mappers/clinical-case-management.mapper";
import { ClinicalCasesMapper } from "@/features/clinical-cases/presentation/mappers/clinical-cases.mapper";

const NO_STORE_CACHE_CONTROL: string = "no-store, no-cache, must-revalidate, private";
const EVALUATION_RATE_LIMIT: number = 10;
const EVALUATION_RATE_WINDOW_MS: number = 60000;
const MANAGE_PERMISSION: string = "clinical-cases:manage";

@ApiTags("Clinical cases")
@ApiBearerAuth("JWT-auth")
@Controller(["api/clinical-cases", "api/cases"])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalCasesController {
  public constructor(
    private readonly _getClinicalCasesUseCase: GetClinicalCasesUseCase,
    private readonly _getClinicalCaseUseCase: GetClinicalCaseUseCase,
    private readonly _evaluateClinicalCaseUseCase: EvaluateClinicalCaseUseCase,
    private readonly _getClinicalCaseAttemptsUseCase: GetClinicalCaseAttemptsUseCase,
    private readonly _getClinicalCaseDefinitionUseCase: GetClinicalCaseDefinitionUseCase,
    private readonly _createClinicalCaseUseCase: CreateClinicalCaseUseCase,
    private readonly _updateClinicalCaseUseCase: UpdateClinicalCaseUseCase,
    private readonly _changeClinicalCaseStatusUseCase: ChangeClinicalCaseStatusUseCase,
    private readonly _duplicateClinicalCaseUseCase: DuplicateClinicalCaseUseCase,
    private readonly _validateClinicalCaseUseCase: ValidateClinicalCaseUseCase,
    private readonly _deleteClinicalCaseUseCase: DeleteClinicalCaseUseCase,
  ) {}

  @Get()
  @RequirePermissions("clinical-cases:read")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @ApiOperation({
    summary: "Get clinical cases",
    description:
      "Paginated list of clinical cases, newest first, without the expert configuration, with the user's attempts summary; only published cases unless the caller holds clinical-cases:manage, who may filter by status",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical cases retrieved successfully", type: ClinicalCaseListItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getClinicalCases(
    @Query() query: GetClinicalCasesQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseListItemDTO[]>> {
    const cases: Paginated<ClinicalCaseListItem> = await this._getClinicalCasesUseCase.execute(
      {
        page: query.page,
        limit: query.limit,
        difficulty: query.difficulty as CaseDifficultyValue | undefined,
        pathology: query.pathology as PathologyValue | undefined,
        status: query.status as ClinicalCaseStatusValue | undefined,
      },
      currentUser.sub,
      currentUser.permissions.includes(MANAGE_PERMISSION),
    );

    return new APIResponseBuilder<ClinicalCaseListItemDTO[]>()
      .setData(cases.data.map((item: ClinicalCaseListItem) => ClinicalCasesMapper.toListItemDTO(item)))
      .setPagination(cases.pagination)
      .setMessage(await i18n.t("clinical-cases.clinical_cases_retrieved"))
      .build();
  }

  @Get(":caseId")
  @RequirePermissions("clinical-cases:read")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @ApiOperation({
    summary: "Get clinical case by ID",
    description: "Retrieves a clinical case and the user's last 5 attempts; unpublished cases are only visible to callers holding clinical-cases:manage",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case retrieved successfully", type: ClinicalCaseDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Clinical case not available" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async getClinicalCaseById(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseDetailDTO>> {
    const result: ClinicalCaseDetailResult = await this._getClinicalCaseUseCase.execute(
      caseId,
      currentUser.sub,
      currentUser.permissions.includes(MANAGE_PERMISSION),
    );

    return new APIResponseBuilder<ClinicalCaseDetailDTO>()
      .setData(ClinicalCasesMapper.toDetailDTO(result))
      .setMessage(await i18n.t("clinical-cases.clinical_case_retrieved"))
      .build();
  }

  @Post(":caseId/evaluate")
  @RequirePermissions("clinical-cases:evaluate")
  @Throttle({ default: { limit: EVALUATION_RATE_LIMIT, ttl: EVALUATION_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @ApiOperation({
    summary: "Evaluate clinical case",
    description:
      "Compares the student's ventilator configuration with the expert one, generates AI feedback (deterministic fallback when AI fails) and records the attempt; expert values and differences are only returned to callers holding clinical-cases:view_expert",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Configuration evaluated and attempt recorded", type: ClinicalCaseEvaluationDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Clinical case has no expert configuration" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many evaluation requests" })
  public async evaluateClinicalCase(
    @Param("caseId") caseId: string,
    @Body() dto: EvaluateClinicalCaseDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseEvaluationDTO>> {
    const result: ClinicalCaseEvaluationResult = await this._evaluateClinicalCaseUseCase.execute(
      new EvaluateClinicalCaseCommand({
        userId: currentUser.sub,
        userRole: currentUser.role,
        caseId,
        configuration: ClinicalCasesMapper.toConfiguration(dto.configuration),
      }),
    );

    return new APIResponseBuilder<ClinicalCaseEvaluationDTO>()
      .setData(ClinicalCasesMapper.toEvaluationDTO(result, currentUser.permissions.includes("clinical-cases:view_expert")))
      .setMessage(await i18n.t("clinical-cases.clinical_case_evaluated"))
      .build();
  }

  @Get(":caseId/attempts")
  @RequirePermissions("clinical-cases:read")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @ApiOperation({ summary: "Get clinical case attempts", description: "Attempt history of the user in a clinical case with statistics" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempts retrieved successfully", type: ClinicalCaseAttemptsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async getClinicalCaseAttempts(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseAttemptsDTO>> {
    const result: ClinicalCaseAttemptsResult = await this._getClinicalCaseAttemptsUseCase.execute(caseId, currentUser.sub);

    return new APIResponseBuilder<ClinicalCaseAttemptsDTO>()
      .setData(ClinicalCasesMapper.toAttemptsDTO(result))
      .setMessage(await i18n.t("clinical-cases.attempts_retrieved"))
      .build();
  }

  @Get(":caseId/definition")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @ApiOperation({ summary: "Get clinical case definition", description: "Full editable definition of a clinical case in any status, including its simulation blocks" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case definition retrieved successfully", type: ClinicalCaseDefinitionDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async getClinicalCaseDefinition(@Param("caseId") caseId: string, @I18n() i18n: I18nContext): Promise<APIResponse<ClinicalCaseDefinitionDTO>> {
    const clinicalCase: ClinicalCase = await this._getClinicalCaseDefinitionUseCase.execute(caseId);

    return new APIResponseBuilder<ClinicalCaseDefinitionDTO>()
      .setData(ClinicalCaseManagementMapper.toDefinitionDTO(clinicalCase))
      .setMessage(await i18n.t("clinical-cases.clinical_case_definition_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create clinical case", description: "Creates a draft clinical case owned by the caller after checking its physiological ranges" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Clinical case created successfully", type: ClinicalCaseIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or inconsistent definition" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Physiologically implausible value" })
  public async createClinicalCase(
    @Body() dto: UpsertClinicalCaseDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseIdDTO>> {
    const id: string = await this._createClinicalCaseUseCase.execute(
      new CreateClinicalCaseCommand({ content: ClinicalCaseManagementMapper.toContent(dto), performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<ClinicalCaseIdDTO>()
      .setData(new ClinicalCaseIdDTO({ id }))
      .setMessage(await i18n.t("clinical-cases.clinical_case_created"))
      .build();
  }

  @Put(":caseId")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Replace clinical case",
    description: "Replaces the content and simulation definition of a clinical case and clears its expert validation; cases with simulation sessions must be duplicated instead",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or inconsistent definition" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Clinical case has simulation sessions" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Physiologically implausible value" })
  public async updateClinicalCase(
    @Param("caseId") caseId: string,
    @Body() dto: UpsertClinicalCaseDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateClinicalCaseUseCase.execute(
      new UpdateClinicalCaseCommand({ caseId, content: ClinicalCaseManagementMapper.toContent(dto), performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("clinical-cases.clinical_case_updated")).build();
  }

  @Patch(":caseId/status")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change clinical case status", description: "Moves a clinical case between DRAFT, PUBLISHED and ARCHIVED; only published cases are visible to students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case status changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async changeClinicalCaseStatus(
    @Param("caseId") caseId: string,
    @Body() dto: ChangeClinicalCaseStatusDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._changeClinicalCaseStatusUseCase.execute(
      new ChangeClinicalCaseStatusCommand({ caseId, status: dto.status as ClinicalCaseStatusValue, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("clinical-cases.clinical_case_status_changed")).build();
  }

  @Post(":caseId/duplicate")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Duplicate clinical case", description: "Copies a clinical case as a new unvalidated draft owned by the caller" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Clinical case duplicated successfully", type: ClinicalCaseIdDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async duplicateClinicalCase(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseIdDTO>> {
    const titleSuffix: string = await i18n.t("clinical-cases.duplicate_title_suffix");
    const id: string = await this._duplicateClinicalCaseUseCase.execute(new DuplicateClinicalCaseCommand({ caseId, titleSuffix, performedBy: currentUser.sub }));

    return new APIResponseBuilder<ClinicalCaseIdDTO>()
      .setData(new ClinicalCaseIdDTO({ id }))
      .setMessage(await i18n.t("clinical-cases.clinical_case_duplicated"))
      .build();
  }

  @Patch(":caseId/expert-validation")
  @RequirePermissions("clinical-cases:validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate clinical case", description: "Marks a clinical case as validated by an expert, recording the caller as validator" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case validated successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async validateClinicalCase(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._validateClinicalCaseUseCase.execute(new ValidateClinicalCaseCommand({ caseId, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("clinical-cases.clinical_case_validated")).build();
  }

  @Delete(":caseId")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete clinical case",
    description: "Deletes a clinical case without simulation sessions, evaluation attempts or evaluation questions; otherwise answers 409 and suggests archiving it",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Clinical case is in use" })
  public async deleteClinicalCase(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._deleteClinicalCaseUseCase.execute(new DeleteClinicalCaseCommand({ caseId, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("clinical-cases.clinical_case_deleted")).build();
  }
}
