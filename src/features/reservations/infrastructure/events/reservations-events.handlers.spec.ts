/*
 * Funcionalidad: Pruebas de los manejadores de eventos de reservas
 * Descripción: Verifica que el desplazamiento de una reserva de grupo emite reservation:preempted a la sala del grupo y una vez a la sala de cada usuario titular, y que un fallo al resolver titulares se registra sin propagarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { type ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import { RESERVATION_PREEMPTED_REALTIME_EVENT, ReservationsEventsHandlers } from "@/features/reservations/infrastructure/events/reservations-events.handlers";

function preemptedEvent(): ReservationPreemptedEvent {
  return new ReservationPreemptedEvent({
    reservationId: "reservation-1",
    previousHolder: { type: "GROUP", groupId: "group-1" },
    window: { startsAt: new Date("2026-10-12T11:00:00.000Z"), endsAt: new Date("2026-10-12T12:00:00.000Z") },
    reason: "Class demo",
    wasActive: false,
    preemptedById: "teacher-1",
    replacedByReservationId: "reservation-2",
  });
}

describe("ReservationsEventsHandlers", () => {
  it("emits reservation:preempted to the group room and once to every holder user room", async () => {
    const emitToUser: jest.Mock = jest.fn();
    const emitToGroup: jest.Mock = jest.fn();
    const publisher: IRealtimePublisher = { emitToUser, emitToGroup } as unknown as IRealtimePublisher;
    const access: ReservationAccessService = { listHolderUserIds: jest.fn().mockResolvedValue(["leader-1", "student-2", "leader-1"]) } as unknown as ReservationAccessService;

    await new ReservationsEventsHandlers(publisher, access).handleReservationPreempted(preemptedEvent());

    const payload: Record<string, unknown> = {
      reservationId: "reservation-1",
      holderType: "GROUP",
      groupId: "group-1",
      startsAt: "2026-10-12T11:00:00.000Z",
      endsAt: "2026-10-12T12:00:00.000Z",
      reason: "Class demo",
      wasActive: false,
    };

    expect(emitToGroup).toHaveBeenCalledWith("group-1", RESERVATION_PREEMPTED_REALTIME_EVENT, payload);
    expect(emitToUser.mock.calls).toEqual([
      ["leader-1", RESERVATION_PREEMPTED_REALTIME_EVENT, payload],
      ["student-2", RESERVATION_PREEMPTED_REALTIME_EVENT, payload],
    ]);
  });

  it("logs a failure to resolve the holders without rejecting", async () => {
    const errorSpy: jest.SpyInstance = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
    const publisher: IRealtimePublisher = { emitToUser: jest.fn(), emitToGroup: jest.fn() } as unknown as IRealtimePublisher;
    const access: ReservationAccessService = { listHolderUserIds: jest.fn().mockRejectedValue(new TypeError("db down")) } as unknown as ReservationAccessService;

    await expect(new ReservationsEventsHandlers(publisher, access).handleReservationPreempted(preemptedEvent())).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith("Preemption notification failed for reservation reservation-1 (TypeError)");

    errorSpy.mockRestore();
  });
});
