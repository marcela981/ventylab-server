/*
 * Funcionalidad: Controlador del paciente simulado
 * Descripción: Endpoints /api/simulation/patient: configurar el paciente (caso clínico o formulario), iniciar y detener el ciclo de señales que emite `ventilator:data` por WebSocket y consultar el paciente activo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ConfigurePatientCommand } from "@/features/simulation/application/commands/configure-patient.command";
import { StartPatientSimulationCommand } from "@/features/simulation/application/commands/start-patient-simulation.command";
import { ConfigurePatientUseCase } from "@/features/simulation/application/use-cases/configure-patient.usecase";
import { GetActivePatientUseCase } from "@/features/simulation/application/use-cases/get-active-patient.usecase";
import { StartPatientSimulationUseCase } from "@/features/simulation/application/use-cases/start-patient-simulation.usecase";
import { StopPatientSimulationUseCase } from "@/features/simulation/application/use-cases/stop-patient-simulation.usecase";
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";
import { ConfigurePatientDTO, StartPatientSimulationDTO } from "@/features/simulation/presentation/dtos/patient-request.dto";
import { ActivePatientDTO, PatientDTO } from "@/features/simulation/presentation/dtos/patient.dto";
import { PatientConfigurationMapper } from "@/features/simulation/presentation/mappers/patient-configuration.mapper";
import { SimulationMapper } from "@/features/simulation/presentation/mappers/simulation.mapper";

@ApiTags("Patient simulation")
@ApiBearerAuth("JWT-auth")
@Controller("api/simulation/patient")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientSimulationController {
  public constructor(
    private readonly _configurePatientUseCase: ConfigurePatientUseCase,
    private readonly _startPatientSimulationUseCase: StartPatientSimulationUseCase,
    private readonly _stopPatientSimulationUseCase: StopPatientSimulationUseCase,
    private readonly _getActivePatientUseCase: GetActivePatientUseCase,
  ) {}

  @Post("configure")
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Configure simulated patient",
    description: "Builds the patient from a simulator clinical case or from demographics and condition (ideal body weight, BMI and mechanics are calculated); returns the patient",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Patient configured", type: PatientDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or missing demographics and condition" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Simulator clinical case not found" })
  public async configure(
    @Body() dto: ConfigurePatientDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PatientDTO>> {
    const patient: PatientModel = this._configurePatientUseCase.execute(
      new ConfigurePatientCommand({ userId: currentUser.sub, configuration: PatientConfigurationMapper.toConfiguration(dto) }),
    );

    return new APIResponseBuilder<PatientDTO>()
      .setData(SimulationMapper.toPatientDTO(patient))
      .setMessage(await i18n.t("simulation.patient_configured"))
      .build();
  }

  @Post("start")
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start patient simulation", description: "Starts the ~30 Hz signal loop that streams ventilator:data to the caller over WebSocket" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Simulation started" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "No configured patient" })
  public async start(
    @Body() dto: StartPatientSimulationDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    this._startPatientSimulationUseCase.execute(
      new StartPatientSimulationCommand({ userId: currentUser.sub, command: PatientConfigurationMapper.toVentilatorCommand(dto.command) }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("simulation.patient_simulation_started"))
      .build();
  }

  @Post("stop")
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stop patient simulation", description: "Stops the caller's signal loop; does nothing when none is running" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Simulation stopped" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async stop(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    this._stopPatientSimulationUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("simulation.patient_simulation_stopped"))
      .build();
  }

  @Get()
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get active patient", description: "The caller's configured patient, or null, and whether the signal loop is running" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Patient retrieved successfully", type: ActivePatientDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getActivePatient(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ActivePatientDTO>> {
    return new APIResponseBuilder<ActivePatientDTO>()
      .setData(SimulationMapper.toActivePatientDTO(this._getActivePatientUseCase.execute(currentUser.sub)))
      .setMessage(await i18n.t("simulation.patient_retrieved"))
      .build();
  }
}
