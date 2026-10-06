/*
 * Funcionalidad: Eventos de VentilatorReservation
 * Descripción: Eventos de dominio emitidos al reservar y al liberar el ventilador físico; los consume el manejador que notifica por WebSocket
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";

export class VentilatorReservedEvent extends DomainEvent {
  public readonly entity: VentilatorReservation;
  public readonly holderName?: string;

  public constructor({ entity, holderName, performedBy }: { entity: VentilatorReservation; holderName?: string; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.holderName = holderName;
  }
}

export class VentilatorReleasedEvent extends DomainEvent {
  public readonly entity: VentilatorReservation;

  public constructor({ entity, performedBy }: { entity: VentilatorReservation; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
