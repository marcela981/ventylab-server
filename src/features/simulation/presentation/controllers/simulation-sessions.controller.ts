/*
 * Funcionalidad: Controlador de sesiones de simulación con eventos
 * Descripción: Endpoints /api/simulation/sessions: inicio de sesión FREE o EXAM, lote de eventos con idempotencia y anti-manipulación de tiempo, estado repetido en el servidor, fin con calificación del servidor, resumen, repetición e historial paginado (/history, porque GET /api/simulation/sessions conserva el contrato heredado); escrituras solo del dueño y lecturas del dueño o de docentes y administradores que gestionan o supervisan su grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
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
import { AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import { EndSimulationSessionCommand } from "@/features/simulation/application/commands/end-simulation-session.command";
import { StartSimulationSessionCommand } from "@/features/simulation/application/commands/start-simulation-session.command";
import {
  type AppendSimulationEventsResult,
  type SimulationSessionReplayResult,
  type SimulationSessionStateResult,
  type SimulationSessionSummaryResult,
  type StartSimulationSessionResult,
} from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import { AppendSimulationEventsUseCase } from "@/features/simulation/application/use-cases/append-simulation-events.usecase";
import { EndSimulationSessionUseCase } from "@/features/simulation/application/use-cases/end-simulation-session.usecase";
import { GetSimulationSessionReplayUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-replay.usecase";
import { GetSimulationSessionStateUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-state.usecase";
import { GetSimulationSessionSummaryUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-summary.usecase";
import { GetSimulationSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulation-sessions.usecase";
import { StartSimulationSessionUseCase } from "@/features/simulation/application/use-cases/start-simulation-session.usecase";
import { type TimeMultiplier } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type ClientSimulationEvent } from "@/features/simulation/domain/sessions/simulation-session-events";
import {
  type ClientSimulationEventTypeValue,
  type SimulationModeValue,
  type SimulationSessionStatusValue,
} from "@/features/simulation/domain/value-objects/simulation-session-values";
import {
  AppendSimulationEventsDTO,
  EndSimulationSessionDTO,
  GetSimulationSessionsQueryDTO,
  type SimulationEventInputDTO,
  StartSimulationSessionDTO,
} from "@/features/simulation/presentation/dtos/simulation-session-request.dto";
import {
  AppendedSimulationEventsDTO,
  SimulationSessionDTO,
  SimulationSessionReplayDTO,
  SimulationSessionStateDTO,
  SimulationSessionSummaryDTO,
  StartedSimulationSessionDTO,
} from "@/features/simulation/presentation/dtos/simulation-session.dto";
import { SimulationSessionsResponseMapper } from "@/features/simulation/presentation/mappers/simulation-sessions.mapper";

const DEFAULT_TIME_MULTIPLIER: TimeMultiplier = 1;

@ApiTags("Simulation")
@ApiBearerAuth("JWT-auth")
@Controller("api/simulation/sessions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SimulationSessionsController {
  public constructor(
    private readonly _startSimulationSessionUseCase: StartSimulationSessionUseCase,
    private readonly _appendSimulationEventsUseCase: AppendSimulationEventsUseCase,
    private readonly _getSimulationSessionStateUseCase: GetSimulationSessionStateUseCase,
    private readonly _endSimulationSessionUseCase: EndSimulationSessionUseCase,
    private readonly _getSimulationSessionSummaryUseCase: GetSimulationSessionSummaryUseCase,
    private readonly _getSimulationSessionReplayUseCase: GetSimulationSessionReplayUseCase,
    private readonly _getSimulationSessionsUseCase: GetSimulationSessionsUseCase,
  ) {}

  @Post()
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Start a simulation session",
    description:
      "FREE: published, simulation-ready case, no reservation needed. EXAM: own IN_PROGRESS attempt before its deadline and a SIMULATION question of the same evaluation; the case comes from the question. The server generates the seed and fixes the engine version",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Session started", type: StartedSimulationSessionDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or missing caseId in FREE mode" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission, unpublished case or invalid exam attempt or question" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Clinical case not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Case not simulation-ready or invalid rubric" })
  public async startSimulationSession(
    @Body() dto: StartSimulationSessionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StartedSimulationSessionDTO>> {
    const result: StartSimulationSessionResult = await this._startSimulationSessionUseCase.execute(
      new StartSimulationSessionCommand({
        userId: currentUser.sub,
        mode: dto.mode as SimulationModeValue,
        caseId: dto.caseId,
        attemptId: dto.attemptId,
        questionId: dto.questionId,
        timeMultiplier: (dto.timeMultiplier as TimeMultiplier | undefined) ?? DEFAULT_TIME_MULTIPLIER,
      }),
    );

    return new APIResponseBuilder<StartedSimulationSessionDTO>()
      .setData(SimulationSessionsResponseMapper.toStartedDTO(result))
      .setMessage(await i18n.t("simulation.simulation_session_started"))
      .build();
  }

  @Get("history")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List simulation sessions",
    description: "Own sessions by default; userId lists a student's sessions for an ADMIN or a TEACHER managing or supervising the student's group. Newest first unless sortOrder=asc",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Sessions retrieved", type: SimulationSessionDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot read the requested user's sessions" })
  public async getSimulationSessions(
    @Query() query: GetSimulationSessionsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulationSessionDTO[]>> {
    const sessions: Paginated<SimulationSession> = await this._getSimulationSessionsUseCase.execute(this._actor(currentUser), {
      page: query.page,
      limit: query.limit,
      ids: query.ids,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      sortOrder: query.sortOrder,
      userId: query.userId ?? currentUser.sub,
      caseId: query.caseId,
      mode: query.mode as SimulationModeValue | undefined,
      status: query.status as SimulationSessionStatusValue | undefined,
    });

    return new APIResponseBuilder<SimulationSessionDTO[]>()
      .setData(sessions.data.map((session: SimulationSession): SimulationSessionDTO => SimulationSessionsResponseMapper.toSessionDTO(session)))
      .setPagination(sessions.pagination)
      .setMessage(await i18n.t("simulation.simulation_sessions_retrieved"))
      .build();
  }

  @Post(":id/events")
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Record a batch of simulation events",
    description:
      "Owner only, ACTIVE session. Event IDs already stored for the session are skipped (idempotent); simTimeMs must not decrease (400) and must not exceed elapsed real time × timeMultiplier + tolerance (403); PARAM_CHANGE out of the engine limits returns 422. Client scores or metrics are ignored",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Events recorded", type: AppendedSimulationEventsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, batch too large, malformed payload or non-monotonic time" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the owner or simulated time ahead of real time" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Session not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Session not active or event ID used by another session" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Ventilator setting out of range" })
  public async appendSimulationEvents(
    @Param("id") id: string,
    @Body() dto: AppendSimulationEventsDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AppendedSimulationEventsDTO>> {
    const result: AppendSimulationEventsResult = await this._appendSimulationEventsUseCase.execute(
      new AppendSimulationEventsCommand({
        sessionId: id,
        userId: currentUser.sub,
        events: dto.events.map(
          (event: SimulationEventInputDTO): ClientSimulationEvent => ({
            id: event.id,
            simTimeMs: event.simTimeMs,
            type: event.type as ClientSimulationEventTypeValue,
            payload: event.payload,
          }),
        ),
      }),
    );

    return new APIResponseBuilder<AppendedSimulationEventsDTO>()
      .setData(SimulationSessionsResponseMapper.toAppendedDTO(result))
      .setMessage(await i18n.t("simulation.simulation_events_recorded"))
      .build();
  }

  @Get(":id/state")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the server-replayed state of a simulation session", description: "Replays the engine up to the last accepted event" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "State retrieved", type: SimulationSessionStateDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot read the session" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Session not found" })
  public async getSimulationSessionState(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulationSessionStateDTO>> {
    const result: SimulationSessionStateResult = await this._getSimulationSessionStateUseCase.execute(id, this._actor(currentUser));

    return new APIResponseBuilder<SimulationSessionStateDTO>()
      .setData(SimulationSessionsResponseMapper.toStateDTO(result))
      .setMessage(await i18n.t("simulation.simulation_session_state_retrieved"))
      .build();
  }

  @Post(":id/end")
  @RequirePermissions("simulation:control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "End a simulation session",
    description: "Owner only. Replays the engine to the final simulated time and scores it on the server with the session rubric; client scores are ignored",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Session ended", type: SimulationSessionSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or final time before the last event" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the owner or final time ahead of real time" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Session not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Session not active" })
  public async endSimulationSession(
    @Param("id") id: string,
    @Body() dto: EndSimulationSessionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulationSessionSummaryDTO>> {
    const result: SimulationSessionSummaryResult = await this._endSimulationSessionUseCase.execute(
      new EndSimulationSessionCommand({ sessionId: id, userId: currentUser.sub, simTimeMs: dto.simTimeMs }),
    );

    return new APIResponseBuilder<SimulationSessionSummaryDTO>()
      .setData(SimulationSessionsResponseMapper.toSummaryDTO(result))
      .setMessage(await i18n.t("simulation.simulation_session_ended"))
      .build();
  }

  @Get(":id/summary")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the scored summary of a simulation session", description: "Stored summary of an ended session, or computed on the server up to the last accepted event" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Summary retrieved", type: SimulationSessionSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot read the session" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Session not found" })
  public async getSimulationSessionSummary(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulationSessionSummaryDTO>> {
    const result: SimulationSessionSummaryResult = await this._getSimulationSessionSummaryUseCase.execute(id, this._actor(currentUser));

    return new APIResponseBuilder<SimulationSessionSummaryDTO>()
      .setData(SimulationSessionsResponseMapper.toSummaryDTO(result))
      .setMessage(await i18n.t("simulation.simulation_session_summary_retrieved"))
      .build();
  }

  @Get(":id/replay")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the replay data of a simulation session", description: "Case, seed, events and engine versions; warns when the recorded engine version differs from the current one" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Replay retrieved", type: SimulationSessionReplayDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot read the session" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Session not found" })
  public async getSimulationSessionReplay(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SimulationSessionReplayDTO>> {
    const result: SimulationSessionReplayResult = await this._getSimulationSessionReplayUseCase.execute(id, this._actor(currentUser));
    const warning: string | null = result.engineVersionMismatch
      ? await i18n.t("simulation.engine_version_mismatch", {
        args: { recorded: result.session.engineVersion, current: result.currentEngineVersion },
      })
      : null;

    return new APIResponseBuilder<SimulationSessionReplayDTO>()
      .setData(SimulationSessionsResponseMapper.toReplayDTO(result, warning))
      .setMessage(await i18n.t("simulation.simulation_session_replay_retrieved"))
      .build();
  }

  private _actor(currentUser: JwtPayload): SimulationActor {
    return { id: currentUser.sub, role: currentUser.role };
  }
}
