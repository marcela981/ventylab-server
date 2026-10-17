/*
 * Funcionalidad: Controlador de notificaciones
 * Descripción: Rutas /api/notifications del usuario autenticado sobre sus propias notificaciones: listado paginado, conteo de no leídas, marcar una o todas como leídas y eliminar; la notificación de otro usuario responde 404
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { CountUnreadNotificationsUseCase } from "@/features/notifications/application/use-cases/count-unread-notifications.usecase";
import { DeleteNotificationUseCase } from "@/features/notifications/application/use-cases/delete-notification.usecase";
import { ListMyNotificationsUseCase } from "@/features/notifications/application/use-cases/list-my-notifications.usecase";
import { MarkAllNotificationsReadUseCase } from "@/features/notifications/application/use-cases/mark-all-notifications-read.usecase";
import { MarkNotificationReadUseCase } from "@/features/notifications/application/use-cases/mark-notification-read.usecase";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { ListNotificationsQueryDTO } from "@/features/notifications/presentation/dtos/notification-request.dto";
import {
  NOTIFICATION_DATA_DTOS,
  NOTIFICATION_UNION_SCHEMA,
  NOTIFICATION_VARIANT_DTOS,
  NotificationDTO,
  ReadAllNotificationsResultDTO,
  UnreadNotificationsCountDTO,
} from "@/features/notifications/presentation/dtos/notification.dto";
import { NotificationsPresentationMapper } from "@/features/notifications/presentation/mappers/notifications.mapper";

@ApiTags("Notifications")
@ApiBearerAuth("JWT-auth")
@ApiExtraModels(NotificationDTO, ...NOTIFICATION_DATA_DTOS, ...Object.values(NOTIFICATION_VARIANT_DTOS))
@Controller("api/notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  public constructor(
    private readonly _listMyNotificationsUseCase: ListMyNotificationsUseCase,
    private readonly _countUnreadNotificationsUseCase: CountUnreadNotificationsUseCase,
    private readonly _markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly _markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly _deleteNotificationUseCase: DeleteNotificationUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List my notifications", description: "Paginated notifications of the authenticated user, newest first, optionally only unread ones" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notifications retrieved successfully; each item is discriminated by type", schema: { type: "array", items: NOTIFICATION_UNION_SCHEMA } })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async listNotifications(
    @Query() query: ListNotificationsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NotificationDTO[]>> {
    const notifications: Paginated<Notification> = await this._listMyNotificationsUseCase.execute({
      userId: currentUser.sub,
      unreadOnly: query.unreadOnly,
      page: query.page,
      limit: query.limit,
    });

    return new APIResponseBuilder<NotificationDTO[]>()
      .setData(NotificationsPresentationMapper.toDTOList(notifications.data))
      .setMessage(await i18n.t("notifications.retrieved"))
      .setPagination(notifications.pagination)
      .build();
  }

  @Get("unread-count")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Count my unread notifications" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Unread count retrieved successfully", type: UnreadNotificationsCountDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async countUnread(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<UnreadNotificationsCountDTO>> {
    const count: number = await this._countUnreadNotificationsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<UnreadNotificationsCountDTO>()
      .setData({ count })
      .setMessage(await i18n.t("notifications.unread_count_retrieved"))
      .build();
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all my notifications as read" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notifications marked as read", type: ReadAllNotificationsResultDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async markAllRead(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ReadAllNotificationsResultDTO>> {
    const updated: number = await this._markAllNotificationsReadUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<ReadAllNotificationsResultDTO>()
      .setData({ updated })
      .setMessage(await i18n.t("notifications.all_marked_read"))
      .build();
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark one of my notifications as read", description: "Idempotent; a notification of another user responds as not found" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notification marked as read; discriminated by type", schema: NOTIFICATION_UNION_SCHEMA })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Notification not found" })
  public async markRead(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<NotificationDTO>> {
    const notification: Notification = await this._markNotificationReadUseCase.execute(id, currentUser.sub);

    return new APIResponseBuilder<NotificationDTO>()
      .setData(NotificationsPresentationMapper.toDTO(notification))
      .setMessage(await i18n.t("notifications.marked_read"))
      .build();
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete one of my notifications", description: "A notification of another user responds as not found" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notification deleted" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Notification not found" })
  public async deleteNotification(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteNotificationUseCase.execute(id, currentUser.sub);

    return new APIResponseBuilder<null>().setData(null).setMessage(await i18n.t("notifications.deleted")).build();
  }
}
