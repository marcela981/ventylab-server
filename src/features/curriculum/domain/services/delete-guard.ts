/*
 * Funcionalidad: Guarda de eliminación del contenido curricular
 * Descripción: Decide si un subárbol curricular puede eliminarse físicamente o si debe archivarse porque la entidad o algún descendiente tiene datos de estudiantes (progreso de módulo, lecciones completadas, progreso de páginas, intentos de quiz o notas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface StudentDataCounts {
  readonly userProgress: number;
  readonly lessonCompletions: number;
  readonly pageProgress: number;
  readonly quizAttempts: number;
  readonly notes: number;
}

export type DeleteDecision = "hard_delete" | "archive_required";

export const HARD_DELETE_DECISION: DeleteDecision = "hard_delete";
export const ARCHIVE_REQUIRED_DECISION: DeleteDecision = "archive_required";

export function totalStudentData(counts: StudentDataCounts): number {
  return counts.userProgress + counts.lessonCompletions + counts.pageProgress + counts.quizAttempts + counts.notes;
}

export function decideDeletion(counts: StudentDataCounts): DeleteDecision {
  return totalStudentData(counts) > 0 ? ARCHIVE_REQUIRED_DECISION : HARD_DELETE_DECISION;
}
