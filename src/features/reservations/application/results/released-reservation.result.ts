/*
 * Funcionalidad: Resultado ReleasedReservationResult
 * Descripción: Reserva activa liberada desde el flujo heredado: identificador, usuario titular (o creador de la reserva de grupo) y grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface ReleasedReservationResult {
  readonly reservationId: string;
  readonly holderUserId: string;
  readonly groupId?: string;
}
