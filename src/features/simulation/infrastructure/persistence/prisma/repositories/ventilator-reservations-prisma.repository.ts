/*
 * Funcionalidad: Repositorio Prisma de reservas del ventilador
 * Descripción: Implementa IVentilatorReservationsRepository sobre ventilator_reservations con PrismaService: pg_advisory_xact_lock(hashtext(deviceId)) en la transacción activa, expiración masiva de vencidas, lectura de la reserva activa con nombre del titular (une users como el servicio heredado) y upsert con auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type VentilatorReservation as VentilatorReservationModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  VENTILATOR_RESERVATION_COLLECTION,
  VENTILATOR_RESERVATION_TYPE,
  type VentilatorReservation,
} from "@/features/simulation/domain/entities/ventilator-reservation.entity";
import { type ActiveReservationView } from "@/features/simulation/domain/read-models/active-reservation.read-model";
import { type IVentilatorReservationsRepository } from "@/features/simulation/domain/repositories/ventilator-reservations.repository";
import { ACTIVE_RESERVATION_STATUS, EXPIRED_RESERVATION_STATUS } from "@/features/simulation/domain/value-objects/reservation-status";
import { VentilatorReservationsMapper } from "@/features/simulation/infrastructure/persistence/prisma/mappers/ventilator-reservations.mapper";

type ReservationWithHolder = VentilatorReservationModel & { user: { name: string | null; email: string } };

@Injectable()
export class VentilatorReservationsPrismaRepository implements IVentilatorReservationsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async lockDevice(deviceId: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.$queryRaw<{ locked: number }[]>`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${deviceId}))`;
  }

  public async expireOverdue(now: Date, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: Prisma.BatchPayload = await client.ventilatorReservation.updateMany({
      where: { status: ACTIVE_RESERVATION_STATUS, endTime: { lt: now } },
      data: { status: EXPIRED_RESERVATION_STATUS },
    });

    return result.count;
  }

  public async getActive(transaction?: unknown): Promise<ActiveReservationView | undefined> {
    return await this._findActive({ status: ACTIVE_RESERVATION_STATUS }, transaction);
  }

  public async getActiveByDevice(deviceId: string, transaction?: unknown): Promise<ActiveReservationView | undefined> {
    return await this._findActive({ status: ACTIVE_RESERVATION_STATUS, deviceId }, transaction);
  }

  public async getActiveByUser(userId: string, transaction?: unknown): Promise<VentilatorReservation | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: VentilatorReservationModel | null = await client.ventilatorReservation.findFirst({
      where: { userId, status: ACTIVE_RESERVATION_STATUS },
    });

    return row ? VentilatorReservationsMapper.toDomain(row) : undefined;
  }

  public async save(reservation: VentilatorReservation, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.VentilatorReservationUncheckedCreateInput = VentilatorReservationsMapper.toPersistence(reservation);

    await client.ventilatorReservation.upsert({
      where: { id: reservation.id },
      create: data,
      update: data,
    });

    if (reservation.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        VENTILATOR_RESERVATION_COLLECTION,
        VENTILATOR_RESERVATION_TYPE,
        reservation.id,
        reservation.auditLogs,
        transaction,
      );
    }
  }

  private async _findActive(where: Prisma.VentilatorReservationWhereInput, transaction?: unknown): Promise<ActiveReservationView | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ReservationWithHolder | null = await client.ventilatorReservation.findFirst({
      where,
      include: { user: { select: { name: true, email: true } } },
    });

    if (!row) {
      return undefined;
    }

    return {
      reservation: VentilatorReservationsMapper.toDomain(row),
      holderName: row.user.name ?? row.user.email,
    };
  }
}
