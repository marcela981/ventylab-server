/*
 * Funcionalidad: Módulo de notificaciones
 * Descripción: Registra la feature de notificaciones persistidas (suscriptores de eventos de catálogo, resolución de destinatarios vía GroupsFacade y ReservationsFacade, repositorio Prisma, rutas /api/notifications del dueño) y exporta NotificationsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { GroupsModule } from "@/features/groups/groups.module";
import { NotificationRecipientsService } from "@/features/notifications/application/services/notification-recipients.service";
import { NotificationsFacade } from "@/features/notifications/application/services/notifications.facade";
import { CountUnreadNotificationsUseCase } from "@/features/notifications/application/use-cases/count-unread-notifications.usecase";
import { DeleteNotificationUseCase } from "@/features/notifications/application/use-cases/delete-notification.usecase";
import { DeliverNotificationsUseCase } from "@/features/notifications/application/use-cases/deliver-notifications.usecase";
import { ListMyNotificationsUseCase } from "@/features/notifications/application/use-cases/list-my-notifications.usecase";
import { MarkAllNotificationsReadUseCase } from "@/features/notifications/application/use-cases/mark-all-notifications-read.usecase";
import { MarkNotificationReadUseCase } from "@/features/notifications/application/use-cases/mark-notification-read.usecase";
import { NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";
import { NotificationsEventsHandlers } from "@/features/notifications/infrastructure/events/notifications-events.handlers";
import { NotificationsPrismaRepository } from "@/features/notifications/infrastructure/persistence/prisma/repositories/notifications-prisma.repository";
import { NotificationsController } from "@/features/notifications/presentation/controllers/notifications.controller";
import { ReservationsModule } from "@/features/reservations/reservations.module";

@Module({
  imports: [AuthModule, GroupsModule, ReservationsModule],
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATIONS_REPOSITORY_TOKEN, useClass: NotificationsPrismaRepository },
    NotificationRecipientsService,
    DeliverNotificationsUseCase,
    ListMyNotificationsUseCase,
    CountUnreadNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
    NotificationsEventsHandlers,
    NotificationsFacade,
  ],
  exports: [NotificationsFacade],
})
export class NotificationsModule {}
