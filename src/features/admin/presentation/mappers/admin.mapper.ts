/*
 * Funcionalidad: Mapper de presentación del panel de administración
 * Descripción: Convierte las vistas del modelo de lectura del panel (estudiantes, detalle de estudiante, profesores y estadísticas) a los DTOs de respuesta de /api/admin
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AdminEvaluationAttemptView,
  type AdminLessonCompletionView,
  type AdminModuleProgressView,
  type AdminQuizAttemptView,
  type AdminScoreView,
  type AdminSimulatorSessionView,
  type AdminStudentGroupView,
  type AdminStudentListItem,
  type AdminStudentProgressDetail,
  type AdminTeacherItem,
  type PlatformStatistics,
  type RecentActivityItem,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  AdminTeacherDTO,
  AdminTeacherGroupDTO,
  PlatformStatisticsDTO,
  RecentActivityDTO,
} from "@/features/admin/presentation/dtos/admin-platform.dto";
import {
  AdminEvaluationAttemptDTO,
  AdminGraderDTO,
  AdminLessonCompletionDTO,
  AdminModuleProgressDTO,
  AdminQuizAttemptDTO,
  AdminScoreDTO,
  AdminSimulatorSessionDTO,
  AdminStudentGroupDTO,
  AdminStudentListItemDTO,
  AdminStudentProfileDTO,
  AdminStudentProgressDTO,
  AdminStudentStatisticsDTO,
} from "@/features/admin/presentation/dtos/admin-student.dto";

export class AdminMapper {
  public static toStudentListItemDTO(item: AdminStudentListItem): AdminStudentListItemDTO {
    return new AdminStudentListItemDTO({
      id: item.id,
      name: item.name ?? null,
      email: item.email,
      lastActivity: item.lastActivity ?? null,
      overallProgress: item.overallProgress,
      completedModules: item.completedModules,
      totalModules: item.totalModules,
      groupName: item.groupName ?? null,
    });
  }

  public static toStudentProgressDTO(detail: AdminStudentProgressDetail): AdminStudentProgressDTO {
    return new AdminStudentProgressDTO({
      user: new AdminStudentProfileDTO({
        id: detail.user.id,
        name: detail.user.name ?? null,
        email: detail.user.email,
        role: detail.user.role,
        image: detail.user.image ?? null,
        createdAt: detail.user.createdAt,
        groups: detail.user.groups.map((group: AdminStudentGroupView) => new AdminStudentGroupDTO(group)),
      }),
      moduleProgress: detail.moduleProgress.map(
        (progress: AdminModuleProgressView) =>
          new AdminModuleProgressDTO({
            moduleId: progress.moduleId,
            moduleTitle: progress.moduleTitle,
            levelTitle: progress.levelTitle ?? null,
            status: progress.status,
            progressPercentage: progress.progressPercentage,
            completedLessons: progress.completedLessons,
            totalLessons: progress.totalLessons,
            timeSpentSeconds: progress.timeSpentSeconds,
            lastAccessedAt: progress.lastAccessedAt,
            completedAt: progress.completedAt ?? null,
          }),
      ),
      lessonCompletions: detail.lessonCompletions.map(
        (completion: AdminLessonCompletionView) => new AdminLessonCompletionDTO({ ...completion, completedAt: completion.completedAt ?? null }),
      ),
      evaluationAttempts: detail.evaluationAttempts.map(
        (attempt: AdminEvaluationAttemptView) => new AdminEvaluationAttemptDTO({ ...attempt, completedAt: attempt.completedAt ?? null }),
      ),
      quizAttempts: detail.quizAttempts.map((attempt: AdminQuizAttemptView) => new AdminQuizAttemptDTO(attempt)),
      simulatorSessions: detail.simulatorSessions.map(
        (session: AdminSimulatorSessionView) =>
          new AdminSimulatorSessionDTO({
            sessionId: session.sessionId,
            isRealVentilator: session.isRealVentilator,
            startedAt: session.startedAt,
            completedAt: session.completedAt ?? null,
            clinicalCaseId: session.clinicalCaseId ?? null,
          }),
      ),
      scores: detail.scores.map(
        (score: AdminScoreView) =>
          new AdminScoreDTO({
            id: score.id,
            entityType: score.entityType,
            entityId: score.entityId,
            points: score.points,
            maxPoints: score.maxPoints,
            comments: score.comments ?? null,
            grader: new AdminGraderDTO({ id: score.grader.id, name: score.grader.name ?? null, email: score.grader.email }),
            createdAt: score.createdAt,
          }),
      ),
      statistics: new AdminStudentStatisticsDTO(detail.statistics),
    });
  }

  public static toTeacherDTO(teacher: AdminTeacherItem): AdminTeacherDTO {
    return new AdminTeacherDTO({
      id: teacher.id,
      name: teacher.name ?? null,
      email: teacher.email,
      role: teacher.role,
      image: teacher.image ?? null,
      createdAt: teacher.createdAt,
      groups: teacher.groups.map((group: { id: string; name: string }) => new AdminTeacherGroupDTO(group)),
      studentCount: teacher.studentCount,
      groupsCreated: teacher.groupsCreated,
    });
  }

  public static toStatisticsDTO(statistics: PlatformStatistics): PlatformStatisticsDTO {
    return new PlatformStatisticsDTO({
      totalStudents: statistics.totalStudents,
      activeStudents: statistics.activeStudents,
      totalTeachers: statistics.totalTeachers,
      totalAdmins: statistics.totalAdmins,
      totalGroups: statistics.totalGroups,
      totalModules: statistics.totalModules,
      publishedModules: statistics.publishedModules,
      totalLessons: statistics.totalLessons,
      totalEvaluations: statistics.totalEvaluations,
      totalSimulatorSessions: statistics.totalSimulatorSessions,
      averageProgress: statistics.averageProgress,
      completionRate: statistics.completionRate,
      completionsToday: statistics.completionsToday,
      recentActivity: statistics.recentActivity.map(
        (activity: RecentActivityItem) =>
          new RecentActivityDTO({
            userId: activity.userId,
            userName: activity.userName ?? null,
            action: activity.action,
            timestamp: activity.timestamp ?? null,
          }),
      ),
      hasActiveReservation: statistics.hasActiveReservation,
      activeReservationUserId: statistics.activeReservationUserId ?? null,
      activeReservationGroupId: statistics.activeReservationGroupId ?? null,
      activeReservationLeaderId: statistics.activeReservationLeaderId ?? null,
      generatedAt: statistics.generatedAt,
    });
  }
}
