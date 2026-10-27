/*
 * Funcionalidad: Paciente simulado propio
 * Descripción: Datos del formulario "Simular paciente" (los de julio): demografía, condición principal, dificultad (solo etiqueta), diagnóstico, alergias, antecedentes y signos vitales iniciales, con las condiciones, dificultades y patrones respiratorios admitidos
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientSex } from "@/features/simulation/domain/engine";

/** Main conditions of the July patient form (legacy PatientCondition) */
export type PatientConditionValue =
  | "HEALTHY"
  | "ARDS_MILD"
  | "ARDS_MODERATE"
  | "ARDS_SEVERE"
  | "COPD_MILD"
  | "COPD_MODERATE"
  | "COPD_SEVERE"
  | "ASTHMA_MILD"
  | "ASTHMA_MODERATE"
  | "ASTHMA_SEVERE"
  | "PNEUMONIA"
  | "PULMONARY_EDEMA"
  | "PNEUMOTHORAX"
  | "OBESITY_HYPOVENTILATION"
  | "NEUROMUSCULAR"
  | "POST_SURGICAL";

export const PATIENT_CONDITION_VALUES: readonly PatientConditionValue[] = [
  "HEALTHY",
  "ARDS_MILD",
  "ARDS_MODERATE",
  "ARDS_SEVERE",
  "COPD_MILD",
  "COPD_MODERATE",
  "COPD_SEVERE",
  "ASTHMA_MILD",
  "ASTHMA_MODERATE",
  "ASTHMA_SEVERE",
  "PNEUMONIA",
  "PULMONARY_EDEMA",
  "PNEUMOTHORAX",
  "OBESITY_HYPOVENTILATION",
  "NEUROMUSCULAR",
  "POST_SURGICAL",
] as const;

/** Label only: it does not change the simulation (decision of 2026-10-26) */
export type PatientDifficultyValue = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export const PATIENT_DIFFICULTY_VALUES: readonly PatientDifficultyValue[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export type PatientBreathingPatternValue = "normal" | "tachypneic" | "bradypneic" | "irregular" | "paradoxical";

export const PATIENT_BREATHING_PATTERN_VALUES: readonly PatientBreathingPatternValue[] = ["normal", "tachypneic", "bradypneic", "irregular", "paradoxical"] as const;

export interface SimulatedPatientVitals {
  readonly heartRateBpm?: number;
  readonly respiratoryRateBpm: number;
  readonly spo2Percent: number;
  readonly temperatureC?: number;
  readonly systolicMmHg?: number;
  readonly diastolicMmHg?: number;
  readonly glasgow?: number;
  readonly breathingPattern?: PatientBreathingPatternValue;
}

export interface SimulatedPatient {
  readonly displayName?: string;
  readonly ageYears: number;
  readonly sex: PatientSex;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly condition: PatientConditionValue;
  readonly difficulty: PatientDifficultyValue;
  readonly diagnosis?: string;
  readonly allergies?: readonly string[];
  readonly history?: readonly string[];
  readonly vitals: SimulatedPatientVitals;
}
