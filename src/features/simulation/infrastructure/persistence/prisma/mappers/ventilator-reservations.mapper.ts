/*
 * Funcionalidad: Mapper de persistencia de reservas del ventilador
 * Descripción: Convierte filas de ventilator_reservations (Prisma) en el agregado VentilatorReservation y el agregado en la entrada de upsert
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type VentilatorReservation as VentilatorReservationModel } from "@prisma/client";

import { VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";
import { toReservationStatus } from "@/features/simulation/domain/value-objects/reservation-status";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

export class VentilatorReservationsMapper {
  public static toDomain(row: VentilatorReservationModel): VentilatorReservation {
    return VentilatorReservation.reconstitute({
      id: row.id,
      userId: row.userId,
      userRole: UserRole.create(row.userRole).value,
      deviceId: row.deviceId,
      groupId: row.groupId ?? undefined,
      leaderId: row.leaderId ?? undefined,
      status: toReservationStatus(row.status),
      durationMinutes: row.durationMinutes,
      startTime: row.startTime,
      endTime: row.endTime,
      releasedAt: row.releasedAt ?? undefined,
      purpose: row.purpose ?? undefined,
      cancelReason: row.cancelReason ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(reservation: VentilatorReservation): Prisma.VentilatorReservationUncheckedCreateInput {
    return {
      id: reservation.id,
      userId: reservation.userId,
      userRole: reservation.userRole,
      deviceId: reservation.deviceId,
      groupId: reservation.groupId ?? null,
      leaderId: reservation.leaderId ?? null,
      status: reservation.status,
      durationMinutes: reservation.durationMinutes,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      releasedAt: reservation.releasedAt ?? null,
      purpose: reservation.purpose ?? null,
      cancelReason: reservation.cancelReason ?? null,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
