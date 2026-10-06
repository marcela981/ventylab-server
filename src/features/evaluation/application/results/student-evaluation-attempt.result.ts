/*
 * Funcionalidad: Resultados de los casos de uso de intentos del estudiante
 * Descripción: Resultado del inicio (intento, si se creó, plazo efectivo y hora del servidor), del detalle del intento (evaluación, preguntas en el orden del intento, medios resueltos, plazo, hora del servidor y nota mínima), de la entrega (estado y nota solo si está publicada) y de cada elemento del listado del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";
import { hasPassedEvaluation } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

export class StartEvaluationAttemptResult {
  public readonly attempt: StudentEvaluationAttempt;
  public readonly created: boolean;
  public readonly deadlineAt?: Date;
  public readonly now: Date;

  public constructor({ attempt, created, deadlineAt, now }: { attempt: StudentEvaluationAttempt; created: boolean; deadlineAt?: Date; now: Date }) {
    this.attempt = attempt;
    this.created = created;
    this.deadlineAt = deadlineAt;
    this.now = now;
  }
}

export class StudentEvaluationAttemptDetailResult {
  public readonly attempt: StudentEvaluationAttempt;
  public readonly evaluation: Evaluation;
  public readonly questions: ReadonlyArray<EvaluationQuestionItem>;
  public readonly mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
  public readonly deadlineAt?: Date;
  public readonly now: Date;
  public readonly passingGrade: number;

  public constructor({
    attempt,
    evaluation,
    questions,
    mediaUrls,
    deadlineAt,
    now,
    passingGrade,
  }: {
    attempt: StudentEvaluationAttempt;
    evaluation: Evaluation;
    questions: ReadonlyArray<EvaluationQuestionItem>;
    mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
    deadlineAt?: Date;
    now: Date;
    passingGrade: number;
  }) {
    this.attempt = attempt;
    this.evaluation = evaluation;
    this.questions = questions;
    this.mediaUrls = mediaUrls;
    this.deadlineAt = deadlineAt;
    this.now = now;
    this.passingGrade = passingGrade;
  }
}

export class SubmitEvaluationAttemptResult {
  public readonly attemptId: string;
  public readonly status: EvaluationAttemptStatusValue;
  public readonly submittedAt?: Date;
  public readonly published: boolean;
  public readonly score?: number;
  public readonly maxScore?: number;
  public readonly grade?: number;
  public readonly passed?: boolean;

  public constructor(attempt: StudentEvaluationAttempt, passingGrade: number) {
    this.attemptId = attempt.id;
    this.status = attempt.status;
    this.submittedAt = attempt.submittedAt;
    this.published = attempt.isPublished;

    if (attempt.isPublished) {
      this.score = attempt.score;
      this.maxScore = attempt.maxScore;
      this.grade = attempt.grade;
      this.passed = attempt.grade === undefined ? undefined : hasPassedEvaluation(attempt.grade, passingGrade);
    }
  }
}

export interface StudentEvaluationListItemResult {
  readonly assignment: EvaluationAssignmentResult;
  readonly evaluation?: StudentEvaluationBriefView;
  readonly attempts: ReadonlyArray<StudentAttemptSummaryView>;
  readonly passingGrade: number;
}
