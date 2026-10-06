/*
 * Funcionalidad: Adaptador NestEventBus
 * Descripción: Implementa IEventBus publicando los eventos de dominio con EventEmitter2
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { IEventBus } from "@/common/application/events/event-bus.interface";
import { DomainEvent } from "@/common/domain/events/domain-event";

@Injectable()
export class NestEventBus implements IEventBus {
  public constructor(private readonly _eventEmitter: EventEmitter2) {}

  public publish(events: DomainEvent[]): void {
    for (const event of events) {
      this._eventEmitter.emit(event.constructor.name, event);
    }
  }
}
