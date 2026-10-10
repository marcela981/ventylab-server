/*
 * Funcionalidad: Errores de la calificación de simulaciones
 * Descripción: Errores tipados que lanza la calificación por rúbrica cuando la rúbrica no supera la validación o el contexto de calificación (uso de asistencia de IA) es inválido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type SimulationRubricIssueCode =
  | "INVALID_SHAPE"
  | "UNKNOWN_CRITERION"
  | "DUPLICATE_CRITERION"
  | "NON_POSITIVE_WEIGHT"
  | "ZERO_TOTAL_WEIGHT"
  | "INVALID_THRESHOLD"
  | "INVALID_PARAM"
  | "INVALID_ASSISTANCE_POLICY";

export interface SimulationRubricIssue {
  readonly code: SimulationRubricIssueCode;
  readonly field: string;
  readonly message: string;
}

export class InvalidSimulationRubricError extends Error {
  public readonly issues: readonly SimulationRubricIssue[];

  public constructor(issues: readonly SimulationRubricIssue[]) {
    super(`Invalid simulation rubric: ${issues.map((issue: SimulationRubricIssue): string => issue.message).join("; ")}`);
    this.name = "InvalidSimulationRubricError";
    this.issues = issues;
  }
}

export class InvalidScoringContextError extends Error {
  public readonly field: string;

  public constructor(field: string, message: string) {
    super(message);
    this.name = "InvalidScoringContextError";
    this.field = field;
  }
}
