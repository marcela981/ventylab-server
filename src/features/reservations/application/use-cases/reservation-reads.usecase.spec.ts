/*
 * Funcionalidad: Pruebas de las lecturas de reservas
 * Descripción: Verifica la reserva vigente (sin reserva activa no hay control; controla el titular, un miembro del grupo titular o un docente o administrador, no otro estudiante), las reservas propias (como titular, creador o por el grupo del usuario, solo las que no terminaron) y el calendario (rango vacío, invertido, inválido o mayor a 31 días rechazado; incluye las reservas que tocan el rango y el observador con su grupo; el filtro por grupo titular solo para el administrador, el docente que lo supervisa o un miembro, 403 para los demás); la relación de quien consulta con la reserva activa
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurrentReservationResult } from "@/features/reservations/application/results/current-reservation.result";
import { type ReservationViewsResult } from "@/features/reservations/application/results/reservation-views.result";
import { at, buildContext, type ReservationsTestContext, seedReservation } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { GetCurrentReservationUseCase } from "@/features/reservations/application/use-cases/get-current-reservation.usecase";
import { GetMyReservationsUseCase } from "@/features/reservations/application/use-cases/get-my-reservations.usecase";
import { GetReservationsCalendarUseCase, MAX_CALENDAR_RANGE_DAYS } from "@/features/reservations/application/use-cases/get-reservations-calendar.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationView } from "@/features/reservations/domain/read-models/reservation.read-model";
import { InvalidReservationRangeError, ReservationGroupFilterForbiddenError } from "@/features/reservations/domain/reservations.errors";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

function ids(views: ReservationView[]): string[] {
  return views.map((view: ReservationView): string => view.reservation.id);
}

describe("GetCurrentReservationUseCase", () => {
  function build(context: ReservationsTestContext): GetCurrentReservationUseCase {
    return new GetCurrentReservationUseCase(context.repository, context.clock, context.accessService, context.viewsService);
  }

  it("grants no control when no reservation is active", async () => {
    const context: ReservationsTestContext = buildContext();

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("11:00"), endsAt: at("12:00") });

    const result: CurrentReservationResult = await build(context).execute("student-1", "STUDENT");

    expect(result).toEqual({ canControl: false, relation: "none", viewer: { userId: "student-1", role: "STUDENT", groupIds: [] } });
  });

  it.each<[string, string, string, boolean, string]>([
    ["a member of the holder group", "student-2", "STUDENT", true, "group_member"],
    ["the group leader", "leader-1", "STUDENT", true, "group_leader"],
    ["a student outside the group", "student-1", "STUDENT", false, "none"],
    ["a teacher", "teacher-2", "TEACHER", true, "none"],
    ["an admin", "admin-1", "ADMIN", true, "none"],
  ])("lets %s control the active group reservation: %s", async (_label: string, actorId: string, actorRole: string, expected: boolean, relation: string) => {
    const context: ReservationsTestContext = buildContext();
    const active: Reservation = await seedReservation(context.repository, {
      holder: ReservationHolder.forGroup("group-1"),
      createdById: "leader-1",
      startsAt: at("10:00"),
      endsAt: at("11:00"),
    });

    const result: CurrentReservationResult = await build(context).execute(actorId, actorRole);

    expect(result.view?.reservation.id).toBe(active.id);
    expect(result.canControl).toBe(expected);
    expect(result.relation).toBe(relation);
  });

  it("tells the holder and the creator of a personal reservation apart", async () => {
    const context: ReservationsTestContext = buildContext();

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "admin-1", startsAt: at("10:00"), endsAt: at("10:30") });

    expect((await build(context).execute("student-1", "STUDENT")).relation).toBe("holder");
    expect((await build(context).execute("admin-1", "ADMIN")).relation).toBe("creator");
  });

  it("lets only the holder student control an active personal reservation", async () => {
    const context: ReservationsTestContext = buildContext();

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("10:00"), endsAt: at("10:30") });

    expect((await build(context).execute("student-1", "STUDENT")).canControl).toBe(true);
    expect((await build(context).execute("student-2", "STUDENT")).canControl).toBe(false);
  });
});

describe("GetMyReservationsUseCase", () => {
  it("lists upcoming reservations the user holds, created or holds through their group", async () => {
    const context: ReservationsTestContext = buildContext();
    const own: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("11:00"), endsAt: at("11:30") });
    const ofGroup: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forGroup("group-1"), createdById: "leader-1", startsAt: at("12:00"), endsAt: at("12:30") });

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("08:00"), endsAt: at("09:00") });
    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("13:00"), endsAt: at("13:30") });

    const result: ReservationViewsResult = await new GetMyReservationsUseCase(context.repository, context.clock, context.accessService, context.viewsService).execute(
      "student-2",
      "STUDENT",
    );

    expect(ids(result.views)).toEqual([own.id, ofGroup.id]);
    expect(result.viewer.groupIds).toEqual(["group-1"]);
  });
});

describe("GetReservationsCalendarUseCase", () => {
  function build(context: ReservationsTestContext): GetReservationsCalendarUseCase {
    return new GetReservationsCalendarUseCase(context.repository, context.accessService, context.viewsService);
  }

  it.each<[string, Date, Date]>([
    ["an empty range", at("10:00"), at("10:00")],
    ["an inverted range", at("12:00"), at("10:00")],
    ["an invalid date", new Date("not a date"), at("10:00")],
    ["a range longer than the maximum", at("00:00"), new Date(at("00:00").getTime() + (MAX_CALENDAR_RANGE_DAYS + 1) * 86_400_000)],
  ])("rejects %s", async (_label: string, from: Date, to: Date) => {
    const context: ReservationsTestContext = buildContext();

    await expect(build(context).execute({ from, to, actorId: "student-1", actorRole: "STUDENT" })).rejects.toBeInstanceOf(InvalidReservationRangeError);
  });

  it("returns the reservations that overlap the range with the viewer", async () => {
    const context: ReservationsTestContext = buildContext();
    const inside: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("11:00"), endsAt: at("12:00") });
    const crossing: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("13:30"), endsAt: at("14:30") });

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("teacher-1"), createdById: "teacher-1", startsAt: at("15:00"), endsAt: at("16:00") });

    const result: ReservationViewsResult = await build(context).execute({ from: at("10:00"), to: at("14:00"), actorId: "leader-1", actorRole: "STUDENT" });

    expect(ids(result.views)).toEqual([inside.id, crossing.id]);
    expect(result.viewer).toEqual({ userId: "leader-1", role: "STUDENT", groupIds: ["group-1"] });
  });

  it.each<[string, string, string]>([
    ["an admin", "admin-1", "ADMIN"],
    ["a supervising teacher", "teacher-1", "TEACHER"],
    ["a member student", "student-2", "STUDENT"],
  ])("lists only the reservations held by the requested group for %s", async (_label: string, actorId: string, actorRole: string) => {
    const context: ReservationsTestContext = buildContext();
    const ofGroup: Reservation = await seedReservation(context.repository, { holder: ReservationHolder.forGroup("group-1"), createdById: "leader-1", startsAt: at("11:00"), endsAt: at("12:00") });

    await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-2"), createdById: "student-2", startsAt: at("12:00"), endsAt: at("13:00") });

    const result: ReservationViewsResult = await build(context).execute({ from: at("10:00"), to: at("14:00"), actorId, actorRole, groupId: "group-1" });

    expect(ids(result.views)).toEqual([ofGroup.id]);
  });

  it.each<[string, string, string]>([
    ["a teacher who does not supervise it", "teacher-2", "TEACHER"],
    ["a student outside it", "student-9", "STUDENT"],
  ])("rejects the group filter for %s", async (_label: string, actorId: string, actorRole: string) => {
    const context: ReservationsTestContext = buildContext();

    await expect(build(context).execute({ from: at("10:00"), to: at("14:00"), actorId, actorRole, groupId: "group-1" })).rejects.toBeInstanceOf(
      ReservationGroupFilterForbiddenError,
    );
  });
});
