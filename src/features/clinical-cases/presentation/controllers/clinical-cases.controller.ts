/*
 * Funcionalidad: Controlador de casos clínicos
 * Descripción: Endpoints autenticados de /api/clinical-cases (alias /api/cases): listado, detalle, evaluación con retroalimentación de IA (límite de 10 solicitudes por minuto) e historial de intentos; respuestas sin caché
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
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
import { EvaluateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/evaluate-clinical-case.command";
import {
  ClinicalCaseAttemptsResult,
  ClinicalCaseDetailResult,
  ClinicalCaseEvaluationResult,
} from "@/features/clinical-cases/application/results/clinical-case.results";
import { EvaluateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/evaluate-clinical-case.usecase";
import { GetClinicalCaseAttemptsUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case-attempts.usecase";
import { GetClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case.usecase";
import { GetClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-cases.usecase";
import { type ClinicalCaseListItem } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";
import { ClinicalCaseEvaluationDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-evaluation.dto";
import { EvaluateClinicalCaseDTO, GetClinicalCasesQueryDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-request.dto";
import { ClinicalCaseAttemptsDTO, ClinicalCaseDetailDTO, ClinicalCaseListItemDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case.dto";
import { ClinicalCasesMapper } from "@/features/clinical-cases/presentation/mappers/clinical-cases.mapper";

const NO_STORE_CACHE_CONTROL: string = "no-store, no-cache, must-revalidate, private";
const EVALUATION_RATE_LIMIT: number = 10;
const EVALUATION_RATE_WINDOW_MS: number = 60000;

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
  ) {}

  @Get()
  @RequirePermissions("clinical-cases:read")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", NO_STORE_CACHE_CONTROL)
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @ApiOperation({
    summary: "Get clinical cases",
    description: "Paginated list of active clinical cases, newest first, without the expert configuration, with the user's attempts summary",
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
      },
      currentUser.sub,
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
  @ApiOperation({ summary: "Get clinical case by ID", description: "Retrieves an active clinical case and the user's last 5 attempts" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Clinical case retrieved successfully", type: ClinicalCaseDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Clinical case not available" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  public async getClinicalCaseById(
    @Param("caseId") caseId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseDetailDTO>> {
    const result: ClinicalCaseDetailResult = await this._getClinicalCaseUseCase.execute(caseId, currentUser.sub);

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
      "Compares the student's ventilator configuration with the expert one, generates AI feedback (deterministic fallback when AI fails) and records the attempt",
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
        caseId,
        configuration: ClinicalCasesMapper.toConfiguration(dto.configuration),
      }),
    );

    return new APIResponseBuilder<ClinicalCaseEvaluationDTO>()
      .setData(ClinicalCasesMapper.toEvaluationDTO(result))
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
}
