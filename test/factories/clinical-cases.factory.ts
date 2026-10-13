/*
 * Funcionalidad: Fábrica de casos clínicos de prueba
 * Descripción: Crea casos clínicos con Prisma con todos los campos obligatorios del esquema (paciente, diagnóstico, dificultad, patología, objetivo educativo) en estado PUBLISHED por defecto, con título único y valores sobrescribibles; incluye un perfil listo para simulación (mecánica, ajustes iniciales, estado inicial, sexo y talla) que el motor exige para abrir sesiones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CaseDifficulty, type ClinicalCase, type ClinicalCaseStatus, type Pathology, type Prisma, type PrismaClient, type User } from "@prisma/client";

import { nextSequence } from "./sequence";

export interface ClinicalCaseOverrides {
  readonly title?: string;
  readonly status?: ClinicalCaseStatus;
  readonly difficulty?: CaseDifficulty;
  readonly pathology?: Pathology;
  readonly isActive?: boolean;
  readonly validatedByExpert?: boolean;
  readonly createdBy?: User;
}

export async function createClinicalCase(prisma: PrismaClient, overrides: ClinicalCaseOverrides = {}): Promise<ClinicalCase> {
  const sequence: number = nextSequence();

  return await prisma.clinicalCase.create({
    data: {
      title: overrides.title ?? `Test clinical case ${sequence}`,
      description: "Paciente adulto con insuficiencia respiratoria aguda (caso de prueba)",
      patientAge: 55,
      patientWeight: 70,
      mainDiagnosis: "SDRA moderado",
      comorbidities: [],
      difficulty: overrides.difficulty ?? "INTERMEDIATE",
      pathology: overrides.pathology ?? "SDRA",
      educationalGoal: "Ajustar PEEP y volumen corriente con estrategia protectora",
      status: overrides.status ?? "PUBLISHED",
      isActive: overrides.isActive ?? true,
      validatedByExpert: overrides.validatedByExpert ?? false,
      createdById: overrides.createdBy?.id,
    },
  });
}

// The simulation engine only starts sessions on cases with mechanics, initial settings, initial state, sex and height.
export const SIMULATION_READY_CASE_PROFILE: Prisma.ClinicalCaseUpdateInput = {
  patientSex: "MALE",
  patientHeightCm: 175,
  mechanics: {
    complianceMlPerCmH2O: 60,
    resistanceCmH2OPerLps: 8,
    deadSpaceMl: 150,
    vco2MlPerMin: 200,
    bicarbonateMmolPerL: 24,
    hemoglobinGPerDl: 14,
    arteriovenousO2DifferenceMlPerDl: 5,
    basalShuntFraction: 0.05,
    recruitmentCurve: [],
    patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
    hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
    gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
    deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
  },
  initialVentilatorSettings: { mode: "VCV", tidalVolumeMl: 500, respiratoryRateBpm: 12, peepCmH2O: 5, fio2: 0.4, inspiratoryTimeS: 1 },
  initialState: { paco2MmHg: 40, pao2MmHg: 95 },
};

export async function makeClinicalCaseSimulationReady(prisma: PrismaClient, clinicalCaseId: string): Promise<ClinicalCase> {
  return await prisma.clinicalCase.update({ where: { id: clinicalCaseId }, data: SIMULATION_READY_CASE_PROFILE });
}
