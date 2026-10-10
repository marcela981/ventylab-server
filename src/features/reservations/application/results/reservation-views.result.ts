/*
 * Funcionalidad: Resultado ReservationViewsResult
 * Descripción: Reservas enriquecidas junto con quien las consulta (usuario, rol y grupos) para que la presentación decida qué datos mostrar a cada rol
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";

export interface ReservationViewsResult {
  readonly views: ReservationView[];
  readonly viewer: ReservationViewer;
}
