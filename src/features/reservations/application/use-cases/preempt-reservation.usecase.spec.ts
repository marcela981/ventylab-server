/*
 * Funcionalidad: Pruebas de PreemptReservationUseCase
 * Descripción: Verifica que desplazar una reserva exige que exista y siga programada, que la ventana por defecto se alinea a franjas (inicio en la franja actual si ya empezó, fin redondeado hacia arriba, al menos una franja y como máximo la duración máxima), que una ventana explícita se respeta y que el desplazamiento se delega en CreateReservationUseCase con confirmación y motivo, respetando sus reglas de quién puede desplazar a quién
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  at,
  buildContext,
  NOW,
  type ReservationsTestContext,
  seedReservation,
  TEST_SETTINGS,
} from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type PreemptReservationInput, PreemptReservationUseCase } from "@/features/reservations/application/use-cases/preempt-reservation.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import { ReservationConflictError, ReservationNotFoundError, ReservationNotScheduledError } from "@/features/reservations/domain/reservations.errors";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

function buildUseCase(context: ReservationsTestContext): PreemptReservationUseCase {
  return new PreemptReservationUseCase(context.repository, TEST_SETTINGS, context.clock, context.createUseCase);
}

function input(reservationId: string, overrides: Partial<PreemptReservationInput> = {}): PreemptReservationInput {
  return { reservationId, actorId: "teacher-1", actorRole: "TEACHER", reason: "Class demo", holderType: "USER", userId: "teacher-1", ...overrides };
}

async function seedStudentReservation(context: ReservationsTestContext, startsAt: Date, endsAt: Date): Promise<Reservation> {
  return await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt, endsAt });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected the promise to reject");
}

describe("PreemptReservationUseCase", () => {
  describe("target checks", () => {
    it("rejects a reservation that does not exist without creating anything", async () => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(buildUseCase(context).execute(input("missing-reservation")));

      expect(error).toBeInstanceOf(ReservationNotFoundError);
      expect(context.repository.rows.size).toBe(0);
    });

    it("rejects a reservation that is no longer scheduled", async () => {
      const context: ReservationsTestContext = buildContext();
      const cancelled: Reservation = await seedStudentReservation(context, at("11:00"), at("12:00"));

      cancelled.cancel("student-2", NOW);

      const error: unknown = await captureError(buildUseCase(context).execute(input(cancelled.id)));

      expect(error).toBeInstanceOf(ReservationNotScheduledError);
      expect(context.repository.rows.size).toBe(1);
      expect(context.auditRecorder.entries).toHaveLength(0);
    });
  });

  describe("default window", () => {
    it("takes over the same window of an upcoming reservation and marks it preempted with the reason", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("11:00"), at("12:00"));

      const created: Reservation = await buildUseCase(context).execute(input(target.id));

      expect([created.startsAt, created.endsAt]).toEqual([at("11:00"), at("12:00")]);
      expect(created.holder.userId).toBe("teacher-1");
      expect(target.status).toBe("PREEMPTED");
      expect([target.preemptedById, target.preemptedReason, target.replacedByReservationId]).toEqual(["teacher-1", "Class demo", created.id]);
      expect(context.eventBus.published.some((event: unknown): boolean => event instanceof ReservationPreemptedEvent)).toBe(true);
    });

    it("starts at the current slot when the reservation already started", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("09:30"), at("10:30"));

      const created: Reservation = await buildUseCase(context).execute(input(target.id));

      expect([created.startsAt, created.endsAt]).toEqual([at("10:00"), at("10:30")]);
      expect(target.status).toBe("PREEMPTED");
    });

    it("rounds a misaligned end up to the next slot boundary", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("11:00"), at("11:20"));

      const created: Reservation = await buildUseCase(context).execute(input(target.id));

      expect(created.endsAt).toEqual(at("11:30"));
    });

    it("caps the new reservation at the maximum duration", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("11:00"), at("14:00"));

      const created: Reservation = await buildUseCase(context).execute(input(target.id));

      expect(created.endsAt.getTime() - created.startsAt.getTime()).toBe(TEST_SETTINGS.maxDurationMinutes * 60_000);
      expect(created.endsAt).toEqual(at("13:00"));
    });

    it("keeps at least one slot when the reservation ends before the current slot", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("08:00"), at("09:00"));

      const created: Reservation = await buildUseCase(context).execute(input(target.id));

      expect([created.startsAt, created.endsAt]).toEqual([at("10:00"), at("10:15")]);
    });
  });

  it("uses an explicit window and holder instead of the defaults", async () => {
    const context: ReservationsTestContext = buildContext();
    const target: Reservation = await seedStudentReservation(context, at("11:00"), at("12:00"));

    const created: Reservation = await buildUseCase(context).execute(
      input(target.id, { holderType: "GROUP", userId: undefined, groupId: "group-1", startsAt: at("11:30"), endsAt: at("12:30"), purpose: "Lab practice" }),
    );

    expect([created.startsAt, created.endsAt]).toEqual([at("11:30"), at("12:30")]);
    expect(created.holder.groupId).toBe("group-1");
    expect(created.purpose).toBe("Lab practice");
    expect(target.status).toBe("PREEMPTED");
  });

  describe("who can preempt", () => {
    it("does not let a student preempt another student", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedStudentReservation(context, at("11:00"), at("12:00"));

      const error: unknown = await captureError(buildUseCase(context).execute(input(target.id, { actorId: "student-1", actorRole: "STUDENT", userId: "student-1" })));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect(target.status).toBe("SCHEDULED");
      expect(context.repository.rows.size).toBe(1);
    });

    it("does not let a teacher preempt another teacher", async () => {
      const context: ReservationsTestContext = buildContext();
      const target: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("teacher-2"),
        createdById: "teacher-2",
        startsAt: at("11:00"),
        endsAt: at("12:00"),
      });

      const error: unknown = await captureError(buildUseCase(context).execute(input(target.id)));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect(target.status).toBe("SCHEDULED");
    });
  });
});
