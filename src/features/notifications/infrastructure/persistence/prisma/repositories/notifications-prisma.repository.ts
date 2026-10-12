/*
 * Funcionalidad: Repositorio Prisma de notificaciones
 * Descripción: Implementa INotificationsRepository sobre PrismaService: createMany en una sola consulta, páginas por usuario (más recientes primero) y cambios con where acotado al dueño
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Notification as NotificationModel, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { type INotificationsRepository, type NotificationsPageQuery } from "@/features/notifications/domain/repositories/notifications.repository";
import { NotificationsMapper } from "@/features/notifications/infrastructure/persistence/prisma/mappers/notifications.mapper";

@Injectable()
export class NotificationsPrismaRepository implements INotificationsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async createMany(notifications: Notification[]): Promise<void> {
    await this._prisma.notification.createMany({ data: notifications.map((notification: Notification) => NotificationsMapper.toCreateInput(notification)) });
  }

  public async getPageForUser(query: NotificationsPageQuery): Promise<Paginated<Notification>> {
    const where: Prisma.NotificationWhereInput = query.unreadOnly ? { userId: query.userId, readAt: null } : { userId: query.userId };

    const [rows, total] = await Promise.all([
      this._prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this._prisma.notification.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: NotificationModel) => NotificationsMapper.toDomain(row)),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  public async getByIdForUser(id: string, userId: string): Promise<Notification | undefined> {
    const row: NotificationModel | null = await this._prisma.notification.findFirst({ where: { id, userId } });

    return row ? NotificationsMapper.toDomain(row) : undefined;
  }

  public async countUnread(userId: string): Promise<number> {
    return await this._prisma.notification.count({ where: { userId, readAt: null } });
  }

  public async markRead(notification: Notification): Promise<void> {
    await this._prisma.notification.updateMany({
      where: { id: notification.id, userId: notification.userId, readAt: null },
      data: { readAt: notification.readAt },
    });
  }

  public async markAllRead(userId: string, readAt: Date): Promise<number> {
    const result: Prisma.BatchPayload = await this._prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt } });

    return result.count;
  }

  public async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result: Prisma.BatchPayload = await this._prisma.notification.deleteMany({ where: { id, userId } });

    return result.count > 0;
  }
}
