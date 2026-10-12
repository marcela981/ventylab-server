/*
 * Funcionalidad: Pruebas de notificaciones sobre el bus de eventos real
 * Descripción: Con NestEventBus y un EventEmitter2 real verifica que un desplazamiento de reserva persiste la notificación, emite notification:new al afectado y mantiene el aviso heredado reservation:preempted, y que un suscriptor de notificaciones que falla se registra sin afectar al publicador ni a los demás suscriptores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { Test, type TestingModule } from "@nestjs/testing";

import { REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { NestEventBus } from "@/common/infrastructure/events/nest-event-bus";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { NOTIFICATION_NEW_REALTIME_EVENT } from "@/features/notifications/application/results/notification.result";
import { NotificationRecipientsService } from "@/features/notifications/application/services/notification-recipients.service";
import {
  groupsFacadeWithMembers,
  InMemoryNotificationsRepository,
  recordingRealtimePublisher,
  reservationsFacadeWithActive,
} from "@/features/notifications/application/testing/notifications-test-doubles-spec";
import { DeliverNotificationsUseCase } from "@/features/notifications/application/use-cases/deliver-notifications.usecase";
import { NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";
import { NotificationsEventsHandlers } from "@/features/notifications/infrastructure/events/notifications-events.handlers";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import { RESERVATION_PREEMPTED_REALTIME_EVENT, ReservationsEventsHandlers } from "@/features/reservations/infrastructure/events/reservations-events.handlers";

interface BusHarness {
  module: TestingModule;
  bus: NestEventBus;
  repository: InMemoryNotificationsRepository;
  emitToUser: jest.Mock;
}

async function flushDeferredHandlers(): Promise<void> {
  for (let tick: number = 0; tick < 5; tick += 1) {
    await new Promise<void>((resolve: () => void): void => {
      setImmediate(resolve);
    });
  }
}

async function createHarness(): Promise<BusHarness> {
  const repository: InMemoryNotificationsRepository = new InMemoryNotificationsRepository();
  const { publisher, emitToUser } = recordingRealtimePublisher(repository.calls);

  const module: TestingModule = await Test.createTestingModule({
    imports: [EventEmitterModule.forRoot()],
    providers: [
      { provide: NOTIFICATIONS_REPOSITORY_TOKEN, useValue: repository },
      { provide: REALTIME_PUBLISHER_TOKEN, useValue: publisher },
      { provide: GroupsFacade, useValue: groupsFacadeWithMembers({}) },
      { provide: ReservationsFacade, useValue: reservationsFacadeWithActive(undefined, []) },
      { provide: ReservationAccessService, useValue: { listHolderUserIds: jest.fn().mockResolvedValue(["student-1"]) } },
      NotificationRecipientsService,
      DeliverNotificationsUseCase,
      NotificationsEventsHandlers,
      ReservationsEventsHandlers,
    ],
  }).compile();

  await module.init();

  return { module, bus: new NestEventBus(module.get(EventEmitter2)), repository, emitToUser };
}

function preemptedEvent(): ReservationPreemptedEvent {
  return new ReservationPreemptedEvent({
    reservationId: "reservation-1",
    previousHolder: { type: "USER", userId: "student-1" },
    window: { startsAt: new Date("2026-10-12T13:00:00.000Z"), endsAt: new Date("2026-10-12T14:00:00.000Z") },
    wasActive: false,
    preemptedById: "teacher-1",
    replacedByReservationId: "reservation-2",
  });
}

describe("Notifications on the event bus", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("persists the preemption notification, then emits notification:new and keeps the legacy reservation:preempted emit", async () => {
    const { module, bus, repository, emitToUser } = await createHarness();

    bus.publish([preemptedEvent()]);
    await flushDeferredHandlers();

    expect(repository.rows).toHaveLength(1);
    expect(repository.rows[0].userId).toBe("student-1");
    expect(repository.calls.indexOf("createMany")).toBeLessThan(repository.calls.indexOf(`emit:${NOTIFICATION_NEW_REALTIME_EVENT}:student-1`));
    expect(emitToUser).toHaveBeenCalledWith("student-1", NOTIFICATION_NEW_REALTIME_EVENT, expect.objectContaining({ type: "RESERVATION_PREEMPTED" }));
    expect(emitToUser).toHaveBeenCalledWith("student-1", RESERVATION_PREEMPTED_REALTIME_EVENT, expect.objectContaining({ reservationId: "reservation-1" }));

    await module.close();
  });

  it("isolates a throwing notifications subscriber: publish does not throw, the legacy emit still happens and the error is logged", async () => {
    const { module, bus, repository, emitToUser } = await createHarness();

    jest.spyOn(module.get(NotificationsEventsHandlers), "handleReservationPreempted").mockRejectedValue(new RangeError("subscriber down"));

    const act = (): void => bus.publish([preemptedEvent()]);

    expect(act).not.toThrow();
    await flushDeferredHandlers();

    expect(repository.rows).toHaveLength(0);
    expect(emitToUser).toHaveBeenCalledWith("student-1", RESERVATION_PREEMPTED_REALTIME_EVENT, expect.anything());
    // The @OnEvent wrapper of @nestjs/event-emitter (suppressErrors) catches the rejection first and logs message and stack
    expect(errorSpy).toHaveBeenCalledWith("subscriber down", expect.any(String));

    await module.close();
  });
});
