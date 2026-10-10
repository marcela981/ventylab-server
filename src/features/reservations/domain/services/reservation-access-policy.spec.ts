/*
 * Funcionalidad: Pruebas de la política de acceso a reservas
 * Descripción: Verifica quién puede reservar para un titular, quién puede cancelar y quién puede desplazar la reserva de otro titular
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationPartyRole } from "@/features/reservations/domain/read-models/reservation.read-model";
import {
  canCancel,
  canPreempt,
  canReserveFor,
  type HolderGroupFacts,
  type ReservationActor,
} from "@/features/reservations/domain/services/reservation-access-policy";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";

const NO_FACTS: HolderGroupFacts = { leadsGroup: false, supervisesGroup: false, isStudentGroup: true };

function actor(userId: string, role: ReservationPartyRole): ReservationActor {
  return { userId, role };
}

function groupReservation(createdById: string): Reservation {
  return Reservation.schedule({
    holder: ReservationHolder.forGroup("group-1"),
    window: ReservationWindow.create(new Date("2026-10-12T11:00:00Z"), new Date("2026-10-12T12:00:00Z")),
    createdById,
    now: new Date("2026-10-12T10:00:00Z"),
  });
}

describe("reservation access policy", () => {
  it("decides who can reserve for a holder", () => {
    const group: ReservationHolder = ReservationHolder.forGroup("group-1");

    const decisions: boolean[] = [
      canReserveFor(actor("s1", "STUDENT"), ReservationHolder.forUser("s1"), NO_FACTS),
      canReserveFor(actor("s1", "STUDENT"), ReservationHolder.forUser("s2"), NO_FACTS),
      canReserveFor(actor("s1", "STUDENT"), group, { ...NO_FACTS, leadsGroup: true }),
      canReserveFor(actor("s1", "STUDENT"), group, NO_FACTS),
      canReserveFor(actor("t1", "TEACHER"), group, { ...NO_FACTS, supervisesGroup: true }),
      canReserveFor(actor("t1", "TEACHER"), group, NO_FACTS),
      canReserveFor(actor("t1", "TEACHER"), group, { ...NO_FACTS, supervisesGroup: true, isStudentGroup: false }),
      canReserveFor(actor("a1", "ADMIN"), ReservationHolder.forUser("s2"), NO_FACTS),
      canReserveFor(actor("a1", "ADMIN"), group, NO_FACTS),
    ];

    expect(decisions).toEqual([true, false, true, false, true, false, false, true, true]);
  });

  it("decides who can cancel a group reservation", () => {
    const reservation: Reservation = groupReservation("s1");

    const decisions: boolean[] = [
      canCancel(actor("s1", "STUDENT"), reservation, NO_FACTS),
      canCancel(actor("s2", "STUDENT"), reservation, NO_FACTS),
      canCancel(actor("s3", "STUDENT"), reservation, { ...NO_FACTS, leadsGroup: true }),
      canCancel(actor("t1", "TEACHER"), reservation, { ...NO_FACTS, supervisesGroup: true }),
      canCancel(actor("t2", "TEACHER"), reservation, NO_FACTS),
      canCancel(actor("a1", "ADMIN"), reservation, NO_FACTS),
    ];

    expect(decisions).toEqual([true, false, true, true, false, true]);
  });

  it("decides who can preempt whom", () => {
    const decisions: boolean[] = [
      canPreempt(actor("t1", "TEACHER"), "STUDENT"),
      canPreempt(actor("t1", "TEACHER"), "TEACHER"),
      canPreempt(actor("t1", "TEACHER"), "ADMIN"),
      canPreempt(actor("a1", "ADMIN"), "TEACHER"),
      canPreempt(actor("a1", "ADMIN"), "ADMIN"),
      canPreempt(actor("s1", "STUDENT"), "STUDENT"),
    ];

    expect(decisions).toEqual([true, false, false, true, true, false]);
  });
});
