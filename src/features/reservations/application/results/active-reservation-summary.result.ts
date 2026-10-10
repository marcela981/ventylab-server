/*
 * Funcionalidad: Resumen de la reserva activa
 * Descripción: Lectura primitiva de una reserva que la fachada entrega a otras features (titular, creador y ventana) sin exponer la entidad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationHolderTypeValue } from "@/features/reservations/domain/value-objects/reservation-holder";

export interface ActiveReservationSummary {
  readonly id: string;
  readonly holderType: ReservationHolderTypeValue;
  readonly userId?: string;
  readonly groupId?: string;
  readonly createdById: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export function toActiveReservationSummary(reservation: Reservation): ActiveReservationSummary {
  return {
    id: reservation.id,
    holderType: reservation.holder.type,
    userId: reservation.holder.userId,
    groupId: reservation.holder.groupId,
    createdById: reservation.createdById,
    startsAt: reservation.startsAt,
    endsAt: reservation.endsAt,
  };
}
