/*
 * Funcionalidad: Clase base AggregateRoot
 * Descripción: Base de los agregados de dominio que acumula los eventos de dominio pendientes de publicar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export abstract class AggregateRoot {
  private _events: DomainEvent[] = [];

  protected publishEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  public getEvents(): DomainEvent[] {
    const events: DomainEvent[] = [...this._events];
    this._clearEvents();
    return events;
  }

  private _clearEvents(): void {
    this._events = [];
  }
}
