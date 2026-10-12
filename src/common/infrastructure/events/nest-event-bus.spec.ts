/*
 * Funcionalidad: Pruebas de NestEventBus
 * Descripción: Verifica el despacho por nombre de clase y por nombre de catálogo y el aislamiento de suscriptores (un error síncrono o asíncrono no detiene a los demás ni al publicador y queda registrado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { DomainEvent } from "@/common/domain/events/domain-event";
import { type CatalogDomainEvent, catalogMeta, type UserStatusChangedPayload } from "@/common/domain/events/domain-event-catalog";
import { NestEventBus } from "@/common/infrastructure/events/nest-event-bus";

class PlainEvent extends DomainEvent {}

class StatusChangedEvent extends DomainEvent implements CatalogDomainEvent<"user.statusChanged"> {
  public get catalogName(): "user.statusChanged" {
    return "user.statusChanged";
  }

  public toCatalogPayload(): UserStatusChangedPayload {
    return { ...catalogMeta(this), userId: "user-1", isActive: false };
  }
}

async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setImmediate(resolve);
  });
}

describe("NestEventBus", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("dispatches an event under its class name", () => {
    const emitter: EventEmitter2 = new EventEmitter2();
    const listener: jest.Mock = jest.fn();
    const event: PlainEvent = new PlainEvent();

    emitter.on(PlainEvent.name, listener);

    new NestEventBus(emitter).publish([event]);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it("dispatches a catalog event under its class name and its catalog name with the typed payload", () => {
    const emitter: EventEmitter2 = new EventEmitter2();
    const classListener: jest.Mock = jest.fn();
    const catalogListener: jest.Mock = jest.fn();
    const event: StatusChangedEvent = new StatusChangedEvent({ performedBy: "admin-1" });

    emitter.on(StatusChangedEvent.name, classListener);
    emitter.on("user.statusChanged", catalogListener);

    new NestEventBus(emitter).publish([event]);

    expect(classListener).toHaveBeenCalledWith(event);
    expect(catalogListener).toHaveBeenCalledWith({
      eventId: event.id,
      occurredAt: event.occurredAt,
      actorId: "admin-1",
      userId: "user-1",
      isActive: false,
    });
  });

  it("keeps running the other subscribers and does not throw when a subscriber throws synchronously", () => {
    const emitter: EventEmitter2 = new EventEmitter2();
    const before: jest.Mock = jest.fn();
    const after: jest.Mock = jest.fn();
    const bus: NestEventBus = new NestEventBus(emitter);

    emitter.on(PlainEvent.name, before);
    emitter.on(PlainEvent.name, (): void => {
      throw new TypeError("boom");
    });
    emitter.on(PlainEvent.name, after);

    const act = (): void => bus.publish([new PlainEvent(), new PlainEvent()]);

    expect(act).not.toThrow();
    expect(before).toHaveBeenCalledTimes(2);
    expect(after).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`Subscriber of ${PlainEvent.name} failed (TypeError)`), expect.any(String));
  });

  it("logs a rejected async subscriber without an unhandled rejection or affecting the others", async () => {
    const emitter: EventEmitter2 = new EventEmitter2();
    const other: jest.Mock = jest.fn();

    emitter.on("user.statusChanged", jest.fn().mockRejectedValue(new RangeError("late")));
    emitter.on("user.statusChanged", other);

    new NestEventBus(emitter).publish([new StatusChangedEvent()]);
    await flushPromises();

    expect(other).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Subscriber of user.statusChanged failed (RangeError)"), expect.any(String));
  });

  it("isolates a deferred subscriber registered with the async option", async () => {
    const emitter: EventEmitter2 = new EventEmitter2();
    const other: jest.Mock = jest.fn();

    emitter.on(PlainEvent.name, jest.fn().mockRejectedValue(new Error("deferred")), { async: true, promisify: true });
    emitter.on(PlainEvent.name, other);

    new NestEventBus(emitter).publish([new PlainEvent()]);
    await flushPromises();
    await flushPromises();

    expect(other).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`Subscriber of ${PlainEvent.name} failed (Error)`), expect.any(String));
  });
});
