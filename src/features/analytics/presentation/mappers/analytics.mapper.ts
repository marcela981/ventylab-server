/*
 * Funcionalidad: Mapeador AnalyticsMapper
 * Descripción: Convierte los resultados de analítica (panel de grupo con nota aprobatoria, umbrales de riesgo, resumen por módulo, última actividad y riesgo por fila, línea de tiempo, estadísticas de evaluación resumen del estudiante y columnas del diccionario de datos de investigación) en sus DTOs de respuesta, con fechas ISO 8601, valores ausentes como null y el porcentaje de valoraciones útiles por caso de uso. v1.5: continueLearning del resumen del estudiante
 * Versión: 1.5
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversationSummary } from "@/features/ai-tutor/application/services/ai-tutor.facade";
import {
  type EvaluationAnalytics,
  type GroupDashboard,
  type GroupModuleSummary,
  type MySummary,
  type ProgressItemSummary,
  type StudentAiUseCaseUsage,
  type StudentDashboardRow,
  type StudentEvaluationGrade,
  type StudentProgressSummary,
  type StudentTimeline,
} from "@/features/analytics/application/results/analytics.results";
import { type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";
import {
  type EvaluationAnalyticsDTO,
  type GroupDashboardDTO,
  type MyEvaluationDTO,
  type MySummaryDTO,
  type ProgressItemDTO,
  type ResearchExportColumnDTO,
  type StudentDashboardRowDTO,
  type StudentProgressDTO,
  type StudentTimelineDTO,
  type TimelineEntryDTO,
} from "@/features/analytics/presentation/dtos/analytics-response.dto";
import { type ResearchExportColumnDefinition } from "@/features/analytics/presentation/utils/research-export-dictionary";
import { type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { type GradeHistogramBucket, type EvaluationQuestionStats } from "@/features/evaluation/domain/services/evaluation-analytics";
import { type NoteSummary } from "@/features/notes/application/services/notes.facade";
import { type UpcomingReservationSummary } from "@/features/reservations/application/services/reservations.facade";
import { type SimulationSessionView } from "@/features/simulation/domain/read-models/simulation-session.read-model";

function isoOrNull(value: Date | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toProgressItem(id: string | null, title: string | null, progress: LessonWeightedProgress | ProgressItemSummary): ProgressItemDTO {
  return { id, title, percentage: progress.percentage, completedLessons: progress.completedLessons, totalLessons: progress.totalLessons, completed: progress.completed };
}

function toItems(items: ProgressItemSummary[]): ProgressItemDTO[] {
  return items.map((item: ProgressItemSummary) => toProgressItem(item.id, item.title ?? null, item));
}

function toEvaluationDTO(assignment: EvaluationAssignmentResult): MyEvaluationDTO {
  return {
    assignmentId: assignment.id,
    evaluationId: assignment.evaluationId,
    evaluationTitle: assignment.evaluationTitle,
    evaluationType: assignment.evaluationType,
    startsAt: assignment.startsAt.toISOString(),
    endsAt: isoOrNull(assignment.endsAt),
  };
}

export class AnalyticsMapper {
  public static toProgressDTO(progress: StudentProgressSummary): StudentProgressDTO {
    return {
      overall: toProgressItem(null, null, progress.overall),
      sections: toItems(progress.sections),
      levels: toItems(progress.levels),
      modules: toItems(progress.modules),
    };
  }

  public static toDashboardRowDTO(row: StudentDashboardRow): StudentDashboardRowDTO {
    return {
      userId: row.userId,
      name: row.name ?? null,
      email: row.email,
      progress: AnalyticsMapper.toProgressDTO(row.progress),
      grades: {
        averageGrade: row.grades.averageGrade,
        evaluations: row.grades.evaluations.map((grade: StudentEvaluationGrade) => ({ ...grade, publishedAt: grade.publishedAt.toISOString() })),
      },
      simulation: { ...row.simulation },
      aiUsage: row.aiUsage.map((usage: StudentAiUseCaseUsage) => ({
        useCase: usage.useCase,
        calls: usage.calls,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        ratings: usage.ratings,
        helpfulPercentage: usage.helpfulRate,
      })),
      ventilatorHours: row.ventilatorHours,
      lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
      atRisk: row.atRisk,
      riskReasons: [...row.riskReasons],
      failedEvaluationIds: [...row.failedEvaluationIds],
    };
  }

  public static toDashboardDTO(dashboard: GroupDashboard): GroupDashboardDTO {
    return {
      groupId: dashboard.groupId,
      groupName: dashboard.groupName,
      generatedAt: dashboard.generatedAt.toISOString(),
      passingGrade: dashboard.passingGrade,
      riskThresholds: { ...dashboard.riskThresholds },
      moduleSummary: dashboard.moduleSummary.map((module: GroupModuleSummary) => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle ?? null,
        averageProgressPct: module.averageProgressPct,
        completedCount: module.completedCount,
        studentCount: module.studentCount,
      })),
      students: dashboard.students.map((row: StudentDashboardRow) => AnalyticsMapper.toDashboardRowDTO(row)),
    };
  }

  public static toTimelineDTO(timeline: StudentTimeline): StudentTimelineDTO {
    return {
      userId: timeline.userId,
      from: timeline.from.toISOString(),
      to: timeline.to.toISOString(),
      truncated: timeline.truncated,
      entries: timeline.entries.map(
        (entry: TimelineEntry): TimelineEntryDTO => ({
          kind: entry.kind,
          occurredAt: entry.occurredAt.toISOString(),
          referenceId: entry.referenceId,
          title: entry.title ?? null,
          status: entry.status ?? null,
          value: entry.value ?? null,
          endedAt: isoOrNull(entry.endedAt),
        }),
      ),
    };
  }

  public static toEvaluationDTO(analytics: EvaluationAnalytics): EvaluationAnalyticsDTO {
    const { stats } = analytics;

    return {
      evaluationId: analytics.evaluationId,
      groupId: analytics.groupId ?? null,
      title: analytics.title,
      type: analytics.type,
      totalAttempts: stats.totalAttempts,
      gradedCount: stats.gradedCount,
      publishedCount: stats.publishedCount,
      averageGrade: stats.averageGrade ?? null,
      medianGrade: stats.medianGrade ?? null,
      minGrade: stats.minGrade ?? null,
      maxGrade: stats.maxGrade ?? null,
      passRate: stats.passRate ?? null,
      passingGrade: stats.passingGrade,
      histogram: stats.histogram.map((bucket: GradeHistogramBucket) => ({ ...bucket })),
      questions: analytics.questions.map((question: EvaluationQuestionStats) => ({
        questionId: question.questionId,
        order: question.order,
        type: question.type,
        points: question.points,
        answeredCount: question.answeredCount,
        correctCount: question.correctCount,
        correctRate: question.correctRate ?? null,
        difficultyIndex: question.difficultyIndex ?? null,
      })),
    };
  }

  public static toResearchExportColumnDTO(definition: ResearchExportColumnDefinition): ResearchExportColumnDTO {
    return { column: definition.column, type: definition.type, description: definition.description, example: definition.example ?? null };
  }

  public static toMySummaryDTO(summary: MySummary): MySummaryDTO {
    return {
      progress: { overall: toProgressItem(null, null, summary.progress.overall), sections: toItems(summary.progress.sections) },
      grades: summary.grades.map((grade: EvaluationUserGrade) => ({
        attemptId: grade.attemptId,
        evaluationId: grade.evaluationId,
        evaluationTitle: grade.evaluationTitle,
        evaluationType: grade.evaluationType,
        moduleId: grade.moduleId ?? null,
        moduleTitle: grade.moduleTitle ?? null,
        attemptNumber: grade.attemptNumber,
        grade: grade.grade,
        passed: grade.passed,
        publishedAt: grade.publishedAt.toISOString(),
      })),
      activeEvaluations: summary.activeEvaluations.map((assignment: EvaluationAssignmentResult) => toEvaluationDTO(assignment)),
      upcomingEvaluations: summary.upcomingEvaluations.map((assignment: EvaluationAssignmentResult) => toEvaluationDTO(assignment)),
      latestNotes: summary.latestNotes.map((note: NoteSummary) => ({
        id: note.id,
        lessonId: note.lessonId,
        pageId: note.pageId ?? null,
        moduleId: note.moduleId ?? null,
        lessonTitle: note.lessonTitle ?? null,
        pageTitle: note.pageTitle ?? null,
        excerpt: note.excerpt,
        updatedAt: note.updatedAt.toISOString(),
      })),
      latestConversations: summary.latestConversations.map((conversation: AiConversationSummary) => ({
        id: conversation.id,
        scope: conversation.scope,
        refId: conversation.refId ?? null,
        title: conversation.title,
        updatedAt: conversation.updatedAt.toISOString(),
      })),
      latestSimulationSessions: summary.latestSimulationSessions.map((session: SimulationSessionView) => ({
        id: session.id,
        caseId: session.caseId,
        caseTitle: session.caseTitle ?? null,
        mode: session.mode,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        endedAt: isoOrNull(session.endedAt),
        score: session.score ?? null,
      })),
      upcomingReservations: summary.upcomingReservations.map((reservation: UpcomingReservationSummary) => ({
        id: reservation.id,
        holderType: reservation.holderType,
        groupId: reservation.groupId ?? null,
        startsAt: reservation.startsAt.toISOString(),
        endsAt: reservation.endsAt.toISOString(),
        purpose: reservation.purpose ?? null,
      })),
      unreadNotifications: summary.unreadNotifications,
      continueLearning: summary.continueLearning
        ? {
          moduleId: summary.continueLearning.moduleId,
          moduleTitle: summary.continueLearning.moduleTitle,
          lessonId: summary.continueLearning.lessonId,
          lessonTitle: summary.continueLearning.lessonTitle,
          percent: summary.continueLearning.percent,
        }
        : null,
    };
  }
}
