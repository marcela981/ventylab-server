/*
 * Funcionalidad: Modelos de lectura de casos clínicos
 * Descripción: Estructuras de solo lectura de casos clínicos, intentos de evaluación y estadísticas de intentos por usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
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

export interface ClinicalCaseDetail extends ClinicalCaseSummary {
  readonly labData?: unknown;
  readonly isActive: boolean;
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
