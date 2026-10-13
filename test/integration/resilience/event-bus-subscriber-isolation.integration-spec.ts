/*
 * Funcionalidad: Prueba de resiliencia del bus de eventos
 * Descripción: Registra sobre EventsModule suscriptores reales con @OnEvent (síncrono que lanza sin supresión de errores, asíncrono que rechaza con la configuración por defecto y suscriptores sanos) y oyentes directos que lanzan o rechazan y verifica que el publicador no recibe el error, que los demás suscriptores se ejecutan, que el fallo queda registrado en el logger y que no aparece ningún rechazo sin manejar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { Test, type TestingModule } from "@nestjs/testing";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { DomainEvent } from "@/common/domain/events/domain-event";
import { EventsModule } from "@/common/infrastructure/events/events.module";

const ASYNC_SETTLE_MS: number = 100;

class ProbeHappenedEvent extends DomainEvent {
  public constructor(public readonly label: string) {
    super();
  }
}

@Injectable()
class SubscriberLog {
  public readonly received: string[] = [];
}

@Injectable()
class ThrowingSubscribers {
  // suppressErrors: false hands the failure to the bus instead of the event-emitter wrapper, which is the path under test.
  @OnEvent(ProbeHappenedEvent.name, { suppressErrors: false })
  public handleSynchronously(_event: ProbeHappenedEvent): void {
    throw new Error("synchronous subscriber failure");
  }

  @OnEvent(ProbeHappenedEvent.name, { async: true })
  public async handleAsynchronously(_event: ProbeHappenedEvent): Promise<void> {
    await Promise.resolve();

    throw new Error("asynchronous subscriber failure");
  }
}

@Injectable()
class HealthySubscribers {
  public constructor(private readonly _log: SubscriberLog) {}

  @OnEvent(ProbeHappenedEvent.name)
  public handleSynchronously(event: ProbeHappenedEvent): void {
    this._log.received.push(`sync:${event.label}`);
  }

  @OnEvent(ProbeHappenedEvent.name, { async: true })
  public async handleAsynchronously(event: ProbeHappenedEvent): Promise<void> {
    await Promise.resolve();

    this._log.received.push(`async:${event.label}`);
  }
}

function settle(): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, ASYNC_SETTLE_MS);
  });
}

describe("event bus subscriber isolation", () => {
  let moduleRef: TestingModule;
  let errorSpy: jest.SpyInstance;
  const unhandled: unknown[] = [];
  const recordUnhandled = (reason: unknown): void => {
    unhandled.push(reason);
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [EventsModule], providers: [SubscriberLog, ThrowingSubscribers, HealthySubscribers] }).compile();
    await moduleRef.init();
    moduleRef.get(EventEmitter2).on(ProbeHappenedEvent.name, (): void => {
      throw new Error("raw listener failure");
    });
    // A listener returning a rejected promise is exactly the case under test: the bus must attach the catch itself.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    moduleRef.get(EventEmitter2).on(ProbeHappenedEvent.name, (): Promise<void> => Promise.reject(new Error("raw listener rejection")));
    process.on("unhandledRejection", recordUnhandled);
  });

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
    unhandled.splice(0);
    moduleRef.get(SubscriberLog).received.splice(0);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  afterAll(async () => {
    process.off("unhandledRejection", recordUnhandled);
    await moduleRef?.close();
  });

  it("should not propagate a throwing subscriber to the publisher", async () => {
    const bus: IEventBus = moduleRef.get<IEventBus>(EVENT_BUS_TOKEN);

    const publish = (): void => bus.publish([new ProbeHappenedEvent("first")]);

    expect(publish).not.toThrow();
    await settle();
  });

  it("should still run the healthy synchronous and asynchronous subscribers", async () => {
    const bus: IEventBus = moduleRef.get<IEventBus>(EVENT_BUS_TOKEN);

    bus.publish([new ProbeHappenedEvent("one"), new ProbeHappenedEvent("two")]);
    await settle();

    expect([...moduleRef.get(SubscriberLog).received].sort()).toEqual(["async:one", "async:two", "sync:one", "sync:two"]);
  });

  it("should log every failing subscriber and leave no unhandled rejection", async () => {
    const bus: IEventBus = moduleRef.get<IEventBus>(EVENT_BUS_TOKEN);

    bus.publish([new ProbeHappenedEvent("logged")]);
    await settle();

    const messages: string[] = errorSpy.mock.calls.map((call: unknown[]): string => String(call[0]));

    expect(messages.filter((message: string): boolean => message.includes(`Subscriber of ${ProbeHappenedEvent.name} failed (Error)`))).toHaveLength(3);
    expect(messages).toContain("asynchronous subscriber failure");
    expect(unhandled).toEqual([]);
  });
});
