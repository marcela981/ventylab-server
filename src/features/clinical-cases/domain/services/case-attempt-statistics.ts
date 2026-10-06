/*
 * Funcionalidad: Servicio de dominio de estadísticas de intentos de casos clínicos
 * Descripción: Resume los intentos del usuario por caso, calcula estadísticas (total, exitosos, mejor puntaje, promedios) y la mejora entre intentos consecutivos de la lista ordenada del más reciente al más antiguo
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
  type CaseUserAttemptsSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";

export const NO_ATTEMPTS_SUMMARY: CaseUserAttemptsSummary = {
  hasAttempted: false,
  bestScore: undefined,
  lastAttempt: undefined,
  isSuccessful: false,
};

export function summarizeAttemptsByCase(attemptsNewestFirst: CaseAttemptRecord[]): Map<string, CaseUserAttemptsSummary> {
  const summaries: Map<string, CaseUserAttemptsSummary> = new Map<string, CaseUserAttemptsSummary>();

  for (const attempt of attemptsNewestFirst) {
    const caseScores: number[] = attemptsNewestFirst
      .filter((other: CaseAttemptRecord) => other.clinicalCaseId === attempt.clinicalCaseId)
      .map((other: CaseAttemptRecord) => other.score);

    summaries.set(attempt.clinicalCaseId, {
      hasAttempted: true,
      bestScore: Math.max(...caseScores),
      lastAttempt: attempt.completedAt,
      isSuccessful: attempt.isSuccessful,
    });
  }

  return summaries;
}

export function findBestAttempt(attempts: CaseAttemptRecord[]): CaseAttemptRecord | undefined {
  if (attempts.length === 0) {
    return undefined;
  }

  return attempts.reduce((best: CaseAttemptRecord, current: CaseAttemptRecord) => (current.score > best.score ? current : best));
}

export function computeAttemptStats(attempts: CaseAttemptRecord[]): CaseAttemptStats {
  const timedAttempts: CaseAttemptRecord[] = attempts.filter((attempt: CaseAttemptRecord) => attempt.completionTime);

  return {
    total: attempts.length,
    successful: attempts.filter((attempt: CaseAttemptRecord) => attempt.isSuccessful).length,
    bestScore: attempts.length > 0 ? Math.max(...attempts.map((attempt: CaseAttemptRecord) => attempt.score)) : undefined,
    averageScore:
      attempts.length > 0 ? attempts.reduce((sum: number, attempt: CaseAttemptRecord) => sum + attempt.score, 0) / attempts.length : undefined,
    averageTime:
      timedAttempts.length > 0
        ? timedAttempts.reduce((sum: number, attempt: CaseAttemptRecord) => sum + (attempt.completionTime || 0), 0) / timedAttempts.length
        : undefined,
  };
}

export function withImprovement(attemptsNewestFirst: CaseAttemptRecord[]): CaseAttemptWithImprovement[] {
  return attemptsNewestFirst.map((attempt: CaseAttemptRecord, index: number): CaseAttemptWithImprovement => {
    if (index === 0) {
      return { attempt };
    }

    const previousScore: number = attemptsNewestFirst[index - 1].score;
    const difference: number = attempt.score - previousScore;

    return { attempt, improvement: { previousScore, difference, improved: difference > 0 } };
  });
}
