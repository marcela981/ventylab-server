/*
 * Funcionalidad: Repositorio de reservas
 * Descripción: Contrato de persistencia del agregado Reservation: bloqueo del dispositivo en la transacción (misma clave que el flujo heredado), reservas programadas que se solapan con una ventana, la activa en un instante, rangos del calendario, reservas de un usuario o sus grupos, conteos de reservas futuras y guardado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";

export const RESERVATIONS_REPOSITORY_TOKEN: unique symbol = Symbol("RESERVATIONS_REPOSITORY_TOKEN");

export interface ReservationRangeQuery {
  from: Date;
  to: Date;
  groupId?: string;
}

export interface ReservationsOfUserQuery {
  userId: string;
  groupIds: string[];
  endsAfter: Date;
}

export interface IReservationsRepository {
  lockDevice(deviceId: string, transaction: unknown): Promise<void>;
  getById(id: string, transaction?: unknown): Promise<Reservation | undefined>;
  getScheduledOverlapping(window: ReservationWindow, transaction?: unknown): Promise<Reservation[]>;
  getActiveAt(now: Date, transaction?: unknown): Promise<Reservation | undefined>;
  getInRange(query: ReservationRangeQuery, transaction?: unknown): Promise<Reservation[]>;
  getOfUser(query: ReservationsOfUserQuery, transaction?: unknown): Promise<Reservation[]>;
  countUpcomingScheduledOfUser(userId: string, now: Date, transaction?: unknown): Promise<number>;
  countUpcomingScheduledOfGroup(groupId: string, now: Date, transaction?: unknown): Promise<number>;
  save(reservation: Reservation, transaction?: unknown): Promise<void>;
}
