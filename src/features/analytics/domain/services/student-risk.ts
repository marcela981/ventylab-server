/*
 * Funcionalidad: Riesgo académico de un estudiante
 * Descripción: Regla pura del resaltado de riesgo del panel docente con umbrales configurables: por evaluación solo cuenta el último intento publicado (mayor número de intento y, en empate, la publicación más reciente); un estudiante está en riesgo cuando sus evaluaciones reprobadas superan el máximo permitido, cuando su progreso queda por debajo del mínimo (0 desactiva la regla) o cuando lleva más días sin actividad que el límite (0 desactiva la regla; sin actividad conocida no se marca); umbrales por defecto que reproducen la regla previa del panel (cualquier reprobada marca riesgo, las demás reglas desactivadas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type StudentRiskReasonValue = "FAILED_EVALUATIONS" | "LOW_PROGRESS" | "INACTIVE";

export const STUDENT_RISK_REASON_VALUES: readonly StudentRiskReasonValue[] = ["FAILED_EVALUATIONS", "LOW_PROGRESS", "INACTIVE"] as const;

export interface StudentRiskThresholds {
  readonly maxFailedEvaluations: number;
  readonly minProgressPct: number;
  readonly inactivityDays: number;
}

export interface StudentRiskEvaluation {
  readonly evaluationId: string;
  readonly attemptNumber: number;
  readonly publishedAt: Date;
  readonly passed: boolean;
}

export interface StudentRiskInput {
  readonly evaluations: ReadonlyArray<StudentRiskEvaluation>;
  readonly progressPct: number;
  readonly lastActivityAt?: Date;
}

export interface StudentRiskAssessment {
  readonly atRisk: boolean;
  readonly riskReasons: StudentRiskReasonValue[];
  readonly failedEvaluationIds: string[];
}

export const DEFAULT_STUDENT_RISK_THRESHOLDS: StudentRiskThresholds = { maxFailedEvaluations: 0, minProgressPct: 0, inactivityDays: 0 };

const MS_PER_DAY: number = 86_400_000;

function isLater(candidate: StudentRiskEvaluation, current: StudentRiskEvaluation): boolean {
  if (candidate.attemptNumber !== current.attemptNumber) {
    return candidate.attemptNumber > current.attemptNumber;
  }

  return candidate.publishedAt.getTime() > current.publishedAt.getTime();
}

export function selectLatestAttempts<T extends StudentRiskEvaluation>(evaluations: ReadonlyArray<T>): T[] {
  const latest: Map<string, T> = new Map<string, T>();

  for (const evaluation of evaluations) {
    const current: T | undefined = latest.get(evaluation.evaluationId);

    if (!current || isLater(evaluation, current)) {
      latest.set(evaluation.evaluationId, evaluation);
    }
  }

  return [...latest.values()];
}

export function assessStudentRisk(input: StudentRiskInput, thresholds: StudentRiskThresholds, now: Date): StudentRiskAssessment {
  const failedEvaluationIds: string[] = selectLatestAttempts(input.evaluations)
    .filter((evaluation: StudentRiskEvaluation): boolean => !evaluation.passed)
    .map((evaluation: StudentRiskEvaluation): string => evaluation.evaluationId);
  const riskReasons: StudentRiskReasonValue[] = [];

  if (failedEvaluationIds.length > thresholds.maxFailedEvaluations) {
    riskReasons.push("FAILED_EVALUATIONS");
  }

  if (thresholds.minProgressPct > 0 && input.progressPct < thresholds.minProgressPct) {
    riskReasons.push("LOW_PROGRESS");
  }

  if (thresholds.inactivityDays > 0 && input.lastActivityAt !== undefined && now.getTime() - input.lastActivityAt.getTime() > thresholds.inactivityDays * MS_PER_DAY) {
    riskReasons.push("INACTIVE");
  }

  return { atRisk: riskReasons.length > 0, riskReasons, failedEvaluationIds };
}
