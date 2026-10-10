/*
 * Funcionalidad: Pruebas del notificador de reservas por WebSocket
 * Descripción: Verifica que el aviso de desplazamiento de una reserva de grupo se emita a la sala del grupo y a la sala de cada miembro, con la ventana y el motivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import {
  RESERVATION_PREEMPTED_REALTIME_EVENT,
  RealtimeReservationNotifier,
} from "@/features/reservations/infrastructure/realtime/realtime-reservation.notifier";

describe("RealtimeReservationNotifier", () => {
  it("notifies the group room and every member room", async () => {
    const emitToUser: jest.Mock = jest.fn();
    const emitToGroup: jest.Mock = jest.fn();
    const publisher: IRealtimePublisher = { emitToUser, emitToGroup } as unknown as IRealtimePublisher;
    const notifier: RealtimeReservationNotifier = new RealtimeReservationNotifier(publisher);

    await notifier.notifyPreempted({
      reservationId: "reservation-1",
      holder: { type: "GROUP", groupId: "group-1" },
      recipientUserIds: ["leader-1", "student-2", "leader-1"],
      startsAt: new Date("2026-10-12T11:00:00.000Z"),
      endsAt: new Date("2026-10-12T12:00:00.000Z"),
      reason: "Class demo",
      wasActive: false,
    });

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
});
