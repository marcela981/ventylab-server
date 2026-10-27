/*
 * Funcionalidad: Ajustes del motor para el paciente simulado propio
 * Descripción: Servicio de dominio puro y versionado que traduce el formulario del paciente propio en ajustes absolutos del caso base: compliance y resistencia por condición con los valores de julio (compliance −0,5 por año sobre 60 y −1 % por punto de IMC sobre 30, mínimo 15), sexo, edad, peso y talla, frecuencia respiratoria inicial del ventilador, PaO2 inicial por la inversa de Severinghaus a partir de la SpO2 y PAM basal desde PAS/PAD, todo acotado a los rangos fisiológicos de los casos; elige el caso base por condición. FC, temperatura, Glasgow, nombre, diagnóstico, alergias, antecedentes, patrón respiratorio y dificultad solo se muestran
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CLINICAL_CASE_PHYSIOLOGICAL_RANGES, type PhysiologicalParameter } from "@/features/clinical-cases/domain/clinical-case-physiological-ranges";
import { type PatientSex } from "@/features/simulation/domain/engine";
import { type PatientConditionValue, type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";

/** Bump it whenever the mapping changes: stored sessions keep the overrides they were started with */
export const PATIENT_MAPPING_VERSION: number = 1;

export const ENGINE_NORMAL_LUNG_CASE_ID: string = "engine-normal-lung";
export const ENGINE_ASTHMA_CASE_ID: string = "engine-asthma-crisis";
export const ENGINE_OBESE_ARDS_CASE_ID: string = "engine-ards-obese";
export const JULY_PNEUMONIA_CASE_ID: string = "july-neumonia-grave";
export const JULY_COPD_CASE_ID: string = "july-epoc-descompensado";
export const JULY_ARDS_CASE_ID: string = "july-sdra-sepsis";

/** Published case whose gas exchange, events, targets and rubric the patient inherits (DISENO_BLOQUE1.md, Anexo A) */
export const BASE_CASE_BY_CONDITION: Readonly<Record<PatientConditionValue, string>> = {
  HEALTHY: ENGINE_NORMAL_LUNG_CASE_ID,
  NEUROMUSCULAR: ENGINE_NORMAL_LUNG_CASE_ID,
  POST_SURGICAL: ENGINE_NORMAL_LUNG_CASE_ID,
  ARDS_MILD: JULY_ARDS_CASE_ID,
  ARDS_MODERATE: JULY_ARDS_CASE_ID,
  ARDS_SEVERE: JULY_ARDS_CASE_ID,
  PULMONARY_EDEMA: JULY_ARDS_CASE_ID,
  PNEUMOTHORAX: JULY_ARDS_CASE_ID,
  COPD_MILD: JULY_COPD_CASE_ID,
  COPD_MODERATE: JULY_COPD_CASE_ID,
  COPD_SEVERE: JULY_COPD_CASE_ID,
  ASTHMA_MILD: ENGINE_ASTHMA_CASE_ID,
  ASTHMA_MODERATE: ENGINE_ASTHMA_CASE_ID,
  ASTHMA_SEVERE: ENGINE_ASTHMA_CASE_ID,
  PNEUMONIA: JULY_PNEUMONIA_CASE_ID,
  OBESITY_HYPOVENTILATION: ENGINE_OBESE_ARDS_CASE_ID,
};

interface ConditionMechanics {
  readonly complianceMlPerCmH2O: number;
  readonly resistanceCmH2OPerLps: number;
}

// July normal mechanics and condition values (legacy patient.constants.ts), kept verbatim; pending clinical validation
// for an intubated patient (DISENO_BLOQUE1.md, Anexo A)
const NORMAL_MECHANICS: ConditionMechanics = { complianceMlPerCmH2O: 75, resistanceCmH2OPerLps: 3 };

const CONDITION_MECHANICS: Readonly<Record<PatientConditionValue, Partial<ConditionMechanics>>> = {
  HEALTHY: {},
  ARDS_MILD: { complianceMlPerCmH2O: 40, resistanceCmH2OPerLps: 6 },
  ARDS_MODERATE: { complianceMlPerCmH2O: 25, resistanceCmH2OPerLps: 8 },
  ARDS_SEVERE: { complianceMlPerCmH2O: 15, resistanceCmH2OPerLps: 10 },
  COPD_MILD: { resistanceCmH2OPerLps: 8 },
  COPD_MODERATE: { resistanceCmH2OPerLps: 12 },
  COPD_SEVERE: { resistanceCmH2OPerLps: 18 },
  ASTHMA_MILD: { resistanceCmH2OPerLps: 10 },
  ASTHMA_MODERATE: { resistanceCmH2OPerLps: 15 },
  ASTHMA_SEVERE: { resistanceCmH2OPerLps: 25 },
  PNEUMONIA: { complianceMlPerCmH2O: 35, resistanceCmH2OPerLps: 7 },
  PULMONARY_EDEMA: { complianceMlPerCmH2O: 30, resistanceCmH2OPerLps: 6 },
  PNEUMOTHORAX: { complianceMlPerCmH2O: 20, resistanceCmH2OPerLps: 5 },
  OBESITY_HYPOVENTILATION: { complianceMlPerCmH2O: 40 },
  NEUROMUSCULAR: { complianceMlPerCmH2O: 60 },
  POST_SURGICAL: { complianceMlPerCmH2O: 50, resistanceCmH2OPerLps: 5 },
};

