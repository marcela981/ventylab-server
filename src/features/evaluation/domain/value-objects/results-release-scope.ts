/*
 * Funcionalidad: Alcance de la liberación de resultados
 * Descripción: Qué libera el docente al estudiante sobre un intento calificado: solo la nota (GRADE: puntaje, nota y aprobado) o la nota con las respuestas (GRADE_AND_ANSWERS: además las respuestas correctas, las explicaciones, las rúbricas, el puntaje por pregunta y la retroalimentación IA). Hasta la liberación el estudiante no recibe ninguno de esos datos en ningún tipo de evaluación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ResultsReleaseScopeValue = "GRADE" | "GRADE_AND_ANSWERS";

export const GRADE_RELEASE_SCOPE: ResultsReleaseScopeValue = "GRADE";
export const GRADE_AND_ANSWERS_RELEASE_SCOPE: ResultsReleaseScopeValue = "GRADE_AND_ANSWERS";

export const RESULTS_RELEASE_SCOPE_VALUES: readonly ResultsReleaseScopeValue[] = [GRADE_RELEASE_SCOPE, GRADE_AND_ANSWERS_RELEASE_SCOPE] as const;

export function releasesAnswers(scope: ResultsReleaseScopeValue): boolean {
  return scope === GRADE_AND_ANSWERS_RELEASE_SCOPE;
}
