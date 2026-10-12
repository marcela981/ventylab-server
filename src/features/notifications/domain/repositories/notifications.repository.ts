/*
 * Funcionalidad: Repositorio de notificaciones (contrato)
 * Descripción: Puerto de persistencia de notificaciones: inserción en lote, consultas y cambios siempre acotados al usuario dueño
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";

export const NOTIFICATIONS_REPOSITORY_TOKEN: unique symbol = Symbol("NOTIFICATIONS_REPOSITORY_TOKEN");

export interface NotificationsPageQuery {
  readonly userId: string;
  readonly unreadOnly: boolean;
  readonly page: number;
  readonly limit: number;
}

export interface INotificationsRepository {
  createMany(notifications: Notification[]): Promise<void>;
  getPageForUser(query: NotificationsPageQuery): Promise<Paginated<Notification>>;
  getByIdForUser(id: string, userId: string): Promise<Notification | undefined>;
  countUnread(userId: string): Promise<number>;
  markRead(notification: Notification): Promise<void>;
  markAllRead(userId: string, readAt: Date): Promise<number>;
  deleteForUser(id: string, userId: string): Promise<boolean>;
}
