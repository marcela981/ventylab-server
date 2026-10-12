/*
 * Funcionalidad: Pruebas del controlador de notificaciones
 * Descripción: Verifica que las rutas del dueño solo exigen JWT y que cada operación (listar, contar no leídas, marcar una o todas como leídas, eliminar) se limita a las notificaciones del usuario autenticado, respondiendo no encontrada para las ajenas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { type I18nContext } from "nestjs-i18n";

import { type APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { InMemoryNotificationsRepository } from "@/features/notifications/application/testing/notifications-test-doubles-spec";
import { CountUnreadNotificationsUseCase } from "@/features/notifications/application/use-cases/count-unread-notifications.usecase";
import { DeleteNotificationUseCase } from "@/features/notifications/application/use-cases/delete-notification.usecase";
import { ListMyNotificationsUseCase } from "@/features/notifications/application/use-cases/list-my-notifications.usecase";
import { MarkAllNotificationsReadUseCase } from "@/features/notifications/application/use-cases/mark-all-notifications-read.usecase";
import { MarkNotificationReadUseCase } from "@/features/notifications/application/use-cases/mark-notification-read.usecase";
import { Notification } from "@/features/notifications/domain/entities/notification.entity";
import { NotificationNotFoundError } from "@/features/notifications/domain/notifications.errors";
import { NotificationsController } from "@/features/notifications/presentation/controllers/notifications.controller";
import { ListNotificationsQueryDTO } from "@/features/notifications/presentation/dtos/notification-request.dto";
import { type NotificationDTO, type ReadAllNotificationsResultDTO, type UnreadNotificationsCountDTO } from "@/features/notifications/presentation/dtos/notification.dto";

const I18N: I18nContext = { t: jest.fn((key: string): Promise<string> => Promise.resolve(key)) } as unknown as I18nContext;

function user(sub: string): JwtPayload {
  return { sub, email: `${sub}@example.com`, role: "STUDENT", permissions: [] };
}

function notificationOf(userId: string, minute: number): Notification {
  return Notification.create(userId, { type: "GRADE_PUBLISHED", title: "Calificación publicada", body: "Cuerpo" }, new Date(Date.UTC(2026, 9, 11, 12, minute)));
}

function query(overrides: Partial<ListNotificationsQueryDTO> = {}): ListNotificationsQueryDTO {
  return Object.assign(new ListNotificationsQueryDTO(), overrides);
}

function setup(): { controller: NotificationsController; repository: InMemoryNotificationsRepository; own: Notification[]; foreign: Notification } {
  const repository: InMemoryNotificationsRepository = new InMemoryNotificationsRepository();
  const own: Notification[] = [notificationOf("owner-1", 1), notificationOf("owner-1", 2), notificationOf("owner-1", 3)];
  const foreign: Notification = notificationOf("other-1", 4);

  repository.rows.push(...own, foreign);

  const controller: NotificationsController = new NotificationsController(
    new ListMyNotificationsUseCase(repository),
    new CountUnreadNotificationsUseCase(repository),
    new MarkNotificationReadUseCase(repository),
    new MarkAllNotificationsReadUseCase(repository),
    new DeleteNotificationUseCase(repository),
  );

  return { controller, repository, own, foreign };
}

describe("NotificationsController", () => {
  it("guards every route with JWT only", () => {
    const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, NotificationsController);

    expect(guards).toEqual([JwtAuthGuard]);
  });

  it("lists only the caller's notifications, newest first, and filters unread ones", async () => {
    const { controller, own } = setup();

    own[2].markRead(new Date());

    const all: APIResponse<NotificationDTO[]> = await controller.listNotifications(query(), user("owner-1"), I18N);
    const unread: APIResponse<NotificationDTO[]> = await controller.listNotifications(query({ unreadOnly: true }), user("owner-1"), I18N);

    expect(all.data?.map((item: NotificationDTO) => item.id)).toEqual([own[2].id, own[1].id, own[0].id]);
    expect(unread.data?.map((item: NotificationDTO) => item.id)).toEqual([own[1].id, own[0].id]);
  });

  it("responds not found when marking or deleting another user's notification and leaves it untouched", async () => {
    const { controller, repository, foreign } = setup();

    await expect(controller.markRead(foreign.id, user("owner-1"), I18N)).rejects.toBeInstanceOf(NotificationNotFoundError);
    await expect(controller.deleteNotification(foreign.id, user("owner-1"), I18N)).rejects.toBeInstanceOf(NotificationNotFoundError);

    expect(foreign.isRead).toBe(false);
    expect(repository.rows).toContain(foreign);
  });

  it("marks one own notification as read idempotently", async () => {
    const { controller, repository, own } = setup();

    const first: APIResponse<NotificationDTO> = await controller.markRead(own[0].id, user("owner-1"), I18N);
    const second: APIResponse<NotificationDTO> = await controller.markRead(own[0].id, user("owner-1"), I18N);

    expect(first.data?.readAt).toBeInstanceOf(Date);
    expect(second.data?.readAt).toEqual(first.data?.readAt);
    expect(repository.calls.filter((call: string) => call === "markRead")).toHaveLength(1);
  });

  it("marks all own notifications as read and the unread count drops to zero without touching other users", async () => {
    const { controller, repository, foreign } = setup();

    const before: APIResponse<UnreadNotificationsCountDTO> = await controller.countUnread(user("owner-1"), I18N);
    const result: APIResponse<ReadAllNotificationsResultDTO> = await controller.markAllRead(user("owner-1"), I18N);
    const after: APIResponse<UnreadNotificationsCountDTO> = await controller.countUnread(user("owner-1"), I18N);

    expect(before.data).toEqual({ count: 3 });
    expect(result.data).toEqual({ updated: 3 });
    expect(after.data).toEqual({ count: 0 });
    expect(foreign.isRead).toBe(false);
    expect(await repository.countUnread("other-1")).toBe(1);
  });

  it("deletes an own notification", async () => {
    const { controller, repository, own } = setup();

    await controller.deleteNotification(own[0].id, user("owner-1"), I18N);

    expect(repository.rows.map((row: Notification) => row.id)).not.toContain(own[0].id);
  });
});
