/*
 * Funcionalidad: CSV de analítica
 * Descripción: Columnas y filas de las exportaciones CSV de analítica con la utilidad común toCsv (RFC 4180 y protección contra inyección de fórmulas): notas y progreso de un grupo (una fila por estudiante con progreso global y por sección, promedio y nota vigente por evaluación; encabezados dinámicos saneados a [A-Za-z0-9_-]) y conjunto de datos de investigación en formato largo solo con seudónimos, con las columnas del diccionario de datos de investigación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CsvValue, toCsv } from "@/common/presentation/utils/csv.util";
import {
  type GroupDashboard,
  type ProgressItemSummary,
  type ResearchDatasetRow,
  type StudentDashboardRow,
  type StudentEvaluationGrade,
} from "@/features/analytics/application/results/analytics.results";
import { RESEARCH_CSV_COLUMNS } from "@/features/analytics/presentation/utils/research-export-dictionary";

type CsvRow = Record<string, CsvValue>;

function headerSafe(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

function distinct(values: string[]): string[] {
  return [...new Set<string>(values)];
}

export function toGroupDashboardCsv(dashboard: GroupDashboard): string {
  const sectionIds: string[] = distinct(
    dashboard.students.flatMap((student: StudentDashboardRow) => student.progress.sections.map((section: ProgressItemSummary) => section.id)),
  );
  const evaluationIds: string[] = distinct(
    dashboard.students.flatMap((student: StudentDashboardRow) => student.grades.evaluations.map((grade: StudentEvaluationGrade) => grade.evaluationId)),
  ).sort();
  const sectionColumns: string[] = sectionIds.map((id: string) => `section_${headerSafe(id)}_pct`);
  const gradeColumns: string[] = evaluationIds.map((id: string) => `grade_${headerSafe(id)}`);
  const columns: string[] = ["student_name", "student_email", "overall_progress_pct", ...sectionColumns, "average_grade", ...gradeColumns];

  const rows: CsvRow[] = dashboard.students.map((student: StudentDashboardRow): CsvRow => {
    const row: CsvRow = {
      student_name: student.name,
      student_email: student.email,
      overall_progress_pct: student.progress.overall.percentage,
      average_grade: student.grades.averageGrade ?? undefined,
    };

    for (const section of student.progress.sections) {
      row[`section_${headerSafe(section.id)}_pct`] = section.percentage;
    }

    for (const grade of student.grades.evaluations) {
      row[`grade_${headerSafe(grade.evaluationId)}`] = grade.grade;
    }

    return row;
  });

  return toCsv<CsvRow>(rows, columns);
}

export function toResearchCsv(rows: readonly ResearchDatasetRow[]): string {
  return toCsv<ResearchDatasetRow>(rows, RESEARCH_CSV_COLUMNS);
}
