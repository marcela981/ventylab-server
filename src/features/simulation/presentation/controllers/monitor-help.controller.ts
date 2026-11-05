/*
 * Funcionalidad: Controlador de la ayuda del monitor
 * Descripción: Rutas SSE de la ayuda "¿Cómo estabilizar?" de una alarma de una sesión de simulación activa y de la asistencia y la ayuda de alarmas en modo real (telemetría enviada por el cliente). Eventos: rules (solo ayuda de alarmas) con las reglas deterministas, delta con cada fragmento, done con aiCallId, source y, en simulación, aiHelpEventId; error si falla después de empezar. Los errores previos al flujo usan el sobre JSON habitual
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, HttpStatus, Logger, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { DomainError } from "@/common/domain/errors/domain-error";
import { Language, type LanguageValue } from "@/common/domain/value-objects/language";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AlarmHelpSimulationUseCase } from "@/features/simulation/application/monitor-help/alarm-help-simulation.usecase";
import { type MonitorHelpEvent } from "@/features/simulation/application/monitor-help/monitor-help-stream.result";
import { type RealMonitorState, RealMonitorHelpUseCase } from "@/features/simulation/application/monitor-help/real-monitor-help.usecase";
import { RealAlarmHelpDTO, RealAssistDTO, SimulationAlarmHelpDTO } from "@/features/simulation/presentation/dtos/monitor-help-request.dto";
import {
  abortOnClientDisconnect,
  pipeEventsToSse,
  SSE_CONTENT_TYPE,
  type SseErrorPayload,
  writeEvent,
} from "@/features/simulation/presentation/sse/simulation-assist-sse";

const HELP_RATE_LIMIT: number = 20;
const HELP_RATE_WINDOW_MS: number = 60000;
const ALARM_HELP_FAILED_CODE: string = "simulation.alarm_help_failed";
const ASSIST_FAILED_CODE: string = "simulation.assist_failed";

const STREAM_DESCRIPTION: string =
  "Responds text/event-stream: `event: rules` with `{alarmCode, rules: [{id, text, reference}]}` (deterministic, always first in the alarm help), `event: delta` with `{text}` per fragment, then `event: done` with `{aiCallId, source}` (plus `aiHelpEventId` for a simulation session; `source` is LLM or DETERMINISTIC; rate an LLM answer with ai-ratings targetType AI_CALL, targetId = aiCallId, surface SIM_ALARM for alarms), or `event: error` with `{code, message}` if the answer fails after it started. Errors before the stream starts use the regular JSON error envelope. The AI only suggests: it never sends commands to a ventilator.";

function writeMonitorHelpEvent(res: Response, event: MonitorHelpEvent): void {
  if (event.type === "rules") {
    writeEvent(res, "rules", { alarmCode: event.alarmCode, rules: event.rules });

    return;
  }

  if (event.type === "delta") {
    writeEvent(res, "delta", { text: event.text });

    return;
  }

  writeEvent(res, "done", {
    aiCallId: event.aiCallId,
    source: event.source,
    ...(event.aiHelpEventId === undefined ? {} : { aiHelpEventId: event.aiHelpEventId }),
  });
}

@ApiTags("Simulation")
@ApiBearerAuth("JWT-auth")
@Controller("api/simulation")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MonitorHelpController {
  private readonly _logger: Logger = new Logger(MonitorHelpController.name);

  public constructor(
    private readonly _alarmHelpSimulationUseCase: AlarmHelpSimulationUseCase,
    private readonly _realMonitorHelpUseCase: RealMonitorHelpUseCase,
  ) {}

  @Post("sessions/:id/alarm-help")
  @RequirePermissions("simulation:control")
  @Throttle({ default: { limit: HELP_RATE_LIMIT, ttl: HELP_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "How to stabilize an alarm of my active simulation session",
    description: `Deterministic rules for the alarm in the current context, then an AI suggestion. EXAM sessions follow the assistance policy of the evaluation (ALLOWED_WITH_PENALTY only); every completed answer is recorded as an AI_HELP event of kind ALARM_HELP. ${STREAM_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the rules and the suggestion" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission, session of another user or assistance disabled in this exam" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Simulation session not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The simulation session is not active" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  public async alarmHelp(
    @Param("id") id: string,
    @Body() dto: SimulationAlarmHelpDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const events: AsyncIterable<MonitorHelpEvent> = await this._alarmHelpSimulationUseCase.execute({
      sessionId: id,
      userId: currentUser.sub,
      userRole: currentUser.role,
      alarmCode: dto.alarmCode,
      language: MonitorHelpController._language(dto.language, i18n),
      signal: controller.signal,
    });

    await this._pipe(res, events, i18n, ALARM_HELP_FAILED_CODE, `session ${id}`);
  }

  @Post("real/alarm-help")
  @RequirePermissions("ventilator:control")
  @Throttle({ default: { limit: HELP_RATE_LIMIT, ttl: HELP_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "How to stabilize an alarm of the physical ventilator",
    description: `Deterministic rules for the alarm with the recent telemetry sent by the client, then an AI suggestion. ${STREAM_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the rules and the suggestion" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  public async realAlarmHelp(
    @Body() dto: RealAlarmHelpDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const events: AsyncIterable<MonitorHelpEvent> = await this._realMonitorHelpUseCase.alarmHelp({
      userId: currentUser.sub,
      userRole: currentUser.role,
      state: dto.state as RealMonitorState,
      alarmCode: dto.alarmCode,
      language: MonitorHelpController._language(dto.language, i18n),
      signal: controller.signal,
    });

    await this._pipe(res, events, i18n, ALARM_HELP_FAILED_CODE, "real alarm help");
  }

  @Post("real/assist")
  @RequirePermissions("ventilator:control")
  @Throttle({ default: { limit: HELP_RATE_LIMIT, ttl: HELP_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "AI assistance on the physical ventilator",
    description: `Guidance on the recent telemetry sent by the client and the loaded case, optionally answering a question. ${STREAM_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the answer" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  public async realAssist(
    @Body() dto: RealAssistDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const events: AsyncIterable<MonitorHelpEvent> = await this._realMonitorHelpUseCase.assist({
      userId: currentUser.sub,
      userRole: currentUser.role,
      state: dto.state as RealMonitorState,
      question: dto.question,
      language: MonitorHelpController._language(dto.language, i18n),
      signal: controller.signal,
    });

    await this._pipe(res, events, i18n, ASSIST_FAILED_CODE, "real assist");
  }

  private async _pipe(res: Response, events: AsyncIterable<MonitorHelpEvent>, i18n: I18nContext, failedCode: string, label: string): Promise<void> {
    await pipeEventsToSse(res, events, writeMonitorHelpEvent, (error: unknown): Promise<SseErrorPayload> => {
      const code: string = error instanceof DomainError ? error.code : failedCode;

      this._logger.warn(`Monitor help (${label}) failed after it started: ${error instanceof Error ? error.name : "UnknownError"}`);

      return Promise.resolve({ code, message: String(i18n.t(code)) });
    });
  }

  private static _language(requested: string | undefined, i18n: I18nContext): LanguageValue {
    return Language.createOrDefault(requested ?? i18n.lang).value;
  }
}
