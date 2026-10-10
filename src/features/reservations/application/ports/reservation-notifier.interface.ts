/*
 * Funcionalidad: Puerto ReservationNotifier
 * Descripción: Contrato para avisar al titular desplazado (usuario o grupo y cada uno de sus miembros) de que su reserva fue desplazada, con la ventana y el motivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationHolderSnapshot } from "@/features/reservations/domain/value-objects/reservation-holder";

export const RESERVATION_NOTIFIER_TOKEN: unique symbol = Symbol("RESERVATION_NOTIFIER_TOKEN");

export interface ReservationPreemptedNotification {
  readonly reservationId: string;
  readonly holder: ReservationHolderSnapshot;
  readonly recipientUserIds: string[];
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly reason?: string;
  readonly wasActive: boolean;
}

export interface IReservationNotifier {
  notifyPreempted(notification: ReservationPreemptedNotification): Promise<void>;
}
