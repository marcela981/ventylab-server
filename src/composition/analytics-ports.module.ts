/*
 * Funcionalidad: Módulo AnalyticsPortsModule
 * Descripción: Parte global de la raíz de composición que enlaza el puerto UNREAD_NOTIFICATIONS_COUNTER_TOKEN de la analítica a NotificationsFacade.countUnread, de modo que ninguna feature importa la feature de notificaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module, type Provider } from "@nestjs/common";

import {
  type IUnreadNotificationsCounter,
  UNREAD_NOTIFICATIONS_COUNTER_TOKEN,
} from "@/features/analytics/application/ports/unread-notifications-counter.interface";
import { NotificationsFacade } from "@/features/notifications/application/services/notifications.facade";
import { NotificationsModule } from "@/features/notifications/notifications.module";

export const UNREAD_NOTIFICATIONS_COUNTER_PROVIDER: Provider = {
  provide: UNREAD_NOTIFICATIONS_COUNTER_TOKEN,
  inject: [NotificationsFacade],
  useFactory: (notifications: NotificationsFacade): IUnreadNotificationsCounter => ({
    countUnread: (userId: string): Promise<number> => notifications.countUnread(userId),
  }),
};

@Global()
@Module({
  imports: [NotificationsModule],
  providers: [UNREAD_NOTIFICATIONS_COUNTER_PROVIDER],
  exports: [UNREAD_NOTIFICATIONS_COUNTER_TOKEN],
})
export class AnalyticsPortsModule {}
