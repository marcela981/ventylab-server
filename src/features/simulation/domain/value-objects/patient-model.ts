/*
 * Funcionalidad: Modelo de paciente simulado
 * Descripción: Define las condiciones clínicas, los datos demográficos, parámetros calculados, mecánica respiratoria, signos vitales, gasometría y examen físico del paciente simulado, junto con la mecánica normal y los modificadores por condición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
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

export type GenderValue = "M" | "F";

export const GENDER_VALUES: readonly GenderValue[] = ["M", "F"] as const;

export type PatientDifficultyValue = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export const BASIC_DIFFICULTY_VALUE: PatientDifficultyValue = "BASIC";

export const PATIENT_DIFFICULTY_VALUES: readonly PatientDifficultyValue[] = ["BASIC", "INTERMEDIATE", "ADVANCED"] as const;

export type BreathingPatternValue = "normal" | "tachypneic" | "bradypneic" | "irregular" | "paradoxical";

export interface PatientDemographics {
  name?: string;
  weight: number;
  height: number;
  age: number;
  gender: GenderValue;
}

export interface PatientCalculatedParams {
  idealBodyWeight: number;
  bmi: number;
  predictedTidalVolume: { min: number; max: number };
  bodySurfaceArea: number;
}

export interface RespiratoryMechanics {
  compliance: number;
  resistance: number;
  functionalResidualCapacity: number;
  intrinsicPeep: number;
}

export interface VitalSigns {
  heartRate: number;
  respiratoryRate: number;
  spo2: number;
  systolicBP: number;
  diastolicBP: number;
  temperature: number;
}

export interface ArterialBloodGas {
  ph: number;
  pao2: number;
  paco2: number;
  hco3: number;
  baseExcess: number;
  lactate: number;
}

export interface PhysicalExam {
  glasgowScore: number;
  lungAuscultation: string;
  accessoryMuscleUse: boolean;
  breathingPattern: BreathingPatternValue;
}

export interface PatientModel {
  id: string;
  demographics: PatientDemographics;
  calculated: PatientCalculatedParams;
  respiratoryMechanics: RespiratoryMechanics;
  condition: PatientConditionValue;
  vitalSigns: VitalSigns;
  arterialBloodGas?: ArterialBloodGas;
  physicalExam?: PhysicalExam;
  diagnosis?: string;
  difficultyLevel: PatientDifficultyValue;
  createdAt: number;
}

export const NORMAL_RESPIRATORY_MECHANICS: RespiratoryMechanics = {
  compliance: 75,
  resistance: 3,
  functionalResidualCapacity: 2400,
  intrinsicPeep: 0,
};

export const CONDITION_MECHANICS: Readonly<Record<PatientConditionValue, Partial<RespiratoryMechanics>>> = {
  HEALTHY: {},
  ARDS_MILD: { compliance: 40, resistance: 6 },
  ARDS_MODERATE: { compliance: 25, resistance: 8 },
  ARDS_SEVERE: { compliance: 15, resistance: 10 },
  COPD_MILD: { resistance: 8, intrinsicPeep: 2 },
  COPD_MODERATE: { resistance: 12, intrinsicPeep: 5 },
  COPD_SEVERE: { resistance: 18, intrinsicPeep: 8 },
  ASTHMA_MILD: { resistance: 10, intrinsicPeep: 2 },
  ASTHMA_MODERATE: { resistance: 15, intrinsicPeep: 4 },
  ASTHMA_SEVERE: { resistance: 25, intrinsicPeep: 8 },
  PNEUMONIA: { compliance: 35, resistance: 7 },
  PULMONARY_EDEMA: { compliance: 30, resistance: 6 },
  PNEUMOTHORAX: { compliance: 20, resistance: 5 },
  OBESITY_HYPOVENTILATION: { compliance: 40, functionalResidualCapacity: 1800 },
  NEUROMUSCULAR: { compliance: 60 },
  POST_SURGICAL: { compliance: 50, resistance: 5 },
};
