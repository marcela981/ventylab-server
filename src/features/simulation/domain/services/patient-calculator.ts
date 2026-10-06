/*
 * Funcionalidad: Cálculos fisiológicos del paciente
 * Descripción: Calcula peso corporal ideal (ARDSNet), IMC, superficie corporal (DuBois), volumen tidal predicho y la mecánica respiratoria según la condición clínica, ajustada por edad y obesidad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CONDITION_MECHANICS,
  type GenderValue,
  NORMAL_RESPIRATORY_MECHANICS,
  type PatientCalculatedParams,
  type PatientConditionValue,
  type PatientDemographics,
  type RespiratoryMechanics,
} from "@/features/simulation/domain/value-objects/patient-model";

export function calculateIdealBodyWeight(height: number, gender: GenderValue): number {
  const baseWeight: number = gender === "M" ? 50 : 45.5;
  const ibw: number = baseWeight + 0.91 * (height - 152.4);

  return Math.max(ibw, 30);
}

export function calculateBMI(weight: number, height: number): number {
  const heightM: number = height / 100;

  return weight / (heightM * heightM);
}

export function calculateBodySurfaceArea(weight: number, height: number): number {
  return 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
}

export function calculatePredictedTidalVolume(ibw: number): { min: number; max: number } {
  return {
    min: Math.round(ibw * 6),
    max: Math.round(ibw * 8),
  };
}

export function calculatePatientParams(demographics: PatientDemographics): PatientCalculatedParams {
  const ibw: number = calculateIdealBodyWeight(demographics.height, demographics.gender);

  return {
    idealBodyWeight: Math.round(ibw * 10) / 10,
    bmi: Math.round(calculateBMI(demographics.weight, demographics.height) * 10) / 10,
    predictedTidalVolume: calculatePredictedTidalVolume(ibw),
    bodySurfaceArea: Math.round(calculateBodySurfaceArea(demographics.weight, demographics.height) * 100) / 100,
  };
}

export function getRespiratoryMechanics(condition: PatientConditionValue): RespiratoryMechanics {
  const conditionModifiers: Partial<RespiratoryMechanics> = CONDITION_MECHANICS[condition] || {};

  return {
    ...NORMAL_RESPIRATORY_MECHANICS,
    ...conditionModifiers,
  };
}

export function adjustMechanicsForDemographics(mechanics: RespiratoryMechanics, demographics: PatientDemographics): RespiratoryMechanics {
  let { compliance, functionalResidualCapacity } = { ...mechanics };
  const { resistance } = mechanics;

  if (demographics.age > 60) {
    const ageReduction: number = (demographics.age - 60) * 0.5;

    compliance = Math.max(compliance - ageReduction, 15);
  }

  const bmi: number = calculateBMI(demographics.weight, demographics.height);

  if (bmi > 30) {
    const obesityFactor: number = 1 - ((bmi - 30) * 0.01);

    compliance = Math.max(compliance * obesityFactor, 15);
    functionalResidualCapacity = Math.max(functionalResidualCapacity * obesityFactor, 1500);
  }

  return {
    compliance: Math.round(compliance * 10) / 10,
    resistance: Math.round(resistance * 10) / 10,
    functionalResidualCapacity: Math.round(functionalResidualCapacity),
    intrinsicPeep: mechanics.intrinsicPeep,
  };
}
