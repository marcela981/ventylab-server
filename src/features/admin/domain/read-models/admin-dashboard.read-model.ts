/*
 * Funcionalidad: Modelos de lectura del panel de administración
 * Descripción: Vistas de solo lectura del panel docente y administrativo: listado paginado de estudiantes con avance ponderado por lecciones publicadas, grupos activos, código, si el solicitante puede abrir el detalle y su filtro (búsqueda y grupos), detalle de actividad de un estudiante, listado de profesores y estadísticas de la plataforma
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const ADMIN_STUDENT_SORT_BY_VALUES: readonly ["name", "email", "lastActivity", "progress"] = [
  "name",
  "email",
  "lastActivity",
  "progress",
] as const;

export type AdminStudentSortByValue = (typeof ADMIN_STUDENT_SORT_BY_VALUES)[number];

export type AdminSortOrderValue = "asc" | "desc";

export interface AdminActor {
  readonly id: string;
  readonly role: string;
}

export interface GetAdminStudentsQuery {
  readonly actor: AdminActor;
  readonly page: number;
  readonly limit: number;
  readonly groupId?: string;
  readonly myGroups: boolean;
  readonly search?: string;
  readonly sortBy: AdminStudentSortByValue;
  readonly sortOrder: AdminSortOrderValue;
}

// groupIds undefined = no group filter; an empty list matches nobody.
export interface AdminStudentFilter {
  readonly search?: string;
  readonly groupIds?: readonly string[];
}

export interface AdminStudentPageRequest {
  readonly sortBy: "name" | "email";
  readonly sortOrder: AdminSortOrderValue;
  readonly skip: number;
  readonly take: number;
}

export interface AdminGroupRef {
  readonly id: string;
  readonly name: string;
}

export interface AdminStudentRow {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly studentCode?: string;
  // Active STUDENT groups, for display.
  readonly activeGroups: AdminGroupRef[];
  // Every STUDENT group of the student, active or not, for the teacher scope.
  readonly groupIds: string[];
}

export interface StudentProgressSnapshot {
  readonly overallProgress: number;
  readonly completedModules: number;
  readonly totalModules: number;
  readonly lastActivity?: Date;
}

export interface ModuleProgressRecord {
  readonly progressPercentage: number;
  readonly isModuleCompleted: boolean;
  readonly lastAccessedAt?: Date;
}

export interface AdminStudentListItem extends StudentProgressSnapshot {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly studentCode?: string;
  readonly groupName?: string;
  readonly groups: AdminGroupRef[];
  readonly canView: boolean;
}

export interface AdminPersonView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface AdminStudentGroupView {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
  readonly memberRole: string;
}

export interface AdminStudentProfile {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: string;
  readonly image?: string;
  readonly createdAt: Date;
  readonly groups: AdminStudentGroupView[];
}

export interface AdminModuleProgressView {
  readonly moduleId: string;
  readonly moduleTitle: string;
  readonly levelTitle?: string;
  readonly status: string;
  readonly progressPercentage: number;
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly timeSpentSeconds: number;
  readonly lastAccessedAt: Date;
  readonly completedAt?: Date;
  readonly isModuleCompleted: boolean;
}

export interface AdminLessonCompletionView {
  readonly lessonId: string;
  readonly lessonTitle: string;
  readonly moduleId: string;
  readonly isCompleted: boolean;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly timeSpentSeconds: number;
  readonly completedAt?: Date;
}

export interface AdminEvaluationAttemptView {
  readonly attemptId: string;
  readonly caseId: string;
  readonly caseTitle: string;
  readonly difficulty: string;
  readonly pathology: string;
  readonly score: number;
  readonly isSuccessful: boolean;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

export interface AdminQuizAttemptView {
  readonly quizId: string;
  readonly quizTitle: string;
  readonly score: number;
  readonly passed: boolean;
  readonly startedAt: Date;
}

export interface AdminSimulatorSessionView {
  readonly sessionId: string;
  readonly isRealVentilator: boolean;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly clinicalCaseId?: string;
}

export interface AdminScoreView {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly points: number;
  readonly maxPoints: number;
  readonly comments?: string;
  readonly grader: AdminPersonView;
  readonly createdAt: Date;
}

export interface AdminStudentActivity {
  readonly moduleProgress: AdminModuleProgressView[];
  readonly lessonCompletions: AdminLessonCompletionView[];
  readonly evaluationAttempts: AdminEvaluationAttemptView[];
  readonly quizAttempts: AdminQuizAttemptView[];
  readonly simulatorSessions: AdminSimulatorSessionView[];
  readonly scores: AdminScoreView[];
}

export interface AdminStudentStatistics {
  readonly totalTimeSpentSeconds: number;
  readonly completedModules: number;
  readonly totalModules: number;
  readonly overallProgress: number;
  readonly evaluationsTaken: number;
  readonly evaluationsPassed: number;
  readonly evaluationsPassRate: number;
  readonly averageEvaluationScore: number;
  readonly simulatorSessions: number;
  readonly quizzesTaken: number;
  readonly achievementsUnlocked: number;
}

export interface AdminStudentProgressDetail extends AdminStudentActivity {
  readonly user: AdminStudentProfile;
  readonly statistics: AdminStudentStatistics;
}

export interface AdminTeacherItem {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: string;
  readonly image?: string;
  readonly createdAt: Date;
  readonly groups: { readonly id: string; readonly name: string }[];
  readonly studentCount: number;
  readonly groupsCreated: number;
}

export interface RecentActivityItem {
  readonly userId: string;
  readonly userName?: string;
  readonly action: string;
  readonly timestamp?: Date;
}

export interface PlatformCounts {
  readonly totalStudents: number;
  readonly activeStudents: number;
  readonly totalTeachers: number;
  readonly totalAdmins: number;
  readonly totalGroups: number;
  readonly totalModules: number;
  readonly publishedModules: number;
  readonly totalLessons: number;
  readonly totalEvaluations: number;
  readonly totalSimulatorSessions: number;
  readonly completionsToday: number;
  readonly studentsWithCompletedModule: number;
  readonly averageProgressPercentage?: number;
  readonly recentCompletions: { readonly userId: string; readonly userName?: string; readonly lessonTitle: string; readonly completedAt?: Date }[];
  readonly activeReservation?: { readonly userId: string; readonly groupId?: string; readonly leaderId?: string };
}

export interface PlatformStatistics {
  readonly totalStudents: number;
  readonly activeStudents: number;
  readonly totalTeachers: number;
  readonly totalAdmins: number;
  readonly totalGroups: number;
  readonly totalModules: number;
  readonly publishedModules: number;
  readonly totalLessons: number;
  readonly totalEvaluations: number;
  readonly totalSimulatorSessions: number;
  readonly averageProgress: number;
  readonly completionRate: number;
  readonly completionsToday: number;
  readonly recentActivity: RecentActivityItem[];
  readonly hasActiveReservation: boolean;
  readonly activeReservationUserId?: string;
  readonly activeReservationGroupId?: string;
  readonly activeReservationLeaderId?: string;
  readonly generatedAt: Date;
}
