/*
 * Funcionalidad: Pruebas del riesgo académico de un estudiante
 * Descripción: Verifica que solo cuenta el último intento publicado de cada evaluación (número de intento y, en empate, fecha de publicación), que con los umbrales por defecto se marca en riesgo a quien tenga alguna evaluación reprobada, que el máximo de reprobadas, el progreso mínimo y los días de inactividad se aplican solo cuando están activos y que sin actividad conocida no se marca inactividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  assessStudentRisk,
  selectLatestAttempts,
  type StudentRiskAssessment,
  type StudentRiskEvaluation,
  type StudentRiskThresholds,
} from "@/features/analytics/domain/services/student-risk";

const NOW: Date = new Date("2026-10-17T12:00:00.000Z");
const DEFAULT_THRESHOLDS: StudentRiskThresholds = { maxFailedEvaluations: 0, minProgressPct: 0, inactivityDays: 0 };

function grade(evaluationId: string, attemptNumber: number, passed: boolean, publishedAt: string = "2026-10-01T10:00:00.000Z"): StudentRiskEvaluation {
  return { evaluationId, attemptNumber, passed, publishedAt: new Date(publishedAt) };
}

describe("selectLatestAttempts", () => {
  it("keeps the highest attempt number and breaks ties with the latest publication", () => {
    const evaluations: StudentRiskEvaluation[] = [
      grade("evaluation-1", 2, true, "2026-10-01T10:00:00.000Z"),
      grade("evaluation-1", 1, false, "2026-10-05T10:00:00.000Z"),
      grade("evaluation-2", 1, true, "2026-10-01T10:00:00.000Z"),
      grade("evaluation-2", 1, false, "2026-10-02T10:00:00.000Z"),
    ];

    const latest: StudentRiskEvaluation[] = selectLatestAttempts(evaluations);

    expect(latest).toEqual([evaluations[0], evaluations[3]]);
  });
});

describe("assessStudentRisk", () => {
  it("flags any failed latest attempt with the default thresholds", () => {
    const input: { evaluations: StudentRiskEvaluation[]; progressPct: number } = {
      evaluations: [grade("evaluation-1", 1, false), grade("evaluation-1", 2, true), grade("evaluation-2", 1, false)],
      progressPct: 0,
    };

    const assessment: StudentRiskAssessment = assessStudentRisk(input, DEFAULT_THRESHOLDS, NOW);

    expect(assessment).toEqual({ atRisk: true, riskReasons: ["FAILED_EVALUATIONS"], failedEvaluationIds: ["evaluation-2"] });
  });

  it("does not flag a student who passed a retake and has no other rule enabled", () => {
    const input: { evaluations: StudentRiskEvaluation[]; progressPct: number } = { evaluations: [grade("evaluation-1", 1, false), grade("evaluation-1", 2, true)], progressPct: 0 };

    const assessment: StudentRiskAssessment = assessStudentRisk(input, DEFAULT_THRESHOLDS, NOW);

    expect(assessment).toEqual({ atRisk: false, riskReasons: [], failedEvaluationIds: [] });
  });

  it("tolerates failed evaluations up to the configured maximum", () => {
    const input: { evaluations: StudentRiskEvaluation[]; progressPct: number } = { evaluations: [grade("evaluation-1", 1, false), grade("evaluation-2", 1, false)], progressPct: 80 };

    const withinLimit: StudentRiskAssessment = assessStudentRisk(input, { ...DEFAULT_THRESHOLDS, maxFailedEvaluations: 2 }, NOW);
    const overLimit: StudentRiskAssessment = assessStudentRisk(input, { ...DEFAULT_THRESHOLDS, maxFailedEvaluations: 1 }, NOW);

    expect(withinLimit.atRisk).toBe(false);
    expect(withinLimit.failedEvaluationIds).toEqual(["evaluation-1", "evaluation-2"]);
    expect(overLimit.riskReasons).toEqual(["FAILED_EVALUATIONS"]);
  });

  it("applies the minimum progress only when it is enabled", () => {
    const input: { evaluations: StudentRiskEvaluation[]; progressPct: number } = { evaluations: [], progressPct: 30 };

    const disabled: StudentRiskAssessment = assessStudentRisk(input, DEFAULT_THRESHOLDS, NOW);
    const enabled: StudentRiskAssessment = assessStudentRisk(input, { ...DEFAULT_THRESHOLDS, minProgressPct: 40 }, NOW);
    const reached: StudentRiskAssessment = assessStudentRisk(input, { ...DEFAULT_THRESHOLDS, minProgressPct: 30 }, NOW);

    expect(disabled.atRisk).toBe(false);
    expect(enabled).toEqual({ atRisk: true, riskReasons: ["LOW_PROGRESS"], failedEvaluationIds: [] });
    expect(reached.atRisk).toBe(false);
  });

  it("flags inactivity only when enabled and the last activity is known and older than the limit", () => {
    const thresholds: StudentRiskThresholds = { ...DEFAULT_THRESHOLDS, inactivityDays: 7 };

    const stale: StudentRiskAssessment = assessStudentRisk({ evaluations: [], progressPct: 0, lastActivityAt: new Date("2026-10-09T12:00:00.000Z") }, thresholds, NOW);
    const recent: StudentRiskAssessment = assessStudentRisk({ evaluations: [], progressPct: 0, lastActivityAt: new Date("2026-10-11T12:00:00.000Z") }, thresholds, NOW);
    const unknown: StudentRiskAssessment = assessStudentRisk({ evaluations: [], progressPct: 0 }, thresholds, NOW);
    const disabled: StudentRiskAssessment = assessStudentRisk({ evaluations: [], progressPct: 0, lastActivityAt: new Date("2026-01-01T00:00:00.000Z") }, DEFAULT_THRESHOLDS, NOW);

    expect(stale.riskReasons).toEqual(["INACTIVE"]);
    expect(recent.atRisk).toBe(false);
    expect(unknown.atRisk).toBe(false);
    expect(disabled.atRisk).toBe(false);
  });
});
