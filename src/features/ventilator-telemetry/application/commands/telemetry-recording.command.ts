/*
 * Funcionalidad: Comando de grabación de telemetría
 * Descripción: Comando con el usuario y el rol que inician, detienen o leen una grabación de telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class TelemetryRecordingCommand {
  public readonly userId: string;
  public readonly role: string;

  public constructor({ userId, role }: { userId: string; role: string }) {
    this.userId = userId;
    this.role = role;
  }
}

export class GetTelemetryRecordingCommand {
  public readonly reservationId: string;
  public readonly userId: string;
  public readonly role: string;

  public constructor({ reservationId, userId, role }: { reservationId: string; userId: string; role: string }) {
    this.reservationId = reservationId;
    this.userId = userId;
    this.role = role;
  }
}
