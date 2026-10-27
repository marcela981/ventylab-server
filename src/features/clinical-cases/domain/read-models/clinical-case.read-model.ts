/*
 * Funcionalidad: Modelos de lectura de casos clínicos
 * Descripción: Estructuras de solo lectura de casos clínicos (con su estado de publicación), intentos de evaluación, estadísticas de intentos por usuario y uso del caso por sesiones, intentos y preguntas; el detalle incluye los datos del paciente para mostrar (sexo, talla, antecedentes, alergias y signos vitales iniciales)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseInitialVitals } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { type PatientSexValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";

export interface ClinicalCaseSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly patientAge: number;
  readonly patientWeight: number;
  readonly mainDiagnosis: string;
  readonly comorbidities: string[];
  readonly difficulty: string;
  readonly pathology: string;
  readonly educationalGoal: string;
}

/** Patient data a student reads before choosing the case; the simulation definition itself stays behind clinical-cases:manage */
export interface ClinicalCasePatientView {
  readonly sex?: PatientSexValue;
  readonly heightCm?: number;
  readonly history: readonly string[];
  readonly allergies: readonly string[];
  readonly initialVitals?: ClinicalCaseInitialVitals;
}

export interface ClinicalCaseDetail extends ClinicalCaseSummary {
  readonly labData?: unknown;
  readonly isActive: boolean;
  readonly status: ClinicalCaseStatusValue;
  readonly patient: ClinicalCasePatientView;
}

export interface ClinicalCaseUsage {
  readonly simulationSessions: number;
  readonly legacySimulatorSessions: number;
  readonly evaluationAttempts: number;
  readonly evaluationQuestions: number;
}

export interface CaseAttemptRecord {
  readonly id: string;
  readonly clinicalCaseId: string;
  readonly score: number;
  readonly isSuccessful: boolean;
  readonly completionTime?: number;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

export interface CaseUserAttemptsSummary {
  readonly hasAttempted: boolean;
  readonly bestScore?: number;
  readonly lastAttempt?: Date;
  readonly isSuccessful: boolean;
}

export interface ClinicalCaseListItem {
  readonly clinicalCase: ClinicalCaseSummary;
  readonly userAttempts: CaseUserAttemptsSummary;
}

export interface CaseAttemptImprovement {
  readonly previousScore: number;
  readonly difference: number;
  readonly improved: boolean;
}

export interface CaseAttemptWithImprovement {
  readonly attempt: CaseAttemptRecord;
  readonly improvement?: CaseAttemptImprovement;
}

export interface CaseAttemptStats {
  readonly total: number;
  readonly successful: number;
  readonly bestScore?: number;
  readonly averageScore?: number;
  readonly averageTime?: number;
}
