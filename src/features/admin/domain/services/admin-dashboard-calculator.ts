/*
 * Funcionalidad: Cálculos del panel de administración
 * Descripción: Funciones puras que resumen el avance por módulos de un estudiante (promedio redondeado, módulos completados, última actividad), ordenan el listado por campos calculados y derivan las estadísticas del estudiante y de la plataforma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AdminEvaluationAttemptView,
  type AdminModuleProgressView,
  type AdminStudentActivity,
  type AdminStudentListItem,
  type AdminStudentSortByValue,
  type AdminStudentStatistics,
  type ModuleProgressRecord,
  type PlatformCounts,
  type PlatformStatistics,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";

export interface ModuleProgressSummary {
  readonly overallProgress: number;
  readonly completedModules: number;
  readonly totalModules: number;
  readonly lastActivity?: Date;
}

export function summarizeModuleProgress(records: ModuleProgressRecord[]): ModuleProgressSummary {
  const totalModules: number = records.length;
  let lastActivity: Date | undefined;

  for (const record of records) {
    if (record.lastAccessedAt && (!lastActivity || record.lastAccessedAt > lastActivity)) {
      lastActivity = record.lastAccessedAt;
    }
  }

  return {
    overallProgress:
      totalModules > 0
        ? Math.round(records.reduce((sum: number, record: ModuleProgressRecord) => sum + record.progressPercentage, 0) / totalModules)
        : 0,
    completedModules: records.filter((record: ModuleProgressRecord) => record.isModuleCompleted).length,
    totalModules,
    lastActivity,
  };
}

export function sortStudentsByComputedField(
  students: AdminStudentListItem[],
  sortBy: AdminStudentSortByValue,
  sortOrder: "asc" | "desc",
): AdminStudentListItem[] {
  const valueOf = (student: AdminStudentListItem): number =>
    sortBy === "lastActivity" ? (student.lastActivity?.getTime() ?? 0) : student.overallProgress;

  return [...students].sort((a: AdminStudentListItem, b: AdminStudentListItem): number =>
    sortOrder === "asc" ? valueOf(a) - valueOf(b) : valueOf(b) - valueOf(a),
  );
}

export function computeStudentStatistics(activity: AdminStudentActivity, achievementsUnlocked: number): AdminStudentStatistics {
  const summary: ModuleProgressSummary = summarizeModuleProgress(
    activity.moduleProgress.map((progress: AdminModuleProgressView) => ({
      progressPercentage: progress.progressPercentage,
      isModuleCompleted: progress.isModuleCompleted,
    })),
  );
  const evaluations: AdminEvaluationAttemptView[] = activity.evaluationAttempts;
  const passed: number = evaluations.filter((evaluation: AdminEvaluationAttemptView) => evaluation.isSuccessful).length;

  return {
    totalTimeSpentSeconds: activity.moduleProgress.reduce((sum: number, progress: AdminModuleProgressView) => sum + progress.timeSpentSeconds, 0),
    completedModules: summary.completedModules,
    totalModules: summary.totalModules,
    overallProgress: summary.overallProgress,
    evaluationsTaken: evaluations.length,
    evaluationsPassed: passed,
    evaluationsPassRate: evaluations.length > 0 ? Math.round((passed / evaluations.length) * 100) : 0,
    averageEvaluationScore:
      evaluations.length > 0
        ? Math.round(evaluations.reduce((sum: number, evaluation: AdminEvaluationAttemptView) => sum + evaluation.score, 0) / evaluations.length)
        : 0,
    simulatorSessions: activity.simulatorSessions.length,
    quizzesTaken: activity.quizAttempts.length,
    achievementsUnlocked,
  };
}

export function buildPlatformStatistics(counts: PlatformCounts, generatedAt: Date): PlatformStatistics {
  return {
    totalStudents: counts.totalStudents,
    activeStudents: counts.activeStudents,
    totalTeachers: counts.totalTeachers,
    totalAdmins: counts.totalAdmins,
    totalGroups: counts.totalGroups,
    totalModules: counts.totalModules,
    publishedModules: counts.totalModules,
    totalLessons: counts.totalLessons,
    totalEvaluations: counts.totalEvaluations,
    totalSimulatorSessions: counts.totalSimulatorSessions,
    averageProgress: Math.round(counts.averageProgressPercentage ?? 0),
    completionRate: counts.totalStudents > 0 ? Math.round((counts.studentsWithCompletedModule / counts.totalStudents) * 100) : 0,
    completionsToday: counts.completionsToday,
    recentActivity: counts.recentCompletions.map((completion: PlatformCounts["recentCompletions"][number]) => ({
      userId: completion.userId,
      userName: completion.userName,
      action: `Completó la lección: ${completion.lessonTitle}`,
      timestamp: completion.completedAt,
    })),
    hasActiveReservation: counts.activeReservation !== undefined,
    activeReservationUserId: counts.activeReservation?.userId,
    activeReservationGroupId: counts.activeReservation?.groupId,
    activeReservationLeaderId: counts.activeReservation?.leaderId,
    generatedAt,
  };
}
