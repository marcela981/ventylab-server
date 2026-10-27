/*
 * Funcionalidad: Pruebas de CreateReservationUseCase
 * Descripción: Verifica quién puede reservar para quién, los límites de reservas futuras, el solapamiento, el desplazamiento por docentes y administradores (detalles del conflicto, reserva desplazada, evento y auditoría) y que 20 creaciones concurrentes de la misma franja bajo el bloqueo produzcan exactamente una reserva; la reserva inmediata (sin alineación, duración máxima, límites, desplazamiento con y sin confirmación, también de la reserva activa) y la vista devuelta a quien crea
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import {
  at,
  TEST_SETTINGS,
  buildContext,
  type ReservationsTestContext,
  seedReservation,
} from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type CreatedReservationResult, RESERVATION_PREEMPTED_AUDIT_ACTION } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationCreatedEvent, ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import {
  InvalidReservationWindowError,
  ReservationConflictError,
  ReservationForbiddenError,
  ReservationHolderNotFoundError,
  ReservationInPastError,
  ReservationLimitReachedError,
  ReservationNotAlignedError,
  ReservationTooLongError,
} from "@/features/reservations/domain/reservations.errors";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

function command(overrides: Partial<ConstructorParameters<typeof CreateReservationCommand>[0]> = {}): CreateReservationCommand {
  return new CreateReservationCommand({
    actorId: "student-1",
    actorRole: "STUDENT",
    holderType: "USER",
    userId: "student-1",
    startsAt: at("11:00"),
    endsAt: at("12:00"),
    confirmPreempt: false,
    ...overrides,
  });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected the promise to reject");
}

describe("CreateReservationUseCase", () => {
  describe("who can reserve", () => {
    it.each<[string, string, Partial<ConstructorParameters<typeof CreateReservationCommand>[0]>]>([
      ["a student for themself", "student-1", { actorId: "student-1", actorRole: "STUDENT" }],
      ["a group leader for their group", "group-1", { actorId: "leader-1", actorRole: "STUDENT", holderType: "GROUP", userId: undefined, groupId: "group-1" }],
      ["a teacher for a supervised group", "group-1", { actorId: "teacher-1", actorRole: "TEACHER", holderType: "GROUP", userId: undefined, groupId: "group-1" }],
      ["an admin for another user", "student-2", { actorId: "admin-1", actorRole: "ADMIN", userId: "student-2" }],
      ["an admin for any group", "group-2", { actorId: "admin-1", actorRole: "ADMIN", holderType: "GROUP", userId: undefined, groupId: "group-2" }],
    ])("lets %s reserve", async (_label: string, holderId: string, overrides: Partial<ConstructorParameters<typeof CreateReservationCommand>[0]>) => {
      const context: ReservationsTestContext = buildContext();

      const reservation: Reservation = await context.createUseCase.execute(command(overrides));

      expect(reservation.holder.userId ?? reservation.holder.groupId).toBe(holderId);
      expect(context.repository.rows.size).toBe(1);
      expect(context.eventBus.published.some((event: unknown): boolean => event instanceof ReservationCreatedEvent)).toBe(true);
    });

    it.each<[string, Partial<ConstructorParameters<typeof CreateReservationCommand>[0]>]>([
      ["a student for another user", { userId: "student-2" }],
      ["a plain member for their group", { actorId: "student-2", holderType: "GROUP", userId: undefined, groupId: "group-1" }],
      ["a teacher for a group they do not supervise", { actorId: "teacher-1", actorRole: "TEACHER", holderType: "GROUP", userId: undefined, groupId: "group-2" }],
      ["a teacher for another user", { actorId: "teacher-1", actorRole: "TEACHER", userId: "student-1" }],
    ])("forbids %s", async (_label: string, overrides: Partial<ConstructorParameters<typeof CreateReservationCommand>[0]>) => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(context.createUseCase.execute(command(overrides)));

      expect(error).toBeInstanceOf(ReservationForbiddenError);
      expect(context.repository.rows.size).toBe(0);
    });

    it("rejects an admin reservation for a missing group", async () => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(
        context.createUseCase.execute(command({ actorId: "admin-1", actorRole: "ADMIN", holderType: "GROUP", userId: undefined, groupId: "ghost" })),
      );

      expect(error).toBeInstanceOf(ReservationHolderNotFoundError);
    });
  });

  describe("calendar rules", () => {
    it("rejects a misaligned window before taking the lock", async () => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(context.createUseCase.execute(command({ startsAt: at("11:05"), endsAt: at("12:00") })));

      expect(error).toBeInstanceOf(ReservationNotAlignedError);
      expect(context.repository.lockedDevices).toEqual([]);
    });

    it("rejects a slot that already ended", async () => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(context.createUseCase.execute(command({ startsAt: at("09:00"), endsAt: at("09:30") })));

      expect(error).toBeInstanceOf(ReservationInPastError);
    });
  });

  describe("limits", () => {
    it("stops a student at the maximum of upcoming reservations", async () => {
      const context: ReservationsTestContext = buildContext();

      await context.createUseCase.execute(command({ startsAt: at("11:00"), endsAt: at("11:15") }));
      await context.createUseCase.execute(command({ startsAt: at("12:00"), endsAt: at("12:15") }));
      await context.createUseCase.execute(command({ startsAt: at("13:00"), endsAt: at("13:15") }));

      const error: unknown = await captureError(context.createUseCase.execute(command({ startsAt: at("14:00"), endsAt: at("14:15") })));

      expect(error).toBeInstanceOf(ReservationLimitReachedError);
      expect(context.repository.rows.size).toBe(3);
    });

    it("does not limit teachers", async () => {
      const context: ReservationsTestContext = buildContext();
      const hours: string[] = ["11", "12", "13", "14", "15"];

      for (const hour of hours) {
        await context.createUseCase.execute(
          command({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1", startsAt: at(`${hour}:00`), endsAt: at(`${hour}:15`) }),
        );
      }

      expect(context.repository.rows.size).toBe(hours.length);
    });
  });

  describe("overlaps and preemption", () => {
    it("rejects a student overlap without exposing who holds the slot", async () => {
      const context: ReservationsTestContext = buildContext();

      await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("11:00"), endsAt: at("12:00") });

      const error: unknown = await captureError(context.createUseCase.execute(command()));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect((error as ReservationConflictError).details.preemptable).toBe(false);
      expect(JSON.stringify((error as ReservationConflictError).details)).not.toMatch(/Bruno|bruno@example.com|student-2/);
    });

    it("tells a teacher who holds the slot when preemption is not confirmed", async () => {
      const context: ReservationsTestContext = buildContext();
      const existing: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forGroup("group-1"),
        createdById: "leader-1",
        startsAt: at("11:00"),
        endsAt: at("12:00"),
      });

      const error: unknown = await captureError(context.createUseCase.execute(command({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1" })));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect((error as ReservationConflictError).code).toBe("reservations.conflict_preemptable");
      expect((error as ReservationConflictError).details).toEqual({
        preemptable: true,
        conflicts: [
          {
            reservationId: existing.id,
            holderType: "GROUP",
            holderRole: "STUDENT",
            holderName: "Group A",
            holderIdentifier: undefined,
            groupName: "Group A",
            startsAt: at("11:00").toISOString(),
            endsAt: at("12:00").toISOString(),
          },
        ],
      });
      expect(existing.status).toBe("SCHEDULED");
    });

    it("preempts a student reservation in one transaction when the teacher confirms", async () => {
      const context: ReservationsTestContext = buildContext();
      const existing: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("student-2"),
        createdById: "student-2",
        startsAt: at("10:00"),
        endsAt: at("11:00"),
      });

      const created: Reservation = await context.createUseCase.execute(
        command({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1", startsAt: at("10:00"), endsAt: at("11:00"), confirmPreempt: true, preemptReason: "Class demo" }),
      );

      const preemptedEvent: ReservationPreemptedEvent | undefined = context.eventBus.published.find(
        (event: unknown): event is ReservationPreemptedEvent => event instanceof ReservationPreemptedEvent,
      );

      expect(existing.status).toBe("PREEMPTED");
      expect([existing.preemptedById, existing.preemptedReason, existing.replacedByReservationId]).toEqual(["teacher-1", "Class demo", created.id]);
      expect(created.status).toBe("SCHEDULED");
      expect(preemptedEvent?.wasActive).toBe(true);
      expect(preemptedEvent?.previousHolder).toEqual({ type: "USER", userId: "student-2", groupId: undefined });
      expect(context.auditRecorder.entries).toHaveLength(1);
      expect(context.auditRecorder.entries[0]).toMatchObject({ actorId: "teacher-1", action: RESERVATION_PREEMPTED_AUDIT_ACTION, targetId: existing.id });
      expect(context.auditRecorder.entries[0].transaction).toBeDefined();
    });

    it("never lets a teacher preempt another teacher", async () => {
      const context: ReservationsTestContext = buildContext();
      const existing: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("teacher-2"),
        createdById: "teacher-2",
        startsAt: at("11:00"),
        endsAt: at("12:00"),
      });

      const error: unknown = await captureError(
        context.createUseCase.execute(command({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1", confirmPreempt: true })),
      );

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect((error as ReservationConflictError).details.preemptable).toBe(false);
      expect(existing.status).toBe("SCHEDULED");
      expect(context.auditRecorder.entries).toHaveLength(0);
    });

    it("lets an admin preempt a teacher", async () => {
      const context: ReservationsTestContext = buildContext();
      const existing: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("teacher-2"),
        createdById: "teacher-2",
        startsAt: at("11:00"),
        endsAt: at("12:00"),
      });

      await context.createUseCase.execute(command({ actorId: "admin-1", actorRole: "ADMIN", userId: "admin-1", confirmPreempt: true }));

      expect(existing.status).toBe("PREEMPTED");
      expect(context.repository.rows.size).toBe(2);
    });
  });

  describe("immediate reservations", () => {
    const IMMEDIATE_NOW: Date = new Date("2026-10-12T10:07:42.500Z");

    function immediate(overrides: Partial<ConstructorParameters<typeof CreateReservationCommand>[0]> = {}): CreateReservationCommand {
      return command({ startsAt: undefined, endsAt: undefined, durationMinutes: 30, ...overrides });
    }

    it("starts now truncated to the minute, without slot alignment", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      const reservation: Reservation = await context.createUseCase.execute(immediate());

      expect(reservation.startsAt.toISOString()).toBe("2026-10-12T10:07:00.000Z");
      expect(reservation.endsAt.toISOString()).toBe("2026-10-12T10:37:00.000Z");
      expect(reservation.isActiveAt(IMMEDIATE_NOW)).toBe(true);
      expect(context.eventBus.published.some((event: unknown): boolean => event instanceof ReservationCreatedEvent)).toBe(true);
    });

    it.each<[string, number | undefined]>([
      ["a duration outside 15, 30, 45 and 60", 20],
      ["a missing duration", undefined],
    ])("rejects %s", async (_label: string, durationMinutes: number | undefined) => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      const error: unknown = await captureError(context.createUseCase.execute(immediate({ durationMinutes })));

      expect(error).toBeInstanceOf(InvalidReservationWindowError);
      expect(context.repository.rows.size).toBe(0);
    });

    it("still applies the maximum duration", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW, { ...TEST_SETTINGS, maxDurationMinutes: 30 });

      const error: unknown = await captureError(context.createUseCase.execute(immediate({ durationMinutes: 45 })));

      expect(error).toBeInstanceOf(ReservationTooLongError);
      expect(context.repository.lockedDevices).toEqual([]);
    });

    it("still applies the student limit of upcoming reservations", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      for (const hour of ["11", "12", "13"]) {
        await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at(`${hour}:00`), endsAt: at(`${hour}:15`) });
      }

      const error: unknown = await captureError(context.createUseCase.execute(immediate()));

      expect(error).toBeInstanceOf(ReservationLimitReachedError);
    });

    it("keeps the holder rules: a plain member cannot reserve for their group", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      const error: unknown = await captureError(
        context.createUseCase.execute(immediate({ actorId: "student-2", holderType: "GROUP", userId: undefined, groupId: "group-1" })),
      );

      expect(error).toBeInstanceOf(ReservationForbiddenError);
    });

    it("rejects a student when the ventilator is reserved right now", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("10:00"), endsAt: at("11:00") });

      const error: unknown = await captureError(context.createUseCase.execute(immediate()));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect((error as ReservationConflictError).details.preemptable).toBe(false);
    });

    it("asks a teacher to confirm before preempting the active reservation", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);
      const active: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("student-2"),
        createdById: "student-2",
        startsAt: at("10:00"),
        endsAt: at("11:00"),
      });

      const error: unknown = await captureError(context.createUseCase.execute(immediate({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1" })));

      expect(error).toBeInstanceOf(ReservationConflictError);
      expect((error as ReservationConflictError).code).toBe("reservations.conflict_preemptable");
      expect((error as ReservationConflictError).details.preemptable).toBe(true);
      expect(active.status).toBe("SCHEDULED");
    });

    it("preempts the active reservation when the teacher confirms", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);
      const active: Reservation = await seedReservation(context.repository, {
        holder: ReservationHolder.forUser("student-2"),
        createdById: "student-2",
        startsAt: at("10:00"),
        endsAt: at("11:00"),
      });

      const created: Reservation = await context.createUseCase.execute(
        immediate({ actorId: "teacher-1", actorRole: "TEACHER", userId: "teacher-1", durationMinutes: 15, confirmPreempt: true }),
      );

      const preemptedEvent: ReservationPreemptedEvent | undefined = context.eventBus.published.find(
        (event: unknown): event is ReservationPreemptedEvent => event instanceof ReservationPreemptedEvent,
      );

      expect(active.status).toBe("PREEMPTED");
      expect(active.replacedByReservationId).toBe(created.id);
      expect(created.startsAt.toISOString()).toBe("2026-10-12T10:07:00.000Z");
      expect(preemptedEvent?.wasActive).toBe(true);
      expect(context.auditRecorder.entries).toHaveLength(1);
      expect(context.auditRecorder.entries[0]).toMatchObject({ actorId: "teacher-1", action: RESERVATION_PREEMPTED_AUDIT_ACTION, targetId: active.id });
    });

    it("returns the created reservation enriched for its creator", async () => {
      const context: ReservationsTestContext = buildContext(IMMEDIATE_NOW);

      const result: CreatedReservationResult = await context.createUseCase.executeWithView(
        immediate({ actorId: "leader-1", holderType: "GROUP", userId: undefined, groupId: "group-1" }),
      );

      expect(result.view.reservation.holder.groupId).toBe("group-1");
      expect(result.view.holderGroup).toEqual({ id: "group-1", name: "Group A" });
      expect(result.view.creator?.id).toBe("leader-1");
      expect(result.viewer).toEqual({ userId: "leader-1", role: "STUDENT", groupIds: ["group-1"] });
    });
  });

  describe("concurrency", () => {
    it("creates exactly one of 20 concurrent reservations for the same slot", async () => {
      const context: ReservationsTestContext = buildContext();
      const actors: string[] = Array.from({ length: 20 }, (_value: unknown, index: number): string => `student-concurrent-${index}`);

      const results: PromiseSettledResult<Reservation>[] = await Promise.allSettled(
        actors.map((actorId: string): Promise<Reservation> => context.createUseCase.execute(command({ actorId, userId: actorId }))),
      );

      const created: PromiseSettledResult<Reservation>[] = results.filter((result: PromiseSettledResult<Reservation>): boolean => result.status === "fulfilled");
      const conflicts: PromiseSettledResult<Reservation>[] = results.filter(
        (result: PromiseSettledResult<Reservation>): boolean => result.status === "rejected" && result.reason instanceof ReservationConflictError,
      );

      expect(created).toHaveLength(1);
      expect(conflicts).toHaveLength(19);
      expect(context.repository.rows.size).toBe(1);
    });
  });
});
