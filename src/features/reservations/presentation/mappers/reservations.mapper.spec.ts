/*
 * Funcionalidad: Pruebas del presentador de reservas por rol
 * Descripción: Verifica que un estudiante reciba completas sus reservas y las de su grupo y limitadas las ajenas (sin nombres, correos ni identificadores de otras personas), y que un docente reciba titular, identificador, grupo y creador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { at, buildContext, type ReservationsTestContext, seedReservation } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { type ReservationDTO, ReservationDetailDTO, ReservationSummaryDTO } from "@/features/reservations/presentation/dtos/reservation.dto";
import { ReservationsPresentationMapper, type ReservationLabelTranslator } from "@/features/reservations/presentation/mappers/reservations.mapper";

const translate: ReservationLabelTranslator = (key: string, args: Record<string, string>): string =>
  key === "reservations.labels.group_student" ? `Reserved by a student of group ${args.group}` : key;

async function buildViews(context: ReservationsTestContext): Promise<ReservationView[]> {
  await seedReservation(context.repository, { holder: ReservationHolder.forUser("student-1"), createdById: "student-1", startsAt: at("11:00"), endsAt: at("12:00") });
  await seedReservation(context.repository, { holder: ReservationHolder.forGroup("group-1"), createdById: "leader-1", startsAt: at("12:00"), endsAt: at("13:00") });
  await seedReservation(context.repository, { holder: ReservationHolder.forUser("teacher-2"), createdById: "teacher-2", startsAt: at("13:00"), endsAt: at("14:00") });

  return await context.viewsService.toViews(await context.repository.getInRange({ from: at("00:00"), to: at("23:00") }));
}

describe("ReservationsPresentationMapper", () => {
  it("hides other people's data from a student outside the group", async () => {
    const context: ReservationsTestContext = buildContext();
    const views: ReservationView[] = await buildViews(context);
    const viewer: ReservationViewer = { userId: "student-1", role: "STUDENT", groupIds: [] };

    const dtos: ReservationDTO[] = ReservationsPresentationMapper.toDTOList(views, viewer, translate);

    const serialized: string = JSON.stringify(dtos.slice(1));

    expect(dtos[0]).toBeInstanceOf(ReservationDetailDTO);
    expect(dtos.slice(1).every((dto: ReservationDTO): boolean => dto instanceof ReservationSummaryDTO)).toBe(true);
    expect(dtos.slice(1).map((dto: ReservationDTO): string => (dto as ReservationSummaryDTO).label)).toEqual([
      "Reserved by a student of group Group A",
      "reservations.labels.teacher",
    ]);
    expect(serialized).not.toMatch(/Lucia|lucia@example\.com|leader-1|Teresa|teresa@example\.com|teacher-2|group-1/);
    expect(Object.keys(dtos[1]).sort()).toEqual(["endsAt", "id", "label", "labelKey", "startsAt", "status", "visibility"]);
  });

  it("shows the student's own group reservation in full", async () => {
    const context: ReservationsTestContext = buildContext();
    const views: ReservationView[] = await buildViews(context);
    const viewer: ReservationViewer = { userId: "student-2", role: "STUDENT", groupIds: ["group-1"] };

    const dtos: ReservationDTO[] = ReservationsPresentationMapper.toDTOList(views, viewer, translate);

    expect(dtos.map((dto: ReservationDTO): string => dto.visibility)).toEqual(["limited", "full", "limited"]);
    expect(JSON.stringify(dtos[0])).not.toMatch(/Ana|ana@example\.com|student-1/);
  });

  it("shows holder, identifier, group and creator to a teacher", async () => {
    const context: ReservationsTestContext = buildContext();
    const views: ReservationView[] = await buildViews(context);
    const viewer: ReservationViewer = { userId: "teacher-1", role: "TEACHER", groupIds: [] };

    const dtos: ReservationDTO[] = ReservationsPresentationMapper.toDTOList(views, viewer, translate);

    const serialized: string = JSON.stringify(dtos);

    expect(dtos.every((dto: ReservationDTO): boolean => dto instanceof ReservationDetailDTO)).toBe(true);
    expect(serialized).toMatch(/Ana Student/);
    expect(serialized).toMatch(/ana@example\.com/);
    expect(serialized).toMatch(/Group A/);
    expect(serialized).toMatch(/Lucia Leader/);
    expect(serialized).toMatch(/teresa@example\.com/);
  });
});
