/*
 * Funcionalidad: Pruebas de GetPlatformStatisticsUseCase
 * Descripción: Verifica que el corte de "hoy" sea la medianoche de America/Bogota (05:00 UTC) a ambos lados del cambio de día UTC, que la ventana de estudiantes activos sea de 30 días y que los módulos publicados se tomen de su propio conteo y no del total de módulos activos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GetPlatformStatisticsUseCase } from "@/features/admin/application/use-cases/get-platform-statistics.usecase";
import { type PlatformCounts, type PlatformStatistics } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { type IAdminDashboardRepository } from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { startOfBogotaDay } from "@/features/admin/domain/services/admin-dashboard-calculator";

const COUNTS: PlatformCounts = {
  totalStudents: 10,
  activeStudents: 4,
  totalTeachers: 2,
  totalAdmins: 1,
  totalGroups: 3,
  totalModules: 28,
  publishedModules: 20,
  totalLessons: 31,
  totalEvaluations: 6,
  totalSimulatorSessions: 9,
  completionsToday: 2,
  studentsWithCompletedModule: 5,
  averageProgressPercentage: 41.6,
  recentCompletions: [],
};

describe("startOfBogotaDay", () => {
  it.each([
    ["just before midnight in Bogotá (already the next UTC day)", "2026-11-03T04:59:59.999Z", "2026-11-02T05:00:00.000Z"],
    ["exactly midnight in Bogotá", "2026-11-03T05:00:00.000Z", "2026-11-03T05:00:00.000Z"],
    ["the evening in Bogotá", "2026-11-03T23:30:00.000Z", "2026-11-03T05:00:00.000Z"],
  ])("returns the Bogotá midnight for %s", (_label: string, instant: string, expected: string) => {
    expect(startOfBogotaDay(new Date(instant)).toISOString()).toBe(expected);
  });
});

describe("GetPlatformStatisticsUseCase", () => {
  it("reads the counts from Bogotá midnight with a 30-day active window and keeps published modules apart", async () => {
    const repository: { getPlatformCounts: jest.Mock } = { getPlatformCounts: jest.fn().mockResolvedValue(COUNTS) };
    const useCase: GetPlatformStatisticsUseCase = new GetPlatformStatisticsUseCase(repository as unknown as IAdminDashboardRepository);
    const now: Date = new Date("2026-11-03T02:00:00.000Z");

    const statistics: PlatformStatistics = await useCase.execute(now);

    expect(repository.getPlatformCounts).toHaveBeenCalledWith(new Date("2026-11-02T05:00:00.000Z"), new Date("2026-10-04T02:00:00.000Z"));
    expect(statistics).toEqual(expect.objectContaining({ totalModules: 28, publishedModules: 20, totalLessons: 31, totalEvaluations: 6, completionsToday: 2, averageProgress: 42, generatedAt: now }));
  });
});
