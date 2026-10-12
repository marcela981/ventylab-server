/*
 * Funcionalidad: Pruebas de la fachada de reservas para los comandos del ventilador
 * Descripción: Verifica la lectura de una reserva por identificador y el liderazgo del grupo titular que usa el arrebato del control del ventilador (falso para reservas de usuario); y que las horas de uso del ventilador de varios usuarios salen de una sola llamada al repositorio de analítica, recortadas al instante actual y al corte de una reserva desalojada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade, type UserVentilatorUsage } from "@/features/reservations/application/services/reservations.facade";
import { at, buildContext, buildGroupsFacade, EMPTY_RESERVATION_ANALYTICS, type ReservationsTestContext, seedReservation } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationAnalyticsRepository } from "@/features/reservations/domain/repositories/reservation-analytics.repository";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

function buildFacade(context: ReservationsTestContext): ReservationsFacade {
  return new ReservationsFacade(context.repository, context.accessService, context.reserveNowUseCase, context.releaseUseCase, buildGroupsFacade(), EMPTY_RESERVATION_ANALYTICS);
}

describe("ReservationsFacade for ventilator commands", () => {
  it("reads a reservation by identifier", async () => {
    const context: ReservationsTestContext = buildContext();
    const reservation: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forGroup("group-1"), createdById: "leader-1", startsAt: at("10:00"), endsAt: at("11:00") });

    const found: ActiveReservationSummary | undefined = await buildFacade(context).getReservationById(reservation.id);
    const missing: ActiveReservationSummary | undefined = await buildFacade(context).getReservationById("missing");

    expect(found).toMatchObject({ id: reservation.id, holderType: "GROUP", groupId: "group-1" });
    expect(missing).toBeUndefined();
  });

  it("tells whether a user leads the holder group", async () => {
    const context: ReservationsTestContext = buildContext();
    const facade: ReservationsFacade = buildFacade(context);
    const group: ActiveReservationSummary = { id: "r1", holderType: "GROUP", groupId: "group-1", createdById: "leader-1", startsAt: at("10:00"), endsAt: at("11:00") };
    const user: ActiveReservationSummary = { id: "r2", holderType: "USER", userId: "leader-1", createdById: "leader-1", startsAt: at("10:00"), endsAt: at("11:00") };

    const results: boolean[] = await Promise.all([
      facade.isGroupLeaderOfHolder("leader-1", group),
      facade.isGroupLeaderOfHolder("student-2", group),
      facade.isGroupLeaderOfHolder("leader-1", user),
    ]);

    expect(results).toEqual([true, false, false]);
  });
});

describe("ReservationsFacade for analytics", () => {
  it("sums the ventilator hours of many users from one repository call", async () => {
    const now: Date = new Date("2026-10-11T12:00:00.000Z");
    const analytics: jest.Mocked<IReservationAnalyticsRepository> = {
      getUserHeldReservations: jest.fn().mockResolvedValue([
        { userId: "student-1", startsAt: new Date("2026-10-10T08:00:00.000Z"), endsAt: new Date("2026-10-10T09:00:00.000Z"), status: "COMPLETED", updatedAt: now },
        { userId: "student-1", startsAt: new Date("2026-10-11T11:30:00.000Z"), endsAt: new Date("2026-10-11T13:00:00.000Z"), status: "SCHEDULED", updatedAt: now },
        {
          userId: "student-2",
          startsAt: new Date("2026-10-10T08:00:00.000Z"),
          endsAt: new Date("2026-10-10T10:00:00.000Z"),
          status: "PREEMPTED",
          updatedAt: new Date("2026-10-10T08:15:00.000Z"),
        },
        { userId: "student-2", startsAt: new Date("2026-10-11T08:00:00.000Z"), endsAt: new Date("2026-10-11T09:00:00.000Z"), status: "CANCELLED", updatedAt: new Date("2026-10-10T08:00:00.000Z") },
      ]),
      getReservationActivityOfUser: jest.fn(),
    };
    const context: ReservationsTestContext = buildContext();
    const facade: ReservationsFacade = new ReservationsFacade(context.repository, context.accessService, context.reserveNowUseCase, context.releaseUseCase, buildGroupsFacade(), analytics);

    const usage: UserVentilatorUsage[] = await facade.getVentilatorUsageForUsers(["student-1", "student-2"], now);

    expect(analytics.getUserHeldReservations).toHaveBeenCalledTimes(1);
    expect(analytics.getUserHeldReservations).toHaveBeenCalledWith(["student-1", "student-2"], now);
    expect(usage).toEqual([
      { userId: "student-1", reservations: 2, hours: 1.5 },
      { userId: "student-2", reservations: 1, hours: 0.25 },
    ]);
  });
});
