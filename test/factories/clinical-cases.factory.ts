/*
 * Funcionalidad: Fábrica de casos clínicos de prueba
 * Descripción: Crea casos clínicos con Prisma con todos los campos obligatorios del esquema (paciente, diagnóstico, dificultad, patología, objetivo educativo) en estado PUBLISHED por defecto, con título único y valores sobrescribibles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CaseDifficulty, type ClinicalCase, type ClinicalCaseStatus, type Pathology, type PrismaClient, type User } from "@prisma/client";

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
