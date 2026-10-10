/*
 * Funcionalidad: Mapper de persistencia de reservas
 * Descripción: Convierte filas de la tabla reservations en el agregado Reservation (con bitácora vacía) y el agregado en la entrada de Prisma sin bitácora
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type Reservation as ReservationModel } from "@prisma/client";

import { Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { toReservationStatus } from "@/features/reservations/domain/value-objects/reservation-status";

export class ReservationsMapper {
  public static toDomain(row: ReservationModel): Reservation {
    return Reservation.reconstitute({
      id: row.id,
      holder: ReservationHolder.create({ type: row.holderType, userId: row.userId ?? undefined, groupId: row.groupId ?? undefined }),
      createdById: row.createdById,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: toReservationStatus(row.status),
      purpose: row.purpose ?? undefined,
      preemptedById: row.preemptedById ?? undefined,
      preemptedReason: row.preemptedReason ?? undefined,
      replacedByReservationId: row.replacedByReservationId ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(reservation: Reservation): Prisma.ReservationUncheckedCreateInput {
    return {
      id: reservation.id,
      holderType: reservation.holder.type,
      userId: reservation.holder.userId ?? null,
      groupId: reservation.holder.groupId ?? null,
      createdById: reservation.createdById,
      startsAt: reservation.startsAt,
      endsAt: reservation.endsAt,
      status: reservation.status,
      purpose: reservation.purpose ?? null,
      preemptedById: reservation.preemptedById ?? null,
      preemptedReason: reservation.preemptedReason ?? null,
      replacedByReservationId: reservation.replacedByReservationId ?? null,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
