/*
 * Funcionalidad: Resultados de la calificación docente de evaluaciones
 * Descripción: Resultados de los casos de uso de calificación (vista completa de un intento con la evaluación, respuestas, puntajes y desglose práctico recalculado; calificación de una pregunta; publicación de una nota) y tipos públicos de EvaluationFacade (nota publicada con aprobación y estadísticas de una evaluación)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type PracticalScoreResult } from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export class GradingAttemptDetailResult {
  public readonly attempt: StudentEvaluationAttempt;
  public readonly evaluation: Evaluation;
  public readonly practicalScores: ReadonlyMap<string, PracticalScoreResult>;
  public readonly mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
  public readonly passingGrade: number;

  public constructor({
    attempt,
    evaluation,
    practicalScores,
    mediaUrls,
    passingGrade,
  }: {
    attempt: StudentEvaluationAttempt;
    evaluation: Evaluation;
    practicalScores: ReadonlyMap<string, PracticalScoreResult>;
    mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
    passingGrade: number;
  }) {
    this.attempt = attempt;
    this.evaluation = evaluation;
    this.practicalScores = practicalScores;
    this.mediaUrls = mediaUrls;
    this.passingGrade = passingGrade;
  }
}

export interface GradeEvaluationAnswerResult {
  readonly attemptId: string;
  readonly questionId: string;
  readonly status: EvaluationAttemptStatusValue;
  readonly score?: number;
  readonly maxScore?: number;
  readonly grade?: number;
  readonly published: boolean;
  readonly override: boolean;
}

export interface PublishEvaluationAttemptGradeResult {
  readonly attemptId: string;
  readonly publishedAt: Date;
  readonly alreadyPublished: boolean;
}

export interface EvaluationUserGrade {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly evaluationType: EvaluationTypeValue;
  readonly userId: string;
  readonly attemptNumber: number;
  readonly score?: number;
  readonly maxScore?: number;
  readonly grade: number;
  readonly passed: boolean;
  readonly publishedAt: Date;
  readonly legacy: boolean;
}

export interface EvaluationGradeStats {
  readonly evaluationId: string;
  readonly attemptsByStatus: Readonly<Record<EvaluationAttemptStatusValue, number>>;
  readonly totalAttempts: number;
  readonly publishedCount: number;
  readonly gradedCount: number;
  readonly averageGrade?: number;
  readonly minGrade?: number;
  readonly maxGrade?: number;
  readonly passRate?: number;
  readonly passingGrade: number;
}
