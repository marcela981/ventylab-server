/*
 * Funcionalidad: Pruebas de AnalyticsPortsModule
 * Descripción: Verifica que el puerto UNREAD_NOTIFICATIONS_COUNTER_TOKEN de la analítica delega en NotificationsFacade.countUnread
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";

import { UNREAD_NOTIFICATIONS_COUNTER_PROVIDER } from "@/composition/analytics-ports.module";
import { type IUnreadNotificationsCounter, UNREAD_NOTIFICATIONS_COUNTER_TOKEN } from "@/features/analytics/application/ports/unread-notifications-counter.interface";
import { NotificationsFacade } from "@/features/notifications/application/services/notifications.facade";

describe("AnalyticsPortsModule", () => {
  it("binds the unread notifications counter to NotificationsFacade", async () => {
    const provider: FactoryProvider<IUnreadNotificationsCounter> = UNREAD_NOTIFICATIONS_COUNTER_PROVIDER as FactoryProvider<IUnreadNotificationsCounter>;
    const facade: { countUnread: jest.Mock } = { countUnread: jest.fn().mockResolvedValue(7) };

    const counter: IUnreadNotificationsCounter = provider.useFactory(facade) as IUnreadNotificationsCounter;

    expect(provider.provide).toBe(UNREAD_NOTIFICATIONS_COUNTER_TOKEN);
    expect(provider.inject).toEqual([NotificationsFacade]);
    expect(await counter.countUnread("student-1")).toBe(7);
    expect(facade.countUnread).toHaveBeenCalledWith("student-1");
  });
});
