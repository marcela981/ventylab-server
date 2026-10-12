/*
 * Funcionalidad: Repositorio Prisma ReservationAnalyticsPrismaRepository
 * Descripción: Implementa IReservationAnalyticsRepository sobre PrismaService: una sola consulta con IN de las reservas con titular USER de varios usuarios iniciadas antes de un instante (solo las columnas de la ventana y el estado) y las reservas de un usuario, como titular o creador, que empiezan en un rango
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type ReservationHolderType, type ReservationLifecycleStatus } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type IReservationAnalyticsRepository,
  type ReservationActivityView,
  type UserHeldReservationView,
} from "@/features/reservations/domain/repositories/reservation-analytics.repository";

const USER_HOLDER: ReservationHolderType = "USER";

interface HeldRow {
  userId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: ReservationLifecycleStatus;
  updatedAt: Date;
}

interface ActivityRow {
  id: string;
  holderType: ReservationHolderType;
  groupId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: ReservationLifecycleStatus;
}

@Injectable()
export class ReservationAnalyticsPrismaRepository implements IReservationAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getUserHeldReservations(userIds: readonly string[], startedBefore: Date): Promise<UserHeldReservationView[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows: HeldRow[] = await this._prisma.reservation.findMany({
      where: { holderType: USER_HOLDER, userId: { in: [...new Set<string>(userIds)] }, startsAt: { lt: startedBefore } },
      select: { userId: true, startsAt: true, endsAt: true, status: true, updatedAt: true },
    });

    return rows.flatMap((row: HeldRow): UserHeldReservationView[] =>
      row.userId === null ? [] : [{ userId: row.userId, startsAt: row.startsAt, endsAt: row.endsAt, status: row.status, updatedAt: row.updatedAt }],
    );
  }

  public async getReservationActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<ReservationActivityView[]> {
    const rows: ActivityRow[] = await this._prisma.reservation.findMany({
      where: { OR: [{ userId }, { createdById: userId }], startsAt: { gte: from, lt: to } },
      select: { id: true, holderType: true, groupId: true, startsAt: true, endsAt: true, status: true },
      orderBy: [{ startsAt: "desc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map(
      (row: ActivityRow): ReservationActivityView => ({
        reservationId: row.id,
        holderType: row.holderType,
        groupId: row.groupId ?? undefined,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
      }),
    );
  }
}
