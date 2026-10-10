/*
 * Funcionalidad: Repositorio Prisma de reservas
 * Descripción: Implementa IReservationsRepository sobre la tabla reservations: pg_advisory_xact_lock(hashtext(deviceId)) en la transacción (la misma clave que usaba el flujo heredado), consultas de solapamiento, reserva activa, rango, reservas de un usuario y conteos de reservas futuras, y guardado con bitácora en audit_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type Reservation as ReservationModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { RESERVATION_ENTITY_COLLECTION, RESERVATION_ENTITY_TYPE, type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import {
  type IReservationsRepository,
  type ReservationRangeQuery,
  type ReservationsOfUserQuery,
} from "@/features/reservations/domain/repositories/reservations.repository";
import { SCHEDULED_RESERVATION_STATUS } from "@/features/reservations/domain/value-objects/reservation-status";
import { type ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";
import { ReservationsMapper } from "@/features/reservations/infrastructure/persistence/prisma/mappers/reservations.mapper";

const MAX_RANGE_ROWS: number = 1000;
const MAX_USER_ROWS: number = 200;

@Injectable()
export class ReservationsPrismaRepository implements IReservationsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async lockDevice(deviceId: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.$queryRaw<{ locked: number }[]>`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${deviceId}))`;
  }

  public async getById(id: string, transaction?: unknown): Promise<Reservation | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ReservationModel | null = await client.reservation.findUnique({ where: { id } });

    return row ? ReservationsMapper.toDomain(row) : undefined;
  }

  public async getScheduledOverlapping(window: ReservationWindow, transaction?: unknown): Promise<Reservation[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: ReservationModel[] = await client.reservation.findMany({
      where: { status: SCHEDULED_RESERVATION_STATUS, startsAt: { lt: window.endsAt }, endsAt: { gt: window.startsAt } },
      orderBy: { startsAt: "asc" },
    });

    return rows.map((row: ReservationModel): Reservation => ReservationsMapper.toDomain(row));
  }

  public async getActiveAt(now: Date, transaction?: unknown): Promise<Reservation | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ReservationModel | null = await client.reservation.findFirst({
      where: { status: SCHEDULED_RESERVATION_STATUS, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
    });

    return row ? ReservationsMapper.toDomain(row) : undefined;
  }

  public async getInRange(query: ReservationRangeQuery, transaction?: unknown): Promise<Reservation[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const where: Prisma.ReservationWhereInput = { startsAt: { lt: query.to }, endsAt: { gt: query.from } };

    if (query.groupId !== undefined) {
      where.groupId = query.groupId;
    }

    const rows: ReservationModel[] = await client.reservation.findMany({ where, orderBy: { startsAt: "asc" }, take: MAX_RANGE_ROWS });

    return rows.map((row: ReservationModel): Reservation => ReservationsMapper.toDomain(row));
  }

  public async getOfUser(query: ReservationsOfUserQuery, transaction?: unknown): Promise<Reservation[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const owners: Prisma.ReservationWhereInput[] = [{ userId: query.userId }, { createdById: query.userId }];

    if (query.groupIds.length > 0) {
      owners.push({ groupId: { in: query.groupIds } });
    }

    const rows: ReservationModel[] = await client.reservation.findMany({
      where: { endsAt: { gt: query.endsAfter }, OR: owners },
      orderBy: { startsAt: "asc" },
      take: MAX_USER_ROWS,
    });

    return rows.map((row: ReservationModel): Reservation => ReservationsMapper.toDomain(row));
  }

  public async countUpcomingScheduledOfUser(userId: string, now: Date, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.reservation.count({
      where: { status: SCHEDULED_RESERVATION_STATUS, endsAt: { gt: now }, OR: [{ userId }, { createdById: userId }] },
    });
  }

  public async countUpcomingScheduledOfGroup(groupId: string, now: Date, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.reservation.count({ where: { status: SCHEDULED_RESERVATION_STATUS, endsAt: { gt: now }, groupId } });
  }

  public async save(reservation: Reservation, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.ReservationUncheckedCreateInput = ReservationsMapper.toPersistence(reservation);

    await client.reservation.upsert({ where: { id: reservation.id }, create: data, update: data });

    if (reservation.auditLogs.length > 0) {
      await this._auditLogRepository.save(RESERVATION_ENTITY_COLLECTION, RESERVATION_ENTITY_TYPE, reservation.id, reservation.auditLogs, transaction);
    }
  }
}
