/*
 * Funcionalidad: Construcción del paciente simulado
 * Descripción: Arma el PatientModel a partir de un caso clínico del catálogo o de los datos del formulario (demografía, condición, signos vitales), calculando IBW, IMC, superficie corporal y mecánica respiratoria ajustada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "crypto";

import {
  adjustMechanicsForDemographics,
  calculatePatientParams,
  getRespiratoryMechanics,
} from "@/features/simulation/domain/services/patient-calculator";
import { findSimulationClinicalCase, type SimulationClinicalCase } from "@/features/simulation/domain/services/simulation-case-catalog";
import { PatientDataRequiredError, SimulationCaseNotFoundError } from "@/features/simulation/domain/simulation.errors";
import {
  BASIC_DIFFICULTY_VALUE,
  type PatientConditionValue,
  type PatientDemographics,
  type PatientDifficultyValue,
  type PatientModel,
  type RespiratoryMechanics,
  type VitalSigns,
} from "@/features/simulation/domain/value-objects/patient-model";

export interface PatientConfiguration {
  clinicalCaseId?: string;
  demographics?: PatientDemographics;
  condition?: PatientConditionValue;
  vitalSigns?: Partial<VitalSigns>;
  diagnosis?: string;
  difficultyLevel?: PatientDifficultyValue;
}

export function buildPatient(configuration: PatientConfiguration): PatientModel {
  if (configuration.clinicalCaseId) {
    return buildPatientFromCase(configuration.clinicalCaseId);
  }

  const { demographics, condition, vitalSigns, diagnosis, difficultyLevel } = configuration;

  if (!demographics || !condition) {
    throw new PatientDataRequiredError();
  }

  const baseMechanics: RespiratoryMechanics = getRespiratoryMechanics(condition);

  return {
    id: `patient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    demographics,
    calculated: calculatePatientParams(demographics),
    respiratoryMechanics: adjustMechanicsForDemographics(baseMechanics, demographics),
    condition,
    vitalSigns: {
      heartRate: vitalSigns?.heartRate ?? 80,
      respiratoryRate: vitalSigns?.respiratoryRate ?? 14,
      spo2: vitalSigns?.spo2 ?? 95,
      systolicBP: vitalSigns?.systolicBP ?? 120,
      diastolicBP: vitalSigns?.diastolicBP ?? 75,
      temperature: vitalSigns?.temperature ?? 36.5,
    },
    diagnosis,
    difficultyLevel: difficultyLevel ?? BASIC_DIFFICULTY_VALUE,
    createdAt: Date.now(),
  };
}

function buildPatientFromCase(caseId: string): PatientModel {
  const clinicalCase: SimulationClinicalCase | undefined = findSimulationClinicalCase(caseId);

  if (!clinicalCase) {
    throw new SimulationCaseNotFoundError();
  }

  const { patient } = clinicalCase;

  return {
    id: randomUUID(),
    demographics: patient.demographics,
    calculated: calculatePatientParams(patient.demographics),
    respiratoryMechanics: patient.respiratoryMechanics,
    condition: patient.condition,
    vitalSigns: patient.vitalSigns,
    arterialBloodGas: patient.arterialBloodGas,
    physicalExam: patient.physicalExam,
    diagnosis: patient.diagnosis,
    difficultyLevel: patient.difficultyLevel,
    createdAt: Date.now(),
  };
}
