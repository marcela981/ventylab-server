/*
 * Funcionalidad: Repositorio de casos clínicos
 * Descripción: Contrato y token del repositorio de casos clínicos (lectura filtrada por estado, escritura del agregado ClinicalCase, bloqueo de fila y conteo de uso), configuraciones expertas e intentos de evaluación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type EvaluationAttempt } from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import {
  type CaseAttemptRecord,
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
  type ClinicalCaseUsage,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type ExpertConfigurationData } from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";

export const CLINICAL_CASES_REPOSITORY_TOKEN: unique symbol = Symbol("CLINICAL_CASES_REPOSITORY_TOKEN");

export interface GetClinicalCasesQuery extends ListQuery {
  difficulty?: CaseDifficultyValue;
  pathology?: PathologyValue;
  status?: ClinicalCaseStatusValue;
}

export interface IClinicalCasesRepository {
  getCases(query: GetClinicalCasesQuery): Promise<Paginated<ClinicalCaseSummary>>;
  getById(caseId: string): Promise<ClinicalCaseDetail | undefined>;
  getCaseById(caseId: string, transaction?: unknown): Promise<ClinicalCase | undefined>;
  lockCase(caseId: string, transaction: unknown): Promise<void>;
  getUsage(caseId: string, transaction?: unknown): Promise<ClinicalCaseUsage>;
  saveCase(clinicalCase: ClinicalCase, transaction?: unknown): Promise<void>;
  deleteCase(caseId: string, transaction?: unknown): Promise<void>;
  getExpertConfiguration(caseId: string): Promise<ExpertConfigurationData | undefined>;
  getUserAttempts(userId: string, caseId: string, limit?: number): Promise<CaseAttemptRecord[]>;
  getUserAttemptsForCases(userId: string, caseIds: string[]): Promise<CaseAttemptRecord[]>;
  getLatestOtherAttemptScore(userId: string, caseId: string, excludedAttemptId: string): Promise<number | undefined>;
  saveAttempt(attempt: EvaluationAttempt, transaction?: unknown): Promise<void>;
}
