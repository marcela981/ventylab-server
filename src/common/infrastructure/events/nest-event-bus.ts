/*
 * Funcionalidad: Adaptador NestEventBus
 * Descripción: Implementa IEventBus sobre EventEmitter2: despacha cada evento de dominio bajo el nombre de su clase y, si implementa CatalogDomainEvent, también bajo su nombre de catálogo con la carga útil tipada; invoca cada suscriptor aislado (un error síncrono o una promesa rechazada se registra con Logger y no afecta a los demás suscriptores ni al publicador)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { IEventBus } from "@/common/application/events/event-bus.interface";
import { DomainEvent } from "@/common/domain/events/domain-event";
import { isCatalogDomainEvent } from "@/common/domain/events/domain-event-catalog";

type EventListener = (...args: unknown[]) => unknown;

@Injectable()
export class NestEventBus implements IEventBus {
  private readonly _logger: Logger = new Logger(NestEventBus.name);

  public constructor(private readonly _eventEmitter: EventEmitter2) {}

  public publish(events: DomainEvent[]): void {
    for (const event of events) {
      this._dispatch(event.constructor.name, event);

      if (isCatalogDomainEvent(event)) {
        this._dispatch(event.catalogName, event.toCatalogPayload());
      }
    }
  }

  private _dispatch(name: string, payload: unknown): void {
    const listeners: EventListener[] = this._eventEmitter.listeners(name) as EventListener[];

    for (const listener of listeners) {
      try {
        // The emitter is the call context because EventEmitter2 async wrappers read the event name from `this`
        const result: unknown = listener.call(this._eventEmitter, payload);

        if (result instanceof Promise) {
          result.catch((error: unknown): void => this._logFailure(name, error));
        }
      } catch (error: unknown) {
        this._logFailure(name, error);
      }
    }
  }

  private _logFailure(name: string, error: unknown): void {
    this._logger.error(`Subscriber of ${name} failed (${error instanceof Error ? error.name : "UnknownError"})`, error instanceof Error ? error.stack : undefined);
  }
}
