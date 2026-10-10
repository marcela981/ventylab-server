/*
 * Funcionalidad: Pruebas del acceso a la sala de telemetría
 * Descripción: Verifica que un estudiante sin reserva reciba ventilator:join-rejected y la disponibilidad sin curvas, que el titular se una a la sala, que docentes y administradores usen su sala de rol, que el cambio de reserva activa vacíe la sala, una a los nuevos titulares y difunda ventilator:availability, y que el titular autenticado se una
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { VentilatorRoomAccessService, type VentilatorJoinOutcome } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";
import {
  buildTelemetrySettings,
  FakeRealtimePublisher,
  type RecordedEmit,
} from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";

const STARTS_AT: Date = new Date("2026-10-10T12:00:00.000Z");
const ENDS_AT: Date = new Date("2026-10-10T13:00:00.000Z");

class FakeReservationsFacade {
  public active: ActiveReservationSummary | undefined;
  public holders: string[] = [];

  public async getActiveReservation(_now: Date): Promise<ActiveReservationSummary | undefined> {
    return await Promise.resolve(this.active);
  }

  public async listHolderUserIds(_reservation: ActiveReservationSummary): Promise<string[]> {
    return await Promise.resolve(this.holders);
  }
}

function reservation(id: string): ActiveReservationSummary {
  return { id, holderType: "GROUP", groupId: "group-1", createdById: "teacher-1", startsAt: STARTS_AT, endsAt: ENDS_AT };
}

interface RoomFixture {
  readonly service: VentilatorRoomAccessService;
  readonly facade: FakeReservationsFacade;
  readonly publisher: FakeRealtimePublisher;
}

function buildService(): RoomFixture {
  const facade: FakeReservationsFacade = new FakeReservationsFacade();
  const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
  const service: VentilatorRoomAccessService = new VentilatorRoomAccessService(facade as unknown as ReservationsFacade, publisher, buildTelemetrySettings());

  return { service, facade, publisher };
}

describe("VentilatorRoomAccessService", () => {
  it("rejects ventilator:join from a student when there is no active reservation and sends availability without curves", async () => {
    const { service, publisher }: RoomFixture = buildService();

    await service.refresh();
    publisher.emits.length = 0;

    const outcome: VentilatorJoinOutcome = service.handleJoinRequest({ userId: "student-1", role: "STUDENT" });

    expect(outcome).toBe("rejected");
    expect(publisher.emits).toEqual([
      { method: "emitToUser", target: "student-1", event: "ventilator:join-rejected", payload: { reason: "no_active_reservation" } },
      { method: "emitToUser", target: "student-1", event: "ventilator:availability", payload: { occupied: false } },
    ]);
    expect(publisher.joins).toEqual([]);
  });

  it("rejects a student who is not a holder of the active reservation", async () => {
    const { service, facade, publisher }: RoomFixture = buildService();

    facade.active = reservation("reservation-1");
    facade.holders = ["student-1"];
    await service.refresh();
    publisher.emits.length = 0;

    const outcome: VentilatorJoinOutcome = service.handleJoinRequest({ userId: "student-2", role: "STUDENT" });

    expect(outcome).toBe("rejected");
    expect(publisher.emitsOf("ventilator:join-rejected")[0].payload).toEqual({ reason: "not_reservation_holder" });
    expect(publisher.emitsOf("ventilator:telemetry")).toEqual([]);
  });

  it("joins a holder to the ventilator room", async () => {
    const { service, facade, publisher }: RoomFixture = buildService();

    facade.active = reservation("reservation-1");
    facade.holders = ["student-1"];
    await service.refresh();
    publisher.joins.length = 0;

    const outcome: VentilatorJoinOutcome = service.handleJoinRequest({ userId: "student-1", role: "STUDENT" });

    expect(outcome).toBe("joined");
    expect(publisher.joins).toEqual([{ userId: "student-1", room: "ventilator" }]);
  });

  it("lets teachers and administrators receive telemetry through their role room", async () => {
    const { service, publisher }: RoomFixture = buildService();

    await service.refresh();
    publisher.emits.length = 0;

    const outcome: VentilatorJoinOutcome = service.handleJoinRequest({ userId: "teacher-1", role: "TEACHER" });

    expect(outcome).toBe("privileged");
    expect(publisher.emitsOf("ventilator:join-rejected")).toEqual([]);
  });

  it("clears the room, joins the new holders and broadcasts availability when the active reservation changes", async () => {
    const { service, facade, publisher }: RoomFixture = buildService();
    const changes: (string | undefined)[] = [];

    service.onActiveReservationChange((id: string | undefined): void => {
      changes.push(id);
    });
    facade.active = reservation("reservation-1");
    facade.holders = ["student-1", "student-2"];
    await service.refresh();
    await service.refresh();

    facade.active = reservation("reservation-2");
    facade.holders = ["student-3"];
    await service.refresh();
    const availability: RecordedEmit[] = publisher.emitsOf("ventilator:availability");

    expect(publisher.clearedRooms).toEqual(["ventilator", "ventilator"]);
    expect(publisher.joins).toEqual([
      { userId: "student-1", room: "ventilator" },
      { userId: "student-2", room: "ventilator" },
      { userId: "student-3", room: "ventilator" },
    ]);
    expect(availability).toHaveLength(2);
    expect(availability[1]).toEqual({
      method: "broadcast",
      target: undefined,
      event: "ventilator:availability",
      payload: { occupied: true, startsAt: STARTS_AT.toISOString(), endsAt: ENDS_AT.toISOString() },
    });
    expect(changes).toEqual(["reservation-1", "reservation-2"]);
    expect(service.isHolder("student-1")).toBe(false);
  });

  it("joins a holder as soon as the socket authenticates", async () => {
    const { service, facade, publisher }: RoomFixture = buildService();

    facade.active = reservation("reservation-1");
    facade.holders = ["student-1"];
    await service.refresh();
    publisher.joins.length = 0;

    service.handleClientAuthenticated({ userId: "student-1", role: "STUDENT" });
    service.handleClientAuthenticated({ userId: "student-9", role: "STUDENT" });

    expect(publisher.joins).toEqual([{ userId: "student-1", room: "ventilator" }]);
  });
});
