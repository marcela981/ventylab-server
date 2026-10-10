/*
 * Funcionalidad: Pruebas de la fachada de reservas para los comandos del ventilador
 * Descripción: Verifica la lectura de una reserva por identificador y el liderazgo del grupo titular que usa el arrebato del control del ventilador (falso para reservas de usuario)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { at, buildContext, buildGroupsFacade, type ReservationsTestContext, seedReservation } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

function buildFacade(context: ReservationsTestContext): ReservationsFacade {
  return new ReservationsFacade(context.repository, context.accessService, context.reserveNowUseCase, context.releaseUseCase, buildGroupsFacade());
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
