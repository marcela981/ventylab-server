/*
 * Funcionalidad: Dobles de prueba de notificaciones
 * Descripción: Repositorio de notificaciones en memoria que registra cada inserción en lote, publicador en tiempo real simulado y fábricas de las fachadas de grupos y reservas para las pruebas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { type GroupMemberSummary, type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { type INotificationsRepository, type NotificationsPageQuery } from "@/features/notifications/domain/repositories/notifications.repository";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";

export class InMemoryNotificationsRepository implements INotificationsRepository {
  public readonly rows: Notification[] = [];
  public readonly createManyCalls: Notification[][] = [];
  public readonly calls: string[] = [];

  public createMany(notifications: Notification[]): Promise<void> {
    this.calls.push("createMany");
    this.createManyCalls.push(notifications);
    this.rows.push(...notifications);

    return Promise.resolve();
  }

  public getPageForUser(query: NotificationsPageQuery): Promise<Paginated<Notification>> {
    const matching: Notification[] = this.rows
      .filter((row: Notification) => row.userId === query.userId && (!query.unreadOnly || !row.isRead))
      .sort((a: Notification, b: Notification) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve(
      new Paginated({
        items: matching.slice((query.page - 1) * query.limit, query.page * query.limit),
        total: matching.length,
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  public getByIdForUser(id: string, userId: string): Promise<Notification | undefined> {
    return Promise.resolve(this.rows.find((row: Notification) => row.id === id && row.userId === userId));
  }

  public countUnread(userId: string): Promise<number> {
    return Promise.resolve(this.rows.filter((row: Notification) => row.userId === userId && !row.isRead).length);
  }

  public markRead(_notification: Notification): Promise<void> {
    this.calls.push("markRead");

    return Promise.resolve();
  }

  public markAllRead(userId: string, readAt: Date): Promise<number> {
    const unread: Notification[] = this.rows.filter((row: Notification) => row.userId === userId && !row.isRead);

    for (const row of unread) {
      row.markRead(readAt);
    }

    return Promise.resolve(unread.length);
  }

  public deleteForUser(id: string, userId: string): Promise<boolean> {
    const index: number = this.rows.findIndex((row: Notification) => row.id === id && row.userId === userId);

    if (index === -1) {
      return Promise.resolve(false);
    }

    this.rows.splice(index, 1);

    return Promise.resolve(true);
  }
}

export function recordingRealtimePublisher(calls: string[] = []): { publisher: IRealtimePublisher; emitToUser: jest.Mock; emitToGroup: jest.Mock } {
  const emitToUser: jest.Mock = jest.fn((userId: string, event: string): void => {
    calls.push(`emit:${event}:${userId}`);
  });
  const emitToGroup: jest.Mock = jest.fn();

  return { publisher: { emitToUser, emitToGroup } as unknown as IRealtimePublisher, emitToUser, emitToGroup };
}

export function groupsFacadeWithMembers(membersByGroup: Record<string, string[]>): GroupsFacade {
  return {
    getGroupMembers: jest.fn(
      (groupId: string): Promise<GroupMemberSummary[]> =>
        Promise.resolve(
          (membersByGroup[groupId] ?? []).map(
            (userId: string): GroupMemberSummary => ({ userId, email: `${userId}@example.com`, userRole: "STUDENT", memberRole: "MEMBER" }),
          ),
        ),
    ),
  } as unknown as GroupsFacade;
}

export function reservationsFacadeWithActive(active: ActiveReservationSummary | undefined, holderUserIds: string[]): ReservationsFacade {
  return {
    getActiveReservation: jest.fn((): Promise<ActiveReservationSummary | undefined> => Promise.resolve(active)),
    listHolderUserIds: jest.fn((): Promise<string[]> => Promise.resolve(holderUserIds)),
  } as unknown as ReservationsFacade;
}
