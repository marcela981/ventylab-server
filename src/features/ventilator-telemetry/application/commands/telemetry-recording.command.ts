/*
 * Funcionalidad: Comando de grabación de telemetría
 * Descripción: Comandos con el usuario y el rol que inician, detienen o leen una grabación de telemetría, y el que lista las grabaciones de un usuario en un rango
 * Versión: 1.1
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

export class ListTelemetryRecordingsCommand {
  public readonly actor: { readonly id: string; readonly role: string };
  public readonly userId?: string;
  public readonly from?: Date;
  public readonly to?: Date;
  public readonly now: Date;

  public constructor({ actor, userId, from, to, now }: { actor: { id: string; role: string }; userId?: string; from?: Date; to?: Date; now: Date }) {
    this.actor = actor;
    this.userId = userId;
    this.from = from;
    this.to = to;
    this.now = now;
  }
}
