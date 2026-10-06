/*
 * Funcionalidad: Repositorio de reservas del ventilador
 * Descripción: Contrato de persistencia del agregado VentilatorReservation: bloqueo por dispositivo dentro de la transacción, expiración de reservas vencidas, lectura de la reserva activa (global, por dispositivo o por usuario) y guardado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";
import { type ActiveReservationView } from "@/features/simulation/domain/read-models/active-reservation.read-model";

export const VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN: unique symbol = Symbol("VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN");

export interface IVentilatorReservationsRepository {
  lockDevice(deviceId: string, transaction: unknown): Promise<void>;
  expireOverdue(now: Date, transaction?: unknown): Promise<number>;
  getActive(transaction?: unknown): Promise<ActiveReservationView | undefined>;
  getActiveByDevice(deviceId: string, transaction?: unknown): Promise<ActiveReservationView | undefined>;
  getActiveByUser(userId: string, transaction?: unknown): Promise<VentilatorReservation | undefined>;
  save(reservation: VentilatorReservation, transaction?: unknown): Promise<void>;
}
