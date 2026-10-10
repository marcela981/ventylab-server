/*
 * Funcionalidad: Estadísticas de uso de reservas
 * Descripción: Conteo, minutos totales y desglose por estado y por tipo de titular de las reservas de un rango
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationHolderTypeValue } from "@/features/reservations/domain/value-objects/reservation-holder";
import { type ReservationStatusValue } from "@/features/reservations/domain/value-objects/reservation-status";

export interface ReservationUsageStats {
  readonly count: number;
  readonly totalMinutes: number;
  readonly byStatus: Readonly<Record<ReservationStatusValue, number>>;
  readonly byHolderType: Readonly<Record<ReservationHolderTypeValue, number>>;
}
