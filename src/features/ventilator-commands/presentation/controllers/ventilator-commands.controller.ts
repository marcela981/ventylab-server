/*
 * Funcionalidad: Controlador de los comandos del ventilador
 * Descripción: Endpoints /api/ventilator del control exclusivo (consultar, tomar, arrebatar, liberar, latido) y de los comandos al ventilador físico (enviar con 202 y el identificador de correlación, historial paginado por reserva); la autorización real la deciden la reserva activa y el operador
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

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import {
  GetVentilatorCommandsCommand,
  SendVentilatorCommandCommand,
  VentilatorControlCommand,
} from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { type SentVentilatorCommandResult, type VentilatorControlStateResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { GetVentilatorCommandsUseCase } from "@/features/ventilator-commands/application/use-cases/get-ventilator-commands.usecase";
import { SendVentilatorCommandUseCase } from "@/features/ventilator-commands/application/use-cases/send-ventilator-command.usecase";
import {
  GetVentilatorControlUseCase,
  ReleaseVentilatorControlUseCase,
  TakeVentilatorControlUseCase,
  VentilatorControlHeartbeatUseCase,
} from "@/features/ventilator-commands/application/use-cases/ventilator-control.usecases";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { GetVentilatorCommandsQueryDTO, SendVentilatorCommandRequestDTO } from "@/features/ventilator-commands/presentation/dtos/ventilator-command-request.dto";
import { SentVentilatorCommandDTO, VentilatorCommandDTO, VentilatorControlStateDTO } from "@/features/ventilator-commands/presentation/dtos/ventilator-command.dto";
import { VentilatorCommandsMapper } from "@/features/ventilator-commands/presentation/mappers/ventilator-commands.mapper";

@ApiTags("Ventilator commands")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("ventilator:control")
@Controller("api/ventilator")
export class VentilatorCommandsController {
  public constructor(
    private readonly _getVentilatorControlUseCase: GetVentilatorControlUseCase,
    private readonly _takeVentilatorControlUseCase: TakeVentilatorControlUseCase,
    private readonly _releaseVentilatorControlUseCase: ReleaseVentilatorControlUseCase,
    private readonly _ventilatorControlHeartbeatUseCase: VentilatorControlHeartbeatUseCase,
    private readonly _sendVentilatorCommandUseCase: SendVentilatorCommandUseCase,
    private readonly _getVentilatorCommandsUseCase: GetVentilatorCommandsUseCase,
  ) {}

  @Get("control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ventilator control state", description: "Active reservation, current operator and whether the caller can take or take over the exclusive control" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Control state retrieved successfully", type: VentilatorControlStateDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getVentilatorControl(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<VentilatorControlStateDTO>> {
    const result: VentilatorControlStateResult = await this._getVentilatorControlUseCase.execute(new VentilatorControlCommand({ userId: currentUser.sub, role: currentUser.role }));

    return new APIResponseBuilder<VentilatorControlStateDTO>()
      .setData(VentilatorCommandsMapper.toControlStateDTO(result))
      .setMessage(await i18n.t("ventilator-commands.control_retrieved"))
      .build();
  }

  @Post("control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Take the ventilator control", description: "A holder of the active reservation, a teacher or an administrator takes the free exclusive control; emits ventilator:control-changed" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Control taken" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "No active reservation or not a reservation holder" })
  @ApiResponseDoc({ status: HttpStatus.LOCKED, description: "Another operator controls the ventilator" })
  public async takeVentilatorControl(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._takeVentilatorControlUseCase.execute(new VentilatorControlCommand({ userId: currentUser.sub, role: currentUser.role }), "take");

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-commands.control_taken"))
      .build();
  }

  @Post("control/takeover")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Take over the ventilator control", description: "The leader of the holder group, a teacher or an administrator takes the control from the current operator; audited and emits ventilator:control-changed" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Control taken over" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "No active reservation or not a reservation holder" })
  @ApiResponseDoc({ status: HttpStatus.LOCKED, description: "The caller may not take over the control" })
  public async takeOverVentilatorControl(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._takeVentilatorControlUseCase.execute(new VentilatorControlCommand({ userId: currentUser.sub, role: currentUser.role }), "takeover");

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-commands.control_taken"))
      .build();
  }

  @Delete("control")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Release the ventilator control", description: "The operator, a teacher or an administrator releases the exclusive control; no command is sent to the device" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Control released" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.LOCKED, description: "Another operator controls the ventilator" })
  public async releaseVentilatorControl(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    this._releaseVentilatorControlUseCase.execute(new VentilatorControlCommand({ userId: currentUser.sub, role: currentUser.role }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-commands.control_released"))
      .build();
  }

  @Post("control/heartbeat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ventilator operator heartbeat", description: "Refreshes the operator presence and cancels a pending presence timeout; the socket connection and the ventilator:heartbeat socket message do the same" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Presence refreshed" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.LOCKED, description: "The caller is not the operator" })
  public async sendVentilatorControlHeartbeat(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    this._ventilatorControlHeartbeatUseCase.execute(new VentilatorControlCommand({ userId: currentUser.sub, role: currentUser.role }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-commands.heartbeat_received"))
      .build();
  }

  @Post("commands")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Send a command to the physical ventilator",
    description:
      "Validates and publishes the command with QoS 1. Returns the correlation identifier so the client can follow ventilator:command-status (SENT, then ACKED, APPLIED, REJECTED or TIMEOUT)",
  })
  @ApiResponseDoc({ status: HttpStatus.ACCEPTED, description: "Command published", type: SentVentilatorCommandDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "No active reservation or not a reservation holder" })
  @ApiResponseDoc({ status: HttpStatus.LOCKED, description: "The caller is not the operator" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Command out of range, incoherent or beyond the safety limits; details.violations lists each problem" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many commands; Retry-After tells when to retry" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "Ventilator offline" })
  public async sendVentilatorCommand(
    @Body() dto: SendVentilatorCommandRequestDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SentVentilatorCommandDTO>> {
    const result: SentVentilatorCommandResult = await this._sendVentilatorCommandUseCase.execute(
      new SendVentilatorCommandCommand({ userId: currentUser.sub, role: currentUser.role, params: VentilatorCommandsMapper.toParams(dto) }),
    );

    return new APIResponseBuilder<SentVentilatorCommandDTO>()
      .setData(VentilatorCommandsMapper.toSentDTO(result))
      .setMessage(await i18n.t("ventilator-commands.command_sent"))
      .build();
  }

  @Get("commands")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ventilator command history", description: "Paginated commands sent during a reservation; allowed to its holders, teachers and administrators" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Commands retrieved successfully", type: VentilatorCommandDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not a reservation holder" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Reservation not found" })
  public async getVentilatorCommands(
    @Query() query: GetVentilatorCommandsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<VentilatorCommandDTO[]>> {
    const commands: Paginated<VentilatorCommand> = await this._getVentilatorCommandsUseCase.execute(
      new GetVentilatorCommandsCommand({
        userId: currentUser.sub,
        role: currentUser.role,
        reservationId: query.reservationId,
        page: query.page,
        limit: query.limit,
        sortOrder: query.sortOrder,
      }),
    );

    return new APIResponseBuilder<VentilatorCommandDTO[]>()
      .setData(commands.data.map((command: VentilatorCommand): VentilatorCommandDTO => VentilatorCommandsMapper.toCommandDTO(command)))
      .setPagination(commands.pagination)
      .setMessage(await i18n.t("ventilator-commands.commands_retrieved"))
      .build();
  }
}