// July demographic adjustment (legacy patient-calculator.service.ts)
const AGE_THRESHOLD_YEARS: number = 60;
const COMPLIANCE_LOSS_PER_YEAR: number = 0.5;
const BMI_THRESHOLD: number = 30;
const COMPLIANCE_LOSS_FRACTION_PER_BMI_POINT: number = 0.01;
const MIN_ADJUSTED_COMPLIANCE: number = 15;

// Saturations at or above 99 % do not determine PaO2 (flat top of the dissociation curve)
const MAX_SATURATION_FRACTION: number = 0.99;
const CM_PER_M: number = 100;

export interface PatientBaseCase {
  readonly id: string;
}

/** Absolute values that replace those of the base case; everything else comes from the base case */
export interface PatientOverrides {
  readonly baseCaseId: string;
  readonly patientAge: number;
  readonly patientWeightKg: number;
  readonly patientSex: PatientSex;
  readonly patientHeightCm: number;
  readonly complianceMlPerCmH2O: number;
  readonly resistanceCmH2OPerLps: number;
  readonly respiratoryRateBpm: number;
  readonly pao2MmHg: number;
  readonly baselineMapMmHg?: number;
}

/** What a session stores so that replay and grading rebuild the same patient whatever the mapping becomes */
export interface SimulationPatientProfile {
  readonly form: SimulatedPatient;
  readonly overrides: PatientOverrides;
  readonly mappingVersion: number;
}

export function baseCaseIdForCondition(condition: PatientConditionValue): string {
  return BASE_CASE_BY_CONDITION[condition];
}

export function buildPatientOverrides(baseCase: PatientBaseCase, patient: SimulatedPatient): PatientOverrides {
  const { vitals } = patient;
  const mechanics: ConditionMechanics = { ...NORMAL_MECHANICS, ...CONDITION_MECHANICS[patient.condition] };

  return {
    baseCaseId: baseCase.id,
    patientAge: patient.ageYears,
    patientWeightKg: patient.weightKg,
    patientSex: patient.sex,
    patientHeightCm: clampTo("patientHeightCm", patient.heightCm),
    complianceMlPerCmH2O: roundTo(clampTo("complianceMlPerCmH2O", adjustedCompliance(mechanics.complianceMlPerCmH2O, patient)), 1),
    resistanceCmH2OPerLps: roundTo(clampTo("resistanceCmH2OPerLps", mechanics.resistanceCmH2OPerLps), 1),
    respiratoryRateBpm: Math.round(clampTo("respiratoryRateBpm", vitals.respiratoryRateBpm)),
    pao2MmHg: roundTo(clampTo("pao2MmHg", pao2FromSaturation(vitals.spo2Percent)), 1),
    baselineMapMmHg:
      vitals.systolicMmHg === undefined || vitals.diastolicMmHg === undefined
        ? undefined
        : roundTo(clampTo("baselineMapMmHg", meanArterialPressure(vitals.systolicMmHg, vitals.diastolicMmHg)), 1),
  };
}

export function bodyMassIndex(weightKg: number, heightCm: number): number {
  const heightM: number = heightCm / CM_PER_M;

  return weightKg / (heightM * heightM);
}

/** MAP = PAD + (PAS − PAD) / 3 */
export function meanArterialPressure(systolicMmHg: number, diastolicMmHg: number): number {
  return diastolicMmHg + (systolicMmHg - diastolicMmHg) / 3;
}

/** Inverse of the Severinghaus equation (Ellis RK. J Appl Physiol 1989;67:902) */
export function pao2FromSaturation(spo2Percent: number): number {
  const saturation: number = Math.min(Math.max(spo2Percent / 100, Number.EPSILON), MAX_SATURATION_FRACTION);
  const a: number = 11700 / (1 / saturation - 1);
  const b: number = Math.sqrt(50 ** 3 + a * a);

  return Math.cbrt(b + a) - Math.cbrt(b - a);
}

function adjustedCompliance(compliance: number, patient: SimulatedPatient): number {
  let adjusted: number = compliance;

  if (patient.ageYears > AGE_THRESHOLD_YEARS) {
    adjusted = Math.max(adjusted - (patient.ageYears - AGE_THRESHOLD_YEARS) * COMPLIANCE_LOSS_PER_YEAR, MIN_ADJUSTED_COMPLIANCE);
  }

  const bmi: number = bodyMassIndex(patient.weightKg, patient.heightCm);

  if (bmi > BMI_THRESHOLD) {
    adjusted = Math.max(adjusted * (1 - (bmi - BMI_THRESHOLD) * COMPLIANCE_LOSS_FRACTION_PER_BMI_POINT), MIN_ADJUSTED_COMPLIANCE);
  }

  return adjusted;
}

function clampTo(parameter: PhysiologicalParameter, value: number): number {
  const { min, max }: { min: number; max: number } = CLINICAL_CASE_PHYSIOLOGICAL_RANGES[parameter];

  return Math.min(Math.max(value, min), max);
}

function roundTo(value: number, decimals: number): number {
  const factor: number = 10 ** decimals;

  return Math.round(value * factor) / factor;
}
