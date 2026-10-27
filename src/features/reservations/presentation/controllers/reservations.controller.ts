/*
 * Funcionalidad: Controlador de reservas
 * Descripción: Endpoints /api/reservations: calendario por rango (opcionalmente de un grupo titular), mis reservas, reserva actual con permiso de control, creación programada o inmediata con desplazamiento confirmado (devuelve la reserva creada), cancelación y desplazamiento explícito; las respuestas se proyectan por rol en el servidor; el calendario se documenta como lista de reservas completas o resumidas (las ajenas que ve un estudiante)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CancelReservationCommand } from "@/features/reservations/application/commands/cancel-reservation.command";
import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import { type CurrentReservationResult } from "@/features/reservations/application/results/current-reservation.result";
import { type ReservationViewsResult } from "@/features/reservations/application/results/reservation-views.result";
import { CancelReservationUseCase } from "@/features/reservations/application/use-cases/cancel-reservation.usecase";
import { type CreatedReservationResult, CreateReservationUseCase } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { GetCurrentReservationUseCase } from "@/features/reservations/application/use-cases/get-current-reservation.usecase";
import { GetMyReservationsUseCase } from "@/features/reservations/application/use-cases/get-my-reservations.usecase";
import { GetReservationsCalendarUseCase } from "@/features/reservations/application/use-cases/get-reservations-calendar.usecase";
import { PreemptReservationUseCase } from "@/features/reservations/application/use-cases/preempt-reservation.usecase";
import { CreateReservationDTO, GetReservationsCalendarQueryDTO, PreemptReservationDTO } from "@/features/reservations/presentation/dtos/reservation-request.dto";
import {
  CurrentReservationDTO,
  type ReservationDTO,
  ReservationDetailDTO,
  ReservationSummaryDTO,
} from "@/features/reservations/presentation/dtos/reservation.dto";
import { type ReservationLabelTranslator, ReservationsPresentationMapper } from "@/features/reservations/presentation/mappers/reservations.mapper";

@ApiTags("Reservations")
@ApiBearerAuth("JWT-auth")
@ApiExtraModels(ReservationDetailDTO, ReservationSummaryDTO)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/reservations")
export class ReservationsController {
  public constructor(
    private readonly _getReservationsCalendarUseCase: GetReservationsCalendarUseCase,
    private readonly _getMyReservationsUseCase: GetMyReservationsUseCase,
    private readonly _getCurrentReservationUseCase: GetCurrentReservationUseCase,
    private readonly _createReservationUseCase: CreateReservationUseCase,
    private readonly _cancelReservationUseCase: CancelReservationUseCase,
    private readonly _preemptReservationUseCase: PreemptReservationUseCase,
  ) {}

  @Get()
  @RequirePermissions("reservations:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reservations calendar",
    description:
      "Reservations overlapping [from, to) (at most 31 days), optionally only those held by groupId (admins: any group; teachers: groups they manage or supervise; students: their own group; otherwise 403). Students get other people's reservations as { id, startsAt, endsAt, status, label } only",
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: "Reservations retrieved successfully (full detail, or the summary for other people's reservations served to a student)",
    schema: { type: "array", items: { anyOf: [{ $ref: getSchemaPath(ReservationDetailDTO) }, { $ref: getSchemaPath(ReservationSummaryDTO) }] } },
  })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Invalid range" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or group outside the requester scope" })
  public async getReservationsCalendar(
    @Query() query: GetReservationsCalendarQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ReservationDTO[]>> {
    const result: ReservationViewsResult = await this._getReservationsCalendarUseCase.execute({
      from: new Date(query.from),
      to: new Date(query.to),
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      groupId: query.groupId,
    });

    return new APIResponseBuilder<ReservationDTO[]>()
      .setData(ReservationsPresentationMapper.toDTOList(result.views, result.viewer, ReservationsController._translator(i18n)))
      .setMessage(await i18n.t("reservations.reservations_retrieved"))
      .build();
  }

  @Get("mine")
  @RequirePermissions("reservations:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "My reservations", description: "Current and upcoming reservations the caller holds, created, or that belong to the caller's student group" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Reservations retrieved successfully", type: ReservationDetailDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyReservations(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ReservationDTO[]>> {
    const result: ReservationViewsResult = await this._getMyReservationsUseCase.execute(currentUser.sub, currentUser.role);

    return new APIResponseBuilder<ReservationDTO[]>()
      .setData(ReservationsPresentationMapper.toDTOList(result.views, result.viewer, ReservationsController._translator(i18n)))
      .setMessage(await i18n.t("reservations.reservations_retrieved"))
      .build();
  }

  @Get("current")
  @RequirePermissions("reservations:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Current reservation", description: "Reservation active right now in the caller's projection and whether the caller may control the ventilator" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Current reservation retrieved successfully", type: CurrentReservationDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getCurrentReservation(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<CurrentReservationDTO>> {
    const result: CurrentReservationResult = await this._getCurrentReservationUseCase.execute(currentUser.sub, currentUser.role);

    return new APIResponseBuilder<CurrentReservationDTO>()
      .setData(ReservationsPresentationMapper.toCurrentDTO(result.view, result.canControl, result.viewer, ReservationsController._translator(i18n)))
      .setMessage(await i18n.t("reservations.current_reservation_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("reservations:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create reservation",
    description:
      "Schedules a slot for the caller, a user (admins) or a group (its student leader, a supervising teacher or an admin). Without startsAt it is an immediate reservation: it starts now (truncated to the minute) and lasts durationMinutes, with no slot alignment or advance checks. An overlap returns 409; for teachers and admins the error data lists the conflicting reservations and whether confirmPreempt would preempt them (also the reservation active right now)",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Reservation created", type: ReservationDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, misaligned, too long, in the past or too far ahead" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot reserve for this user or group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User or group not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Overlapping reservation or upcoming reservations limit reached" })
  public async createReservation(
    @Body() dto: CreateReservationDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ReservationDetailDTO>> {
    const result: CreatedReservationResult = await this._createReservationUseCase.executeWithView(
      new CreateReservationCommand({
        actorId: currentUser.sub,
        actorRole: currentUser.role,
        holderType: dto.holderType,
        userId: dto.holderType === "USER" ? dto.userId ?? currentUser.sub : undefined,
        groupId: dto.groupId,
        startsAt: dto.startsAt === undefined ? undefined : new Date(dto.startsAt),
        endsAt: dto.endsAt === undefined ? undefined : new Date(dto.endsAt),
        durationMinutes: dto.durationMinutes,
        purpose: dto.purpose,
        confirmPreempt: dto.confirmPreempt === true,
      }),
    );

    return new APIResponseBuilder<ReservationDetailDTO>()
      .setData(ReservationsPresentationMapper.toCreatedDTO(result.view))
      .setMessage(await i18n.t("reservations.reservation_created"))
      .build();
  }

  @Post(":id/cancel")
  @RequirePermissions("reservations:create")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel reservation", description: "Cancels a scheduled reservation: its creator or holder, the holder group's leader, a supervising teacher or an admin" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Reservation cancelled" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Cannot cancel this reservation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Reservation not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Reservation no longer scheduled" })
  public async cancelReservation(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._cancelReservationUseCase.execute(new CancelReservationCommand({ reservationId: id, actorId: currentUser.sub, actorRole: currentUser.role }));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("reservations.reservation_cancelled")).build();
  }

  @Post(":id/preempt")
  @RequirePermissions("reservations:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Preempt reservation",
    description: "Teachers preempt student reservations and admins any reservation: the overlapping reservations become PREEMPTED and the new one is created in one transaction",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Reservation preempted and replacement created" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Reservation, user or group not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "A reservation cannot be preempted by the caller or is no longer scheduled" })
  public async preemptReservation(
    @Param("id") id: string,
    @Body() dto: PreemptReservationDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._preemptReservationUseCase.execute({
      reservationId: id,
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      reason: dto.reason,
      holderType: dto.holderType,
      userId: dto.holderType === "USER" ? dto.userId ?? currentUser.sub : undefined,
      groupId: dto.groupId,
      startsAt: dto.startsAt === undefined ? undefined : new Date(dto.startsAt),
      endsAt: dto.endsAt === undefined ? undefined : new Date(dto.endsAt),
      purpose: dto.purpose,
    });

    return new APIResponseBuilder<null>().setMessage(await i18n.t("reservations.reservation_preempted")).build();
  }

  private static _translator(i18n: I18nContext): ReservationLabelTranslator {
    return (key: string, args: Record<string, string>): string => String(i18n.t(key, { args }));
  }
}
