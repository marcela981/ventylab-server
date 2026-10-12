/*
 * Funcionalidad: Puerto UNREAD_NOTIFICATIONS_COUNTER_TOKEN
 * Descripción: Define la interfaz IUnreadNotificationsCounter con la que la analítica lee el número de notificaciones sin leer de un usuario sin importar la feature de notificaciones; la raíz de composición la enlaza a NotificationsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const UNREAD_NOTIFICATIONS_COUNTER_TOKEN: unique symbol = Symbol("UNREAD_NOTIFICATIONS_COUNTER_TOKEN");

export interface IUnreadNotificationsCounter {
  countUnread(userId: string): Promise<number>;
}
