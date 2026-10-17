/*
 * Funcionalidad: Resultados de analítica
 * Descripción: Tipos de salida de los casos de uso de analítica: panel de un grupo con una fila por estudiante (progreso por sección, nivel y módulo, notas por evaluación y promedio, sesiones de simulación, uso de IA por caso de uso con porcentaje de útiles y horas de ventilador), línea de tiempo de un estudiante, estadísticas de una evaluación con dificultad por pregunta, resumen del propio estudiante y filas anonimizadas del conjunto de datos de investigación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversationSummary } from "@/features/ai-tutor/application/services/ai-tutor.facade";
import { type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";
import { type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type EvaluationGradeStats, type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { type EvaluationQuestionStats } from "@/features/evaluation/domain/services/evaluation-analytics";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";
import { type NoteSummary } from "@/features/notes/application/services/notes.facade";
import { type UpcomingReservationSummary } from "@/features/reservations/application/services/reservations.facade";
import { type SimulationSessionView } from "@/features/simulation/domain/read-models/simulation-session.read-model";

export interface ProgressItemSummary {
  readonly id: string;
  readonly title?: string;
  readonly percentage: number;
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly completed: boolean;
}

export interface StudentProgressSummary {
  readonly overall: LessonWeightedProgress;
  readonly sections: ProgressItemSummary[];
  readonly levels: ProgressItemSummary[];
  readonly modules: ProgressItemSummary[];
}

export interface StudentEvaluationGrade {
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly attemptNumber: number;
  readonly grade: number;
  readonly passed: boolean;
  readonly publishedAt: Date;
}

export interface StudentGradesSummary {
  readonly averageGrade: number | null;
  readonly evaluations: StudentEvaluationGrade[];
}

export interface StudentSimulationSummary {
  readonly sessionCount: number;
  readonly averageScore: number | null;
  readonly averageTimeToStabilizeSeconds: number | null;
}

export interface StudentAiUseCaseUsage {
  readonly useCase: string;
  readonly calls: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly ratings: number;
  readonly helpfulRate: number | null;
}

export interface StudentDashboardRow {
  readonly userId: string;
  readonly name?: string;
  readonly email: string;
  readonly progress: StudentProgressSummary;
  readonly grades: StudentGradesSummary;
  readonly simulation: StudentSimulationSummary;
  readonly aiUsage: StudentAiUseCaseUsage[];
  readonly ventilatorHours: number;
}

export interface GroupDashboard {
  readonly groupId: string;
  readonly groupName: string;
  readonly generatedAt: Date;
  readonly students: StudentDashboardRow[];
}

export interface StudentTimeline {
  readonly userId: string;
  readonly from: Date;
  readonly to: Date;
  readonly entries: TimelineEntry[];
  readonly truncated: boolean;
}

export interface EvaluationAnalytics {
  readonly evaluationId: string;
  readonly title: string;
  readonly type: EvaluationTypeValue;
  readonly stats: EvaluationGradeStats;
  readonly questions: EvaluationQuestionStats[];
}

export interface MySummary {
  readonly progress: StudentProgressSummary;
  readonly grades: EvaluationUserGrade[];
  readonly activeEvaluations: EvaluationAssignmentResult[];
  readonly upcomingEvaluations: EvaluationAssignmentResult[];
  readonly latestNotes: NoteSummary[];
  readonly latestConversations: AiConversationSummary[];
  readonly latestSimulationSessions: SimulationSessionView[];
  readonly upcomingReservations: UpcomingReservationSummary[];
  readonly unreadNotifications: number;
}

export type ResearchDomainValue = "progress" | "grades" | "simulation" | "ai_ratings" | "ai_telemetry";

export interface ResearchDatasetRow {
  readonly participant: string;
  readonly group: string;
  readonly domain: ResearchDomainValue;
  readonly item: string;
  readonly metric: string;
  readonly value: number;
}
