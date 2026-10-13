/*
 * Funcionalidad: Prueba de integración de notificaciones
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de notificaciones a través de DeliverNotificationsUseCase (una fila por destinatario en una sola inserción), ListMyNotificationsUseCase y CountUnreadNotificationsUseCase (solo las propias) y MarkNotificationReadUseCase (el dueño la marca; otro usuario recibe NotificationNotFoundError y la fila no cambia)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";

import { type Paginated } from "@/common/domain/utils/paginated";
import { CountUnreadNotificationsUseCase } from "@/features/notifications/application/use-cases/count-unread-notifications.usecase";
import { DeliverNotificationsUseCase } from "@/features/notifications/application/use-cases/deliver-notifications.usecase";
import { ListMyNotificationsUseCase } from "@/features/notifications/application/use-cases/list-my-notifications.usecase";
import { MarkNotificationReadUseCase } from "@/features/notifications/application/use-cases/mark-notification-read.usecase";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { NotificationNotFoundError } from "@/features/notifications/domain/notifications.errors";

import { createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

describe("notifications against PostgreSQL", () => {
  let harness: IntegrationApp;
  let first: User;
  let second: User;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    first = await createStudent(harness.prisma);
    second = await createStudent(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  function deliver(): Promise<Notification[]> {
    return harness.app.get(DeliverNotificationsUseCase).execute([first.id, second.id], { type: "GRADE_PUBLISHED", title: "Nota publicada", body: "Tu nota ya está disponible" });
  }

  it("should persist one row per recipient and list only the caller's rows", async () => {
    const delivered: Notification[] = await deliver();

    const page: Paginated<Notification> = await harness.app.get(ListMyNotificationsUseCase).execute({ userId: first.id, unreadOnly: false, page: 1, limit: 20 });

    expect(delivered).toHaveLength(2);
    expect(await harness.prisma.notification.count()).toBe(2);
    expect(page.data.map((notification: Notification): string => notification.userId)).toEqual([first.id]);
    expect(await harness.app.get(CountUnreadNotificationsUseCase).execute(first.id)).toBe(1);
  });

  it("should let the owner mark a notification as read", async () => {
    const delivered: Notification[] = await deliver();
    const own: Notification | undefined = delivered.find((notification: Notification): boolean => notification.userId === first.id);

    const read: Notification = await harness.app.get(MarkNotificationReadUseCase).execute(own?.id ?? "", first.id);

    expect(read.isRead).toBe(true);
    expect(await harness.app.get(CountUnreadNotificationsUseCase).execute(first.id)).toBe(0);
  });

  it("should answer not found when another user marks a notification and leave it unread", async () => {
    const delivered: Notification[] = await deliver();
    const foreign: Notification | undefined = delivered.find((notification: Notification): boolean => notification.userId === second.id);

    const attempt: Promise<Notification> = harness.app.get(MarkNotificationReadUseCase).execute(foreign?.id ?? "", first.id);

    await expect(attempt).rejects.toBeInstanceOf(NotificationNotFoundError);
    expect(await harness.prisma.notification.findUnique({ where: { id: foreign?.id ?? "" }, select: { readAt: true } })).toEqual({ readAt: null });
  });
});
