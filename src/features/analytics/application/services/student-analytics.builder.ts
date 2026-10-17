/*
 * Funcionalidad: Constructor de analítica por estudiante
 * Descripción: Funciones puras que combinan en memoria los resultados por lotes de las fachadas (progreso, notas publicadas, sesiones de simulación, uso y valoraciones de IA y horas de ventilador) indexándolos por usuario, sin ninguna lectura adicional: resumen de progreso por sección, nivel y módulo, nota vigente por evaluación (último intento publicado) con su promedio, filas del panel de un grupo y filas largas del conjunto de datos de investigación con identificadores seudonimizados (usuario y grupo, y las evaluaciones con separación de dominio "evaluation:")
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRatingUserUseCaseStats } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import { AI_RATING_DIMENSIONS } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { type AiUserUseCaseUsage } from "@/features/ai-telemetry/domain/repositories/ai-call-log-analytics.repository";
import {
  type ProgressItemSummary,
  type ResearchDatasetRow,
  type StudentAiUseCaseUsage,
  type StudentDashboardRow,
  type StudentEvaluationGrade,
  type StudentGradesSummary,
  type StudentProgressSummary,
  type StudentSimulationSummary,
} from "@/features/analytics/application/results/analytics.results";
import { type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";
import { type UserLearningProgress } from "@/features/progress/application/services/learning-progress.facade";
import {
  type LearningProgressReport,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type UserVentilatorUsage } from "@/features/reservations/application/services/reservations.facade";
import { type SimulationUserSessionStats } from "@/features/simulation/domain/repositories/simulation-analytics.repository";

export interface StudentAnalyticsSources {
  readonly progress: UserLearningProgress[];
  readonly grades: EvaluationUserGrade[];
  readonly simulation: SimulationUserSessionStats[];
  readonly aiUsage: AiUserUseCaseUsage[];
  readonly aiRatings: AiRatingUserUseCaseStats[];
  readonly ventilator: UserVentilatorUsage[];
}

export interface ResearchParticipant {
  readonly userId: string;
  readonly groupId: string;
}

export const RESEARCH_EVALUATION_DOMAIN: string = "evaluation:";

const EMPTY_PROGRESS: LessonWeightedProgress = { completedLessons: 0, totalLessons: 0, percentage: 0, completed: false };

function round(value: number, decimals: number): number {
  const factor: number = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function groupByUser<T extends { readonly userId: string }>(items: ReadonlyArray<T>): Map<string, T[]> {
  const grouped: Map<string, T[]> = new Map<string, T[]>();

  for (const item of items) {
    grouped.set(item.userId, [...(grouped.get(item.userId) ?? []), item]);
  }

  return grouped;
}

function toItem(id: string, title: string | undefined, progress: LessonWeightedProgress): ProgressItemSummary {
  return { id, title, percentage: progress.percentage, completedLessons: progress.completedLessons, totalLessons: progress.totalLessons, completed: progress.completed };
}

export function toProgressSummary(report: LearningProgressReport | undefined): StudentProgressSummary {
  if (!report) {
    return { overall: EMPTY_PROGRESS, sections: [], levels: [], modules: [] };
  }

  return {
    overall: report.overall,
    sections: report.sections.map((section: SectionLearningProgress) => toItem(section.sectionId, section.title, section)),
    levels: report.levels.map((level: LevelLearningProgress) => toItem(level.levelId, level.title, level)),
    modules: report.modules.map((module: ModuleLearningProgress) => toItem(module.moduleId, module.title, module)),
  };
}

export function toGradesSummary(grades: ReadonlyArray<EvaluationUserGrade>): StudentGradesSummary {
  const latest: Map<string, EvaluationUserGrade> = new Map<string, EvaluationUserGrade>();

  for (const grade of grades) {
    const current: EvaluationUserGrade | undefined = latest.get(grade.evaluationId);

    if (!current || grade.attemptNumber > current.attemptNumber) {
      latest.set(grade.evaluationId, grade);
    }
  }

  const evaluations: StudentEvaluationGrade[] = [...latest.values()]
    .sort((left: EvaluationUserGrade, right: EvaluationUserGrade) => left.evaluationId.localeCompare(right.evaluationId))
    .map(
      (grade: EvaluationUserGrade): StudentEvaluationGrade => ({
        evaluationId: grade.evaluationId,
        evaluationTitle: grade.evaluationTitle,
        attemptNumber: grade.attemptNumber,
        grade: grade.grade,
        passed: grade.passed,
        publishedAt: grade.publishedAt,
      }),
    );

  const total: number = evaluations.reduce((sum: number, grade: StudentEvaluationGrade) => sum + grade.grade, 0);

  return { averageGrade: evaluations.length > 0 ? round(total / evaluations.length, 2) : null, evaluations };
}

function toSimulationSummary(stats: SimulationUserSessionStats | undefined): StudentSimulationSummary {
  return {
    sessionCount: stats?.sessionCount ?? 0,
    averageScore: stats?.averageScore === null || stats?.averageScore === undefined ? null : round(stats.averageScore, 2),
    averageTimeToStabilizeSeconds:
      stats?.averageTimeToStabilizeSeconds === null || stats?.averageTimeToStabilizeSeconds === undefined ? null : round(stats.averageTimeToStabilizeSeconds, 1),
  };
}

function toAiUsage(usage: ReadonlyArray<AiUserUseCaseUsage>, ratings: ReadonlyArray<AiRatingUserUseCaseStats>): StudentAiUseCaseUsage[] {
  const byUseCase: Map<string, StudentAiUseCaseUsage> = new Map<string, StudentAiUseCaseUsage>();

  for (const item of usage) {
    byUseCase.set(item.useCase, { useCase: item.useCase, calls: item.calls, inputTokens: item.inputTokens, outputTokens: item.outputTokens, ratings: 0, helpfulRate: null });
  }

  for (const rating of ratings) {
    const current: StudentAiUseCaseUsage = byUseCase.get(rating.useCase) ?? { useCase: rating.useCase, calls: 0, inputTokens: 0, outputTokens: 0, ratings: 0, helpfulRate: null };

    byUseCase.set(rating.useCase, {
      ...current,
      ratings: rating.ratings,
      helpfulRate: rating.helpfulRate === null ? null : round(rating.helpfulRate * 100, 1),
    });
  }

  return [...byUseCase.values()].sort((left: StudentAiUseCaseUsage, right: StudentAiUseCaseUsage) => left.useCase.localeCompare(right.useCase));
}

export function buildStudentDashboardRows(students: ReadonlyArray<GroupMemberSummary>, sources: StudentAnalyticsSources): StudentDashboardRow[] {
  const progress: Map<string, UserLearningProgress> = new Map(sources.progress.map((item: UserLearningProgress): [string, UserLearningProgress] => [item.userId, item]));
  const grades: Map<string, EvaluationUserGrade[]> = groupByUser(sources.grades);
  const simulation: Map<string, SimulationUserSessionStats> = new Map(
    sources.simulation.map((item: SimulationUserSessionStats): [string, SimulationUserSessionStats] => [item.userId, item]),
  );
  const aiUsage: Map<string, AiUserUseCaseUsage[]> = groupByUser(sources.aiUsage);
  const aiRatings: Map<string, AiRatingUserUseCaseStats[]> = groupByUser(sources.aiRatings);
  const ventilator: Map<string, UserVentilatorUsage> = new Map(sources.ventilator.map((item: UserVentilatorUsage): [string, UserVentilatorUsage] => [item.userId, item]));

  return students.map(
    (student: GroupMemberSummary): StudentDashboardRow => ({
      userId: student.userId,
      name: student.name,
      email: student.email,
      progress: toProgressSummary(progress.get(student.userId)?.report),
      grades: toGradesSummary(grades.get(student.userId) ?? []),
      simulation: toSimulationSummary(simulation.get(student.userId)),
      aiUsage: toAiUsage(aiUsage.get(student.userId) ?? [], aiRatings.get(student.userId) ?? []),
      ventilatorHours: round(ventilator.get(student.userId)?.hours ?? 0, 2),
    }),
  );
}

export function buildResearchRows(
  participants: ReadonlyArray<ResearchParticipant>,
  sources: Omit<StudentAnalyticsSources, "ventilator">,
  pseudonymize: (value: string) => string,
): ResearchDatasetRow[] {
  const progress: Map<string, UserLearningProgress> = new Map(sources.progress.map((item: UserLearningProgress): [string, UserLearningProgress] => [item.userId, item]));
  const grades: Map<string, EvaluationUserGrade[]> = groupByUser(sources.grades);
  const simulation: Map<string, SimulationUserSessionStats> = new Map(
    sources.simulation.map((item: SimulationUserSessionStats): [string, SimulationUserSessionStats] => [item.userId, item]),
  );
  const aiUsage: Map<string, AiUserUseCaseUsage[]> = groupByUser(sources.aiUsage);
  const aiRatings: Map<string, AiRatingUserUseCaseStats[]> = groupByUser(sources.aiRatings);

  return participants.flatMap((participant: ResearchParticipant): ResearchDatasetRow[] => {
    const base: { participant: string; group: string } = { participant: pseudonymize(participant.userId), group: pseudonymize(participant.groupId) };
    const summary: StudentProgressSummary = toProgressSummary(progress.get(participant.userId)?.report);
    const stats: StudentSimulationSummary = toSimulationSummary(simulation.get(participant.userId));
    const rows: ResearchDatasetRow[] = [
      { ...base, domain: "progress", item: "overall", metric: "percentage", value: summary.overall.percentage },
      ...summary.sections.map((section: ProgressItemSummary): ResearchDatasetRow => ({ ...base, domain: "progress", item: section.id, metric: "percentage", value: section.percentage })),
      ...toGradesSummary(grades.get(participant.userId) ?? []).evaluations.map(
        (grade: StudentEvaluationGrade): ResearchDatasetRow => ({
          ...base,
          domain: "grades",
          item: pseudonymize(`${RESEARCH_EVALUATION_DOMAIN}${grade.evaluationId}`),
          metric: "grade",
          value: grade.grade,
        }),
      ),
      { ...base, domain: "simulation", item: "all", metric: "session_count", value: stats.sessionCount },
    ];

    if (stats.averageScore !== null) rows.push({ ...base, domain: "simulation", item: "all", metric: "average_score", value: stats.averageScore });
    if (stats.averageTimeToStabilizeSeconds !== null) rows.push({ ...base, domain: "simulation", item: "all", metric: "average_time_to_stabilize_s", value: stats.averageTimeToStabilizeSeconds });

    for (const usage of aiUsage.get(participant.userId) ?? []) {
      rows.push(
        { ...base, domain: "ai_telemetry", item: usage.useCase, metric: "calls", value: usage.calls },
        { ...base, domain: "ai_telemetry", item: usage.useCase, metric: "input_tokens", value: usage.inputTokens },
        { ...base, domain: "ai_telemetry", item: usage.useCase, metric: "output_tokens", value: usage.outputTokens },
      );

      if (usage.averageLatencyMs !== null) rows.push({ ...base, domain: "ai_telemetry", item: usage.useCase, metric: "average_latency_ms", value: round(usage.averageLatencyMs, 1) });
    }

    for (const rating of aiRatings.get(participant.userId) ?? []) {
      rows.push({ ...base, domain: "ai_ratings", item: rating.useCase, metric: "ratings", value: rating.ratings });

      if (rating.helpfulRate !== null) rows.push({ ...base, domain: "ai_ratings", item: rating.useCase, metric: "helpful_rate", value: round(rating.helpfulRate, 4) });

      for (const dimension of AI_RATING_DIMENSIONS) {
        const mean: number | undefined = rating.dimensions[dimension].mean;

        if (mean !== undefined) rows.push({ ...base, domain: "ai_ratings", item: rating.useCase, metric: `${dimension}_mean`, value: round(mean, 3) });
      }
    }

    return rows;
  });
}
