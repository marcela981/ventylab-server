/*
 * Funcionalidad: Controlador de simulación
 * Descripción: Endpoints /api/simulation: salud pública del módulo, estado del ventilador, envío de comandos (simulación sintética o ventilador físico), reserva y liberación, apertura y guardado de sesiones y listado de sesiones del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CreateSimulatorSessionCommand } from "@/features/simulation/application/commands/create-simulator-session.command";
import { ReserveVentilatorCommand } from "@/features/simulation/application/commands/reserve-ventilator.command";
import { SaveSimulatorSessionCommand } from "@/features/simulation/application/commands/save-simulator-session.command";
import { SendVentilatorCommandCommand } from "@/features/simulation/application/commands/send-ventilator-command.command";
import { type ReserveVentilatorResult } from "@/features/simulation/application/results/reserve-ventilator.result";
import { type CommandTargetValue, type SendVentilatorCommandResult } from "@/features/simulation/application/results/send-ventilator-command.result";
import { type VentilatorStatusResult } from "@/features/simulation/application/results/ventilator-status.result";
import { CreateSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/create-simulator-session.usecase";
import { GetSimulationHealthUseCase } from "@/features/simulation/application/use-cases/get-simulation-health.usecase";
import { GetSimulatorSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulator-sessions.usecase";
import { GetVentilatorStatusUseCase } from "@/features/simulation/application/use-cases/get-ventilator-status.usecase";
import { ReleaseVentilatorUseCase } from "@/features/simulation/application/use-cases/release-ventilator.usecase";
import { ReserveVentilatorUseCase } from "@/features/simulation/application/use-cases/reserve-ventilator.usecase";
import { SaveSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/save-simulator-session.usecase";
import { SendVentilatorCommandUseCase } from "@/features/simulation/application/use-cases/send-ventilator-command.usecase";
import { type SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";
import {
  CreateSimulatorSessionDTO,
  GetSimulatorSessionsQueryDTO,
  GetVentilatorStatusQueryDTO,
  ReserveVentilatorDTO,
  SaveSimulatorSessionDTO,
  SendVentilatorCommandDTO,
} from "@/features/simulation/presentation/dtos/simulation-request.dto";
import {
  CommandResultDTO,
  ReservationDTO,
  SimulationHealthDTO,
  SimulatorSessionDTO,
  SimulatorSessionIdDTO,
  VentilatorStatusDTO,
} from "@/features/simulation/presentation/dtos/simulation.dto";
import { PatientConfigurationMapper } from "@/features/simulation/presentation/mappers/patient-configuration.mapper";
import { SimulationMapper } from "@/features/simulation/presentation/mappers/simulation.mapper";

const COMMAND_MESSAGE_KEYS: Readonly<Record<CommandTargetValue, string>> = {
  synthetic_update: "simulation.command_applied_synthetic",
  synthetic_start: "simulation.command_started_synthetic",
  physical: "simulation.command_sent",
};

@ApiTags("Simulation")
@Controller("api/simulation")
export class SimulationController {
  public constructor(
    private readonly _getSimulationHealthUseCase: GetSimulationHealthUseCase,
    private readonly _getVentilatorStatusUseCase: GetVentilatorStatusUseCase,
    private readonly _sendVentilatorCommandUseCase: SendVentilatorCommandUseCase,
    private readonly _reserveVentilatorUseCase: ReserveVentilatorUseCase,
    private readonly _releaseVentilatorUseCase: ReleaseVentilatorUseCase,
    private readonly _createSimulatorSessionUseCase: CreateSimulatorSessionUseCase,
    private readonly _saveSimulatorSessionUseCase: SaveSimulatorSessionUseCase,
    private readonly _getSimulatorSessionsUseCase: GetSimulatorSessionsUseCase,
  ) {}

  @Get("health")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Simulation health", description: "Public in-memory snapshot: MQTT status and topic, authenticated WebSocket users, frames per second and active reservation" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Health retrieved successfully", type: SimulationHealthDTO })
  public async getHealth(@I18n() i18n: I18nContext): Promise<APIResponse<SimulationHealthDTO>> {
    return new APIResponseBuilder<SimulationHealthDTO>()
      .setData(SimulationMapper.toHealthDTO(this._getSimulationHealthUseCase.execute()))
      .setMessage(await i18n.t("simulation.health_retrieved"))
      .build();
  }

  @Get("status")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ventilator status", description: "Expires overdue reservations and returns the MQTT status, the active reservation of the device, the last frame time and active alarms" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Status retrieved successfully", type: VentilatorStatusDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getStatus(@Query() query: GetVentilatorStatusQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<VentilatorStatusDTO>> {
    const result: VentilatorStatusResult = await this._getVentilatorStatusUseCase.execute(query.deviceId);

    return new APIResponseBuilder<VentilatorStatusDTO>()
      .setData(SimulationMapper.toStatusDTO(result))
      .setMessage(await i18n.t("simulation.status_retrieved"))
      .build();
  }

  @Post("command")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send ventilator command",
    description: "Adjusts the running synthetic simulation, starts it when a patient is configured, or validates and publishes the command to the physical ventilator over MQTT",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Command accepted", type: CommandResultDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the reservation leader" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Command parameters out of the safe ranges" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "Ventilator not connected" })
  public async sendCommand(
    @Body() dto: SendVentilatorCommandDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CommandResultDTO>> {
    const result: SendVentilatorCommandResult = await this._sendVentilatorCommandUseCase.execute(
      new SendVentilatorCommandCommand({
        userId: currentUser.sub,
        command: PatientConfigurationMapper.toVentilatorCommand(dto.command),
      }),
    );

    return new APIResponseBuilder<CommandResultDTO>()
      .setData(SimulationMapper.toCommandResultDTO(result))
      .setMessage(await i18n.t(COMMAND_MESSAGE_KEYS[result.target]))
      .build();
  }

  @Post("reserve")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reserve ventilator",
    description: "Reserves the physical ventilator; returns the caller's existing reservation when they already hold it. With a group, the leader defaults to the group's simulator leader",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Ventilator reserved or reservation recovered", type: ReservationDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group or leader not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Ventilator already reserved by another user" })
  public async reserve(
    @Body() dto: ReserveVentilatorDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ReservationDTO>> {
    const result: ReserveVentilatorResult = await this._reserveVentilatorUseCase.execute(
      new ReserveVentilatorCommand({
        userId: currentUser.sub,
        userRole: currentUser.role,
        durationMinutes: dto.durationMinutes,
        purpose: dto.purpose,
        groupId: dto.groupId,
        leaderId: dto.leaderId,
      }),
    );

    return new APIResponseBuilder<ReservationDTO>()
      .setData(SimulationMapper.toReservationDTO(result))
      .setMessage(await i18n.t(result.recovered ? "simulation.reservation_recovered" : "simulation.ventilator_reserved"))
      .build();
  }

  @Delete("reserve")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Release ventilator", description: "Releases the caller's active reservation" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Reservation released" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "No active reservation" })
  public async release(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._releaseVentilatorUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("simulation.reservation_released"))
      .build();
  }

  @Post("session")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create simulator session",
    description: "Opens a session; in simulated mode (default) it also configures the patient from patientData, without MQTT",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Session created", type: SimulatorSessionIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or missing patient data" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Simulator clinical case not found" })
  public async createSession(
    @Body() dto: CreateSimulatorSessionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulatorSessionIdDTO>> {
    const isRealVentilator: boolean = dto.isRealVentilator ?? false;

    const id: string = await this._createSimulatorSessionUseCase.execute(
      new CreateSimulatorSessionCommand({
        userId: currentUser.sub,
        isRealVentilator,
        patientData: dto.patientData ? PatientConfigurationMapper.toConfiguration(dto.patientData) : undefined,
        parametersLog: dto.parametersLog,
        ventilatorData: dto.ventilatorData,
        notes: dto.notes,
        clinicalCaseId: dto.clinicalCaseId,
      }),
    );

    return new APIResponseBuilder<SimulatorSessionIdDTO>()
      .setData(new SimulatorSessionIdDTO({ id }))
      .setMessage(await i18n.t(isRealVentilator ? "simulation.session_created_real" : "simulation.session_created_simulated"))
      .build();
  }

  @Post("session/save")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Save simulator session", description: "Stores a completed session with its parameters log and readings" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Session saved", type: SimulatorSessionIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async saveSession(
    @Body() dto: SaveSimulatorSessionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulatorSessionIdDTO>> {
    const id: string = await this._saveSimulatorSessionUseCase.execute(
      new SaveSimulatorSessionCommand({
        userId: currentUser.sub,
        isRealVentilator: dto.isRealVentilator ?? false,
        parametersLog: dto.parametersLog,
        ventilatorData: dto.ventilatorData,
        notes: dto.notes,
        clinicalCaseId: dto.clinicalCaseId,
      }),
    );

    return new APIResponseBuilder<SimulatorSessionIdDTO>()
      .setData(new SimulatorSessionIdDTO({ id }))
      .setMessage(await i18n.t("simulation.session_saved"))
      .build();
  }

  @Get("sessions")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my simulator sessions", description: "Sessions of the authenticated user, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Sessions retrieved successfully", type: SimulatorSessionDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getSessions(
    @Query() query: GetSimulatorSessionsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulatorSessionDTO[]>> {
    const sessions: SimulatorSession[] = await this._getSimulatorSessionsUseCase.execute(currentUser.sub, query.limit);

    return new APIResponseBuilder<SimulatorSessionDTO[]>()
      .setData(SimulationMapper.toSessionDTOList(sessions))
      .setMessage(await i18n.t("simulation.sessions_retrieved"))
      .build();
  }
}
