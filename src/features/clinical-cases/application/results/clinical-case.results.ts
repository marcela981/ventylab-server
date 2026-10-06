/*
 * Funcionalidad: Resultados de casos clínicos
 * Descripción: Resultados de los casos de uso de casos clínicos (detalle con intentos del usuario, evaluación con comparación y retroalimentación, historial de intentos con estadísticas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type CaseAttemptRecord,
  type CaseAttemptStats,
  type CaseAttemptWithImprovement,
  type ClinicalCaseDetail,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ConfigurationComparison,
  type EvaluationFeedback,
  type ExpertConfigurationData,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

export class ClinicalCaseDetailResult {
  public readonly clinicalCase: ClinicalCaseDetail;
  public readonly totalAttempts: number;
  public readonly bestScore?: number;
  public readonly lastAttempt?: Date;
  public readonly attempts: CaseAttemptRecord[];

  public constructor({
    clinicalCase,
    totalAttempts,
    bestScore,
    lastAttempt,
    attempts,
  }: {
    clinicalCase: ClinicalCaseDetail;
    totalAttempts: number;
    bestScore?: number;
    lastAttempt?: Date;
    attempts: CaseAttemptRecord[];
  }) {
    this.clinicalCase = clinicalCase;
    this.totalAttempts = totalAttempts;
    this.bestScore = bestScore;
    this.lastAttempt = lastAttempt;
    this.attempts = attempts;
  }
}

export interface EvaluationImprovement {
  readonly previousScore: number;
  readonly currentScore: number;
  readonly difference: number;
  readonly improved: boolean;
}

export class ClinicalCaseEvaluationResult {
  public readonly attemptId: string;
  public readonly score: number;
  public readonly isSuccessful: boolean;
  public readonly completionTime: number;
  public readonly comparison: ConfigurationComparison;
  public readonly feedback: EvaluationFeedback;
  public readonly expertConfiguration: ExpertConfigurationData;
  public readonly improvement?: EvaluationImprovement;

  public constructor({
    attemptId,
    score,
    isSuccessful,
    completionTime,
    comparison,
    feedback,
    expertConfiguration,
    improvement,
  }: {
    attemptId: string;
    score: number;
    isSuccessful: boolean;
    completionTime: number;
    comparison: ConfigurationComparison;
    feedback: EvaluationFeedback;
    expertConfiguration: ExpertConfigurationData;
    improvement?: EvaluationImprovement;
  }) {
    this.attemptId = attemptId;
    this.score = score;
    this.isSuccessful = isSuccessful;
    this.completionTime = completionTime;
    this.comparison = comparison;
    this.feedback = feedback;
    this.expertConfiguration = expertConfiguration;
    this.improvement = improvement;
  }
}

export class ClinicalCaseAttemptsResult {
  public readonly caseId: string;
  public readonly caseTitle: string;
  public readonly stats: CaseAttemptStats;
  public readonly attempts: CaseAttemptWithImprovement[];

  public constructor({
    caseId,
    caseTitle,
    stats,
    attempts,
  }: {
    caseId: string;
    caseTitle: string;
    stats: CaseAttemptStats;
    attempts: CaseAttemptWithImprovement[];
  }) {
    this.caseId = caseId;
    this.caseTitle = caseTitle;
    this.stats = stats;
    this.attempts = attempts;
  }
}
