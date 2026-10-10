/*
 * Funcionalidad: Controlador de prueba de casos clínicos en el motor
 * Descripción: Endpoint POST /api/clinical-cases/:caseId/test-run para docentes y administradores (clinical-cases:manage): ejecuta el motor fisiológico sin intervención sobre un caso en cualquier estado y devuelve la línea de tiempo de métricas; vive en la feature de simulación porque casos clínicos no depende del motor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { RunClinicalCaseTestCommand } from "@/features/simulation/application/commands/run-clinical-case-test.command";
import { type ClinicalCaseTestRunResult } from "@/features/simulation/application/results/simulation-session.results";
import { RunClinicalCaseTestUseCase } from "@/features/simulation/application/use-cases/run-clinical-case-test.usecase";
import {
  ClinicalCaseTestRunRequestDTO,
  DEFAULT_TEST_RUN_SECONDS,
} from "@/features/simulation/presentation/dtos/simulation-session-request.dto";
import { ClinicalCaseTestRunDTO } from "@/features/simulation/presentation/dtos/simulation-session.dto";
import { SimulationSessionsResponseMapper } from "@/features/simulation/presentation/mappers/simulation-sessions.mapper";

@ApiTags("Clinical cases")
@ApiBearerAuth("JWT-auth")
@Controller("api/clinical-cases")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalCaseTestRunController {
  public constructor(private readonly _runClinicalCaseTestUseCase: RunClinicalCaseTestUseCase) {}

  @Post(":caseId/test-run")
  @RequirePermissions("clinical-cases:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Test a clinical case in the engine",
    description: "Runs the deterministic engine without intervention for 1–1800 simulated seconds (default 300) on a case in any status and returns one metrics snapshot per simulated second",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Test run completed", type: ClinicalCaseTestRunDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing clinical-cases:manage permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Case lacks a valid simulation profile" })
  public async runClinicalCaseTest(
    @Param("caseId") caseId: string,
    @Body() dto: ClinicalCaseTestRunRequestDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ClinicalCaseTestRunDTO>> {
    const result: ClinicalCaseTestRunResult = await this._runClinicalCaseTestUseCase.execute(
      new RunClinicalCaseTestCommand({ caseId, seconds: dto.seconds ?? DEFAULT_TEST_RUN_SECONDS, seed: dto.seed }),
    );

    return new APIResponseBuilder<ClinicalCaseTestRunDTO>()
      .setData(SimulationSessionsResponseMapper.toTestRunDTO(result))
      .setMessage(await i18n.t("simulation.case_test_run_completed"))
      .build();
  }
}
