/*
 * Funcionalidad: Comando CancelReservationCommand
 * Descripción: Intención de cancelar una reserva programada por parte de un actor con su rol
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CancelReservationCommand {
  public readonly reservationId: string;
  public readonly actorId: string;
  public readonly actorRole: string;

  public constructor({ reservationId, actorId, actorRole }: { reservationId: string; actorId: string; actorRole: string }) {
    this.reservationId = reservationId;
    this.actorId = actorId;
    this.actorRole = actorRole;
  }
}
