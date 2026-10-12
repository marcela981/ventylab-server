/*
 * Funcionalidad: Puerto de repositorio RESERVATION_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IReservationAnalyticsRepository de lecturas por lotes para analítica (reservas a nombre de varios usuarios iniciadas antes de un instante y reservas de un usuario, como titular o creador, que empiezan en un rango), sus modelos de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationHolderTypeValue } from "@/features/reservations/domain/value-objects/reservation-holder";
import { type ReservationStatusValue } from "@/features/reservations/domain/value-objects/reservation-status";

export const RESERVATION_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("RESERVATION_ANALYTICS_REPOSITORY_TOKEN");

export interface UserHeldReservationView {
  readonly userId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: ReservationStatusValue;
  readonly updatedAt: Date;
}

export interface ReservationActivityView {
  readonly reservationId: string;
  readonly holderType: ReservationHolderTypeValue;
  readonly groupId?: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: ReservationStatusValue;
}

export interface IReservationAnalyticsRepository {
  getUserHeldReservations(userIds: readonly string[], startedBefore: Date): Promise<UserHeldReservationView[]>;
  getReservationActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<ReservationActivityView[]>;
}
