/*
 * Funcionalidad: Pruebas de la reserva inmediata, liberación y cancelación
 * Descripción: Verifica la reserva inmediata heredada (creación, recuperación del mismo usuario, ocupación y caída a reserva propia sin permiso sobre el grupo), la liberación de la reserva activa por quien puede hacerlo y la cancelación por creador o administrador
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CancelReservationCommand } from "@/features/reservations/application/commands/cancel-reservation.command";
import { ReserveNowCommand } from "@/features/reservations/application/commands/reserve-now.command";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { at, buildContext, NOW, type ReservationsTestContext, seedReservation } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationCancelForbiddenError, ReservationLimitReachedError } from "@/features/reservations/domain/reservations.errors";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

describe("legacy reservation adapters", () => {
  it("reserves now and recovers the same user's active reservation", async () => {
    const context: ReservationsTestContext = buildContext();

    const first: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }));
    const second: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }));

    expect(first).toMatchObject({ kind: "reserved", recovered: false, holderUserId: "student-1", holderName: "Ana Student", startsAt: NOW });
    expect(second).toMatchObject({ kind: "reserved", recovered: true });
    expect(context.repository.rows.size).toBe(1);
  });

  it("reports the ventilator as occupied by another holder", async () => {
    const context: ReservationsTestContext = buildContext();

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("10:00"), endsAt: at("11:00") });

    const result: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }));

    expect(result).toEqual({ kind: "occupied" });
  });

  it("falls back to a reservation for the caller when they cannot reserve for the group", async () => {
    const context: ReservationsTestContext = buildContext();

    const result: ReserveNowResult = await context.reserveNowUseCase.execute(
      new ReserveNowCommand({ userId: "student-2", role: "STUDENT", durationMinutes: 30, groupId: "group-1" }),
    );

    expect(result).toMatchObject({ kind: "reserved", groupId: undefined, holderUserId: "student-2" });
  });

  it("releases the active group reservation for a member and completes it now", async () => {
    const context: ReservationsTestContext = buildContext();
    const active: Reservation = await seedReservation(context.repository, {
      holder: ReservationHolder.forGroup("group-1"),
      createdById: "leader-1",
      startsAt: at("10:00"),
      endsAt: at("11:00"),
    });

    const released: ReleasedReservationResult | undefined = await context.releaseUseCase.execute("student-2", "STUDENT");

    expect(released).toEqual({ reservationId: active.id, holderUserId: "leader-1", groupId: "group-1" });
    expect([active.status, active.endsAt]).toEqual(["COMPLETED", NOW]);
  });

  it("does not release someone else's reservation", async () => {
    const context: ReservationsTestContext = buildContext();
    const active: Reservation = await seedReservation(context.repository, {
      holder: ReservationHolder.forUser("student-2"),
      createdById: "student-2",
      startsAt: at("10:00"),
      endsAt: at("11:00"),
    });

    const released: ReleasedReservationResult | undefined = await context.releaseUseCase.execute("student-1", "STUDENT");

    expect(released).toBeUndefined();
    expect(active.status).toBe("SCHEDULED");
  });

  it("lets the creator or an admin cancel and forbids anyone else", async () => {
    const context: ReservationsTestContext = buildContext();
    const own: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("11:00"), endsAt: at("12:00") });
    const other: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("12:00"), endsAt: at("13:00") });

    await context.cancelUseCase.execute(new CancelReservationCommand({ reservationId: own.id, actorId: "student-1", actorRole: "STUDENT" }));

    const forbidden: Promise<void> = context.cancelUseCase.execute(new CancelReservationCommand({ reservationId: other.id, actorId: "student-1", actorRole: "STUDENT" }));

    await expect(forbidden).rejects.toBeInstanceOf(ReservationCancelForbiddenError);

    await context.cancelUseCase.execute(new CancelReservationCommand({ reservationId: other.id, actorId: "admin-1", actorRole: "ADMIN" }));

    expect([own.status, other.status]).toEqual(["CANCELLED", "CANCELLED"]);
  });

  describe("upcoming reservation limits", () => {
    async function seedUpcoming(context: ReservationsTestContext, holder: ReservationHolder, createdById: string, count: number): Promise<void> {
      for (let index: number = 0; index < count; index++) {
        await seedReservation(context.repository, { holder, createdById, startsAt: at(`${12 + index}:00`), endsAt: at(`${12 + index}:30`) });
      }
    }

    it("rejects a student who already has the maximum number of upcoming reservations", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedUpcoming(context, ReservationHolder.forUser("student-1"), "student-1", 3);

      await expect(context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }))).rejects.toBeInstanceOf(ReservationLimitReachedError);
      expect(context.repository.rows.size).toBe(3);
    });

    it("rejects a group reservation when the group already has the maximum number of upcoming reservations", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedUpcoming(context, ReservationHolder.forGroup("group-1"), "student-2", 5);

      await expect(
        context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "leader-1", role: "STUDENT", durationMinutes: 30, groupId: "group-1" })),
      ).rejects.toBeInstanceOf(ReservationLimitReachedError);
    });

    it("exempts teachers from the upcoming limits", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedUpcoming(context, ReservationHolder.forUser("teacher-1"), "teacher-1", 4);

      const result: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "teacher-1", role: "TEACHER", durationMinutes: 30 }));

      expect(result).toMatchObject({ kind: "reserved", recovered: false });
    });

    it("still recovers the caller's active reservation when they are at the limit", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedUpcoming(context, ReservationHolder.forUser("student-1"), "student-1", 2);
      await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("10:00"), endsAt: at("10:30") });

      const result: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }));

      expect(result).toMatchObject({ kind: "reserved", recovered: true });
    });

    it("answers occupied when the caller's own future reservation overlaps the requested window", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("10:30"), endsAt: at("11:00") });

      const result: ReserveNowResult = await context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 }));

      expect(result).toEqual({ kind: "occupied" });
    });
  });
});
