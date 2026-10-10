/*
 * Funcionalidad: Propiedades UPPAAL de las reservas del ventilador
 * Descripción: Contrasta la implementación con las consultas de la plantilla VentilatorAccess del modelo ventilab-auth-uppaal.xml (S2 exclusión mutua, BL1 duración acotada, S3 líder de grupo, S7/N1 coherencia de la reserva activa y R3 alcanzabilidad) mediante pruebas ejecutables sobre los casos de uso reales con el repositorio en memoria y su mutex asíncrono; la exclusión mutua usa un generador pseudoaleatorio con semilla sobre oleadas de creaciones y reservas inmediatas concurrentes. Documenta las desviaciones del modelo (30 frente a 120 minutos y reservas individuales de estudiantes). No sustituye a verifyta: es evidencia de prueba, no una verificación de modelos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";
import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import { ReserveNowCommand } from "@/features/reservations/application/commands/reserve-now.command";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import {
  at,
  buildContext,
  buildGroupsFacade,
  NOW,
  type ReservationsTestContext,
  TEST_SETTINGS,
  type TestUser,
  USERS,
} from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationForbiddenError, ReservationTooLongError } from "@/features/reservations/domain/reservations.errors";

const SEED: number = 20261010;
const WAVES: number = 40;
const OPERATIONS_PER_WAVE: number = 12;
const SLOT_MS: number = TEST_SETTINGS.slotMinutes * 60_000;
const MODEL_MAX_RESERVATION_SECONDS: number = 1800;
const GROUP_ID: string = "group-1";
const GROUP_LEADER_ID: string = "leader-1";
const SUPERVISING_TEACHER_ID: string = "teacher-1";

type Random = () => number;

function mulberry32(seed: number): Random {
  let state: number = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t: number = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: Random, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

function randomOperation(context: ReservationsTestContext, random: Random): Promise<unknown> {
  const actor: TestUser = pick(random, USERS);
  const forGroup: boolean = random() < 0.4;

  if (random() < 0.35) {
    return context.reserveNowUseCase.execute(
      new ReserveNowCommand({ userId: actor.id, role: actor.role, durationMinutes: 1 + Math.floor(random() * 150), groupId: forGroup ? GROUP_ID : undefined }),
    );
  }

  const startSlot: number = Math.floor(random() * 32);
  const lengthSlots: number = 1 + Math.floor(random() * 10);
  const startsAt: Date = new Date(at("10:00").getTime() + startSlot * SLOT_MS);

  return context.createUseCase.execute(
    new CreateReservationCommand({
      actorId: actor.id,
      actorRole: actor.role,
      holderType: forGroup ? "GROUP" : "USER",
      userId: forGroup ? undefined : actor.id,
      groupId: forGroup ? GROUP_ID : undefined,
      startsAt,
      endsAt: new Date(startsAt.getTime() + lengthSlots * SLOT_MS),
      confirmPreempt: random() < 0.5,
    }),
  );
}

function scheduled(context: ReservationsTestContext): Reservation[] {
  return [...context.repository.rows.values()].filter((reservation: Reservation): boolean => reservation.isScheduled());
}

function overlappingPairs(reservations: readonly Reservation[]): [string, string][] {
  const pairs: [string, string][] = [];

  reservations.forEach((first: Reservation, index: number): void => {
    for (const second of reservations.slice(index + 1)) {
      if (first.window.overlaps(second.window)) {
        pairs.push([first.id, second.id]);
      }
    }
  });

  return pairs;
}

function buildFacade(context: ReservationsTestContext): ReservationsFacade {
  return new ReservationsFacade(context.repository, context.accessService, context.reserveNowUseCase, context.releaseUseCase, buildGroupsFacade());
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected the promise to reject");
}

describe("UPPAAL VentilatorAccess template (ventilab-auth-uppaal.xml) as executable properties", () => {
  describe("S2 A[] not (ventA.RESERVED and ventB.RESERVED)", () => {
    it("never leaves two overlapping SCHEDULED reservations after 40 waves of 12 seeded concurrent creates and reserve-now calls", async () => {
      const context: ReservationsTestContext = buildContext();
      const random: Random = mulberry32(SEED);
      const unexpected: unknown[] = [];
      let fulfilled: number = 0;

      for (let wave: number = 0; wave < WAVES; wave++) {
        const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
          Array.from({ length: OPERATIONS_PER_WAVE }, (): Promise<unknown> => randomOperation(context, random)),
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            fulfilled++;
          } else if (!(result.reason instanceof DomainError)) {
            unexpected.push(result.reason);
          }
        }

        expect(overlappingPairs(scheduled(context))).toEqual([]);
      }

      expect(unexpected).toEqual([]);
      expect(fulfilled).toBeGreaterThan(0);
      expect(scheduled(context).length).toBeGreaterThan(1);
    });

    it("lets exactly one of two concurrent reserve-now calls from different users hold the ventilator, 50 times", async () => {
      for (let round: number = 0; round < 50; round++) {
        const context: ReservationsTestContext = buildContext();

        const [ventA, ventB]: ReserveNowResult[] = await Promise.all([
          context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: 30 })),
          context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-2", role: "STUDENT", durationMinutes: 30 })),
        ]);

        expect([ventA.kind, ventB.kind].sort()).toEqual(["occupied", "reserved"]);
        expect(scheduled(context)).toHaveLength(1);
      }
    });
  });

  describe("BL1 A[] ventA.RESERVED imply ventA.t_reservation <= 1800 (deviation: model 1800 s = 30 min, code RESERVATION_MAX_DURATION_MINUTES = 120 min by default)", () => {
    it("rejects a scheduled reservation and a reserve-now longer than the configured maximum", async () => {
      const context: ReservationsTestContext = buildContext();
      const tooLongMinutes: number = TEST_SETTINGS.maxDurationMinutes + TEST_SETTINGS.slotMinutes;

      const created: unknown = await captureError(
        context.createUseCase.execute(
          new CreateReservationCommand({
            actorId: "teacher-1",
            actorRole: "TEACHER",
            holderType: "USER",
            userId: "teacher-1",
            startsAt: at("11:00"),
            endsAt: new Date(at("11:00").getTime() + tooLongMinutes * 60_000),
            confirmPreempt: false,
          }),
        ),
      );
      const now: unknown = await captureError(
        context.reserveNowUseCase.execute(new ReserveNowCommand({ userId: "student-1", role: "STUDENT", durationMinutes: TEST_SETTINGS.maxDurationMinutes + 1 })),
      );

      expect(created).toBeInstanceOf(ReservationTooLongError);
      expect(now).toBeInstanceOf(ReservationTooLongError);
      expect(context.repository.rows.size).toBe(0);
    });

    it("keeps every reservation produced by 40 seeded concurrent waves within the configured maximum duration", async () => {
      const context: ReservationsTestContext = buildContext();
      const random: Random = mulberry32(SEED + 1);

      for (let wave: number = 0; wave < WAVES; wave++) {
        await Promise.allSettled(Array.from({ length: OPERATIONS_PER_WAVE }, (): Promise<unknown> => randomOperation(context, random)));
      }

      const durations: number[] = [...context.repository.rows.values()].map((reservation: Reservation): number => reservation.window.durationMinutes);

      expect(durations.length).toBeGreaterThan(0);
      expect(Math.max(...durations)).toBeLessThanOrEqual(TEST_SETTINGS.maxDurationMinutes);
      expect(TEST_SETTINGS.maxDurationMinutes * 60).toBeGreaterThan(MODEL_MAX_RESERVATION_SECONDS);
    });
  });

  describe("S3 A[] ventilator_reserved imply (authenticated and is_group_leader) (deviation: students may reserve for themselves)", () => {
    it("forbids a plain member from reserving for their group", async () => {
      const context: ReservationsTestContext = buildContext();

      const error: unknown = await captureError(
        context.createUseCase.execute(
          new CreateReservationCommand({
            actorId: "student-2",
            actorRole: "STUDENT",
            holderType: "GROUP",
            groupId: GROUP_ID,
            startsAt: at("11:00"),
            endsAt: at("12:00"),
            confirmPreempt: false,
          }),
        ),
      );

      expect(error).toBeInstanceOf(ReservationForbiddenError);
      expect(context.repository.rows.size).toBe(0);
    });

    it("turns a plain member's legacy reserve-now for their group into a reservation for themself", async () => {
      const context: ReservationsTestContext = buildContext();

      const result: ReserveNowResult = await context.reserveNowUseCase.execute(
        new ReserveNowCommand({ userId: "student-2", role: "STUDENT", durationMinutes: 30, groupId: GROUP_ID }),
      );

      expect(result.kind).toBe("reserved");
      expect(scheduled(context)[0].holder.toSnapshot()).toEqual({ type: "USER", userId: "student-2", groupId: undefined });
    });

    it("only creates group reservations by the group leader, a supervising teacher or an administrator across 40 seeded concurrent waves", async () => {
      const context: ReservationsTestContext = buildContext();
      const random: Random = mulberry32(SEED + 2);
      const allowedGroupCreators: string[] = [GROUP_LEADER_ID, SUPERVISING_TEACHER_ID, "admin-1"];

      for (let wave: number = 0; wave < WAVES; wave++) {
        await Promise.allSettled(Array.from({ length: OPERATIONS_PER_WAVE }, (): Promise<unknown> => randomOperation(context, random)));
      }

      const groupReservations: Reservation[] = [...context.repository.rows.values()].filter(
        (reservation: Reservation): boolean => reservation.holder.groupId !== undefined,
      );

      expect(groupReservations.length).toBeGreaterThan(0);
      expect(groupReservations.every((reservation: Reservation): boolean => allowedGroupCreators.includes(reservation.createdById))).toBe(true);
    });

    it("lets a student reserve for themself, which the model does not allow", async () => {
      const context: ReservationsTestContext = buildContext();

      const reservation: Reservation = await context.createUseCase.execute(
        new CreateReservationCommand({
          actorId: "student-1",
          actorRole: "STUDENT",
          holderType: "USER",
          userId: "student-1",
          startsAt: at("11:00"),
          endsAt: at("12:00"),
          confirmPreempt: false,
        }),
      );

      expect(reservation.holder.toSnapshot()).toEqual({ type: "USER", userId: "student-1", groupId: undefined });
    });
  });

  describe("S7/N1 A[] (ventA.RESERVED imply ventilator_reserved) and R3 E<> ventA.RESERVED", () => {
    it("derives the active reservation from the same row, so reserving and releasing are always coherent", async () => {
      const context: ReservationsTestContext = buildContext();
      const facade: ReservationsFacade = buildFacade(context);

      const reserved: ReserveNowResult = await facade.reserveNow({ userId: "student-1", role: "STUDENT", durationMinutes: 30 });
      const activeWhileReserved: ActiveReservationSummary | undefined = await facade.getActiveReservation(NOW);
      const released: ReleasedReservationResult | undefined = await facade.releaseActive("student-1", "STUDENT");
      const activeAfterRelease: ActiveReservationSummary | undefined = await facade.getActiveReservation(NOW);

      expect(reserved.kind).toBe("reserved");
      expect(activeWhileReserved?.id).toBe(reserved.kind === "reserved" ? reserved.reservationId : undefined);
      expect(released?.reservationId).toBe(activeWhileReserved?.id);
      expect(activeAfterRelease).toBeUndefined();
      expect(scheduled(context)).toEqual([]);
    });
  });
});
