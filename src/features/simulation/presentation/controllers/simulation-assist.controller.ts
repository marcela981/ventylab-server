/*
 * Funcionalidad: Controlador de asistencia de IA en simulación
 * Descripción: Ruta autenticada POST /api/simulation/sessions/:id/assist que responde la asistencia de IA de una sesión activa del estudiante como Server-Sent Events (delta, done con el id del evento AI_HELP para calificarla, error); los errores previos al stream usan el sobre JSON normal y la desconexión del cliente cancela la llamada al modelo
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
import { Language } from "@/common/domain/value-objects/language";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AssistSimulationCommand } from "@/features/simulation/application/assist/assist-simulation.command";
import { AssistSimulationUseCase } from "@/features/simulation/application/assist/assist-simulation.usecase";
import { type SimulationAssistStreamResult } from "@/features/simulation/application/assist/simulation-assist-stream.result";
import { SimulationAssistDTO } from "@/features/simulation/presentation/dtos/simulation-assist-request.dto";
import {
  abortOnClientDisconnect,
  pipeAssistStreamToSse,
  SSE_CONTENT_TYPE,
  type SseErrorPayload,
} from "@/features/simulation/presentation/sse/simulation-assist-sse";

const ASSIST_RATE_LIMIT: number = 20;
const ASSIST_RATE_WINDOW_MS: number = 60000;
const ASSIST_FAILED_CODE: string = "simulation.assist_failed";

@ApiTags("Simulation")
@ApiBearerAuth("JWT-auth")
@Controller("api/simulation/sessions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SimulationAssistController {
  private readonly _logger: Logger = new Logger(SimulationAssistController.name);

  public constructor(private readonly _assistSimulationUseCase: AssistSimulationUseCase) {}

  @Post(":id/assist")
  @RequirePermissions("simulation:control")
  @Throttle({ default: { limit: ASSIST_RATE_LIMIT, ttl: ASSIST_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "Ask the AI assistant about my active simulation session",
    description:
      "Guides the student on the current state of one of their ACTIVE sessions (what is going well, what to review and why), optionally answering a question. EXAM sessions are allowed only when the rubric assistance policy is ALLOWED_WITH_PENALTY; every completed answer is recorded as an AI_HELP event, which the score penalizes in that case. When no AI provider answers, the rule-based advisor answers instead. Responds text/event-stream: `event: delta` with `{text}` per fragment, then `event: done` with `{aiHelpEventId, aiCallId, source}` (`source` is LLM or DETERMINISTIC; rate the answer with ai-ratings targetType SIM_ASSIST and targetId = aiHelpEventId), or `event: error` with `{code, message}` if the answer fails after it started. Errors before the stream starts (validation, 403, 404, 409, 429 with Retry-After) use the regular JSON error envelope. Closing the connection cancels the AI call and no AI_HELP event is recorded.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the answer" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission, session of another user or assistance disabled in this exam" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Simulation session not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The simulation session is not active" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  public async assist(
    @Param("id") id: string,
    @Body() dto: SimulationAssistDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const result: SimulationAssistStreamResult = await this._assistSimulationUseCase.execute(
      new AssistSimulationCommand({
        sessionId: id,
        userId: currentUser.sub,
        userRole: currentUser.role,
        question: dto.question,
        language: Language.createOrDefault(dto.language ?? i18n.lang).value,
        signal: controller.signal,
      }),
    );

    await pipeAssistStreamToSse(res, result.events, (error: unknown): Promise<SseErrorPayload> => {
      const code: string = error instanceof DomainError ? error.code : ASSIST_FAILED_CODE;

      this._logger.warn(`Simulation assist ${result.sessionId} failed after it started: ${error instanceof Error ? error.name : "UnknownError"}`);

      return Promise.resolve({ code, message: String(i18n.t(code)) });
    });
  }
}
