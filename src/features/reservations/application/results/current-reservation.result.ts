/*
 * Funcionalidad: Resultado CurrentReservationResult
 * Descripción: Reserva activa enriquecida (si existe) y si quien consulta puede controlar el ventilador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";

export interface CurrentReservationResult {
  readonly view?: ReservationView;
  readonly canControl: boolean;
  readonly viewer: ReservationViewer;
}
