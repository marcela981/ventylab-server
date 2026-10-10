/*
 * Funcionalidad: Eventos de VentilatorReservation
 * Descripción: Eventos de dominio emitidos por el flujo heredado al reservar y al liberar el ventilador físico, con datos primitivos de la reserva gestionada por la feature de reservas; los consume el manejador que notifica por WebSocket
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export class VentilatorReservedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly userId: string;
  public readonly holderName?: string;
  public readonly groupId?: string;
  public readonly endTime: Date;

  public constructor({
    reservationId,
    userId,
    holderName,
    groupId,
    endTime,
  }: {
    reservationId: string;
    userId: string;
    holderName?: string;
    groupId?: string;
    endTime: Date;
  }) {
    super({ performedBy: userId });
    this.reservationId = reservationId;
    this.userId = userId;
    this.holderName = holderName;
    this.groupId = groupId;
    this.endTime = endTime;
  }
}

export class VentilatorReleasedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly userId: string;

  public constructor({ reservationId, userId }: { reservationId: string; userId: string }) {
    super({ performedBy: userId });
    this.reservationId = reservationId;
    this.userId = userId;
  }
}
