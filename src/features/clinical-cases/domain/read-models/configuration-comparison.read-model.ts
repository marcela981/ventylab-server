/*
 * Funcionalidad: Modelos de comparación de configuraciones
 * Descripción: Estructuras de la configuración del ventilador del estudiante, la configuración experta, la comparación por parámetro y la retroalimentación de evaluación; se guardan tal cual en evaluation_attempts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ErrorClassification = "correcto" | "menor" | "moderado" | "critico";

export interface AcceptableRange {
  min: number;
  max: number;
}

export interface VentilatorConfiguration {
  ventilationMode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  fio2?: number;
  maxPressure?: number;
  iERatio?: string;
}

export interface ExpertConfigurationData {
  id: string;
  ventilationMode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  fio2?: number;
  maxPressure?: number;
  iERatio?: string;
  justification: string;
  acceptableRanges?: Record<string, AcceptableRange>;
  parameterPriorities?: Record<string, string>;
}

export interface ParameterComparison {
  parameter: string;
  userValue: number | string | undefined;
  expertValue: number | string | undefined;
  difference: number | null;
  differencePercent: number | null;
  withinRange: boolean;
  errorClassification: ErrorClassification;
  priority: string;
  acceptableRange?: AcceptableRange;
}

export interface ComparisonSummary {
  correct: number;
  minor: number;
  moderate: number;
  critical: number;
}

export interface ConfigurationComparison {
  score: number;
  totalParameters: number;
  correctParameters: number;
  parameters: ParameterComparison[];
  criticalErrors: string[];
  summary: ComparisonSummary;
}

export interface EvaluationFeedback {
  feedback: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  safetyConcerns?: string[];
}
