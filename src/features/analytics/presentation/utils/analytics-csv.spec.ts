/*
 * Funcionalidad: Pruebas del CSV de analítica
 * Descripción: Verifica las columnas dinámicas del CSV de un grupo (progreso por sección y nota por evaluación con encabezados saneados), las celdas vacías cuando falta un dato y la protección contra inyección de fórmulas en nombres
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupDashboard, type StudentDashboardRow } from "@/features/analytics/application/results/analytics.results";
import { toGroupDashboardCsv } from "@/features/analytics/presentation/utils/analytics-csv";

function row(overrides: Partial<StudentDashboardRow>): StudentDashboardRow {
  return {
    userId: "student-1",
    name: "Ana",
    email: "ana@example.edu",
    progress: { overall: { completedLessons: 1, totalLessons: 2, percentage: 50, completed: false }, sections: [], levels: [], modules: [] },
    grades: { averageGrade: null, evaluations: [] },
    simulation: { sessionCount: 0, averageScore: null, averageTimeToStabilizeSeconds: null },
    aiUsage: [],
    ventilatorHours: 0,
    ...overrides,
  };
}

describe("toGroupDashboardCsv", () => {
  it("writes one row per student with dynamic section and grade columns", () => {
    const dashboard: GroupDashboard = {
      groupId: "group-1",
      groupName: "Group A",
      generatedAt: new Date("2026-10-11T12:00:00.000Z"),
      students: [
        row({
          name: "=HYPERLINK(\"x\")",
          progress: {
            overall: { completedLessons: 1, totalLessons: 2, percentage: 50, completed: false },
            sections: [{ id: "sec.1", percentage: 50, completedLessons: 1, totalLessons: 2, completed: false }],
            levels: [],
            modules: [],
          },
          grades: {
            averageGrade: 4,
            evaluations: [{ evaluationId: "evaluation-1", evaluationTitle: "Exam", attemptNumber: 1, grade: 4, passed: true, publishedAt: new Date() }],
          },
        }),
        row({ userId: "student-2", name: "Luis", email: "luis@example.edu" }),
      ],
    };

    const lines: string[] = toGroupDashboardCsv(dashboard).trimEnd().split("\r\n");

    expect(lines[0]).toBe("student_name,student_email,overall_progress_pct,section_sec_1_pct,average_grade,grade_evaluation-1");
    expect(lines[1]).toBe("\"'=HYPERLINK(\"\"x\"\")\",ana@example.edu,50,50,4,4");
    expect(lines[2]).toBe("Luis,luis@example.edu,50,,,");
  });
});
