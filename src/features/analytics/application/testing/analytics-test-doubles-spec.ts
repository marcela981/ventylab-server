/*
 * Funcionalidad: Dobles de prueba de analítica
 * Descripción: Fachadas falsas (grupos, progreso, evaluaciones, simulación, telemetría y valoraciones de IA, reservas, notas y tutor) con métodos jest.fn que responden datos deterministas para N estudiantes, y el arnés que construye el servicio de alcance, la caché, el lector por lotes y los casos de uso de analítica sobre ellas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type AiRatingsFacade } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiTutorFacade } from "@/features/ai-tutor/application/services/ai-tutor.facade";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { type AnalyticsActor, AnalyticsScopeService } from "@/features/analytics/application/services/analytics-scope.service";
import { StudentAnalyticsSourcesReader } from "@/features/analytics/application/services/student-analytics-sources.reader";
import { ExportResearchDatasetUseCase } from "@/features/analytics/application/use-cases/export-research-dataset.usecase";
import { GetEvaluationAnalyticsUseCase } from "@/features/analytics/application/use-cases/get-evaluation-analytics.usecase";
import { GetGroupDashboardUseCase } from "@/features/analytics/application/use-cases/get-group-dashboard.usecase";
import { GetMySummaryUseCase } from "@/features/analytics/application/use-cases/get-my-summary.usecase";
import { GetStudentTimelineUseCase } from "@/features/analytics/application/use-cases/get-student-timeline.usecase";
import { HmacPseudonymizer } from "@/features/analytics/infrastructure/security/hmac-pseudonymizer";
import { type EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type GroupMemberSummary, type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type NotesFacade } from "@/features/notes/application/services/notes.facade";
import { type LearningProgressFacade, type UserLearningProgress } from "@/features/progress/application/services/learning-progress.facade";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

export const ADMIN: AnalyticsActor = { id: "admin-1", role: "ADMIN" };
export const TEACHER: AnalyticsActor = { id: "teacher-1", role: "TEACHER" };
export const OTHER_TEACHER: AnalyticsActor = { id: "teacher-2", role: "TEACHER" };

export const GROUP_ID: string = "group-1";
export const SALT: string = "a-test-salt-of-32-characters-xyz";
export const PUBLISHED_AT: Date = new Date("2026-10-01T10:00:00.000Z");

export function studentId(index: number): string {
  return `student-${String(index + 1).padStart(2, "0")}`;
}

export function buildStudents(count: number): GroupMemberSummary[] {
  return Array.from({ length: count }, (_value: unknown, index: number): GroupMemberSummary => ({
    userId: studentId(index),
    name: `Student Name ${index + 1}`,
    email: `student${index + 1}@example.edu`,
    userRole: "STUDENT",
    memberRole: "MEMBER",
  }));
}

function progressOf(userIds: readonly string[]): UserLearningProgress[] {
  return userIds.map(
    (userId: string): UserLearningProgress => ({
      userId,
      report: {
        overall: { completedLessons: 2, totalLessons: 4, percentage: 50, completed: false },
        modules: [{ moduleId: "module-1", levelId: "level-1", lessons: [], completedLessons: 2, totalLessons: 4, percentage: 50, completed: false }],
        levels: [{ levelId: "level-1", sectionId: "section-1", modules: [], completedModules: 0, totalModules: 1, completedLessons: 2, totalLessons: 4, percentage: 50, completed: false }],
        sections: [{ sectionId: "section-1", levels: [], completedLevels: 0, totalLevels: 1, completedLessons: 2, totalLessons: 4, percentage: 50, completed: false }],
      },
    }),
  );
}

export interface FakeFacades {
  groups: { [K in "getGroupSummary" | "canManageGroup" | "canManageAnyGroupOfUser" | "getGroupMembers" | "getStudentMemberships"]: jest.Mock };
  progress: { getProgressForUsers: jest.Mock; getLessonCompletionsOfUser: jest.Mock; getSummary: jest.Mock };
  evaluation: {
    [K in
      | "getGradesForUsers"
      | "getEvaluationReference"
      | "getEvaluationStats"
      | "getEvaluationQuestionStats"
      | "getAttemptActivityOfUser"
      | "getUserGrades"
      | "getOpenAssignmentsOfStudent"]: jest.Mock;
  };
  simulation: { getSessionStatsForUsers: jest.Mock; getSessionActivityOfUser: jest.Mock; getUserSessions: jest.Mock };
  aiTelemetry: { getUsageForUsers: jest.Mock };
  aiRatings: { getHelpfulnessForUsers: jest.Mock };
  reservations: { getVentilatorUsageForUsers: jest.Mock; getReservationActivityOfUser: jest.Mock; getUpcomingReservationsOfUser: jest.Mock };
  notes: { getLatestNotes: jest.Mock };
  aiTutor: { getLatestConversations: jest.Mock };
  unread: { countUnread: jest.Mock };
}

export function buildFakeFacades(students: GroupMemberSummary[]): FakeFacades {
  return {
    groups: {
      getGroupSummary: jest
        .fn()
        .mockImplementation((groupId: string) => Promise.resolve(groupId === GROUP_ID ? { id: GROUP_ID, name: "Group A", type: "STUDENT", isActive: true } : undefined)),
      canManageGroup: jest.fn().mockImplementation((actor: AnalyticsActor, groupId: string) => Promise.resolve(actor.id === TEACHER.id && groupId === GROUP_ID)),
      canManageAnyGroupOfUser: jest.fn().mockImplementation((actor: AnalyticsActor) => Promise.resolve(actor.id === TEACHER.id)),
      getGroupMembers: jest.fn().mockResolvedValue([...students, { userId: TEACHER.id, email: "teacher@example.edu", userRole: "TEACHER", memberRole: "MEMBER" }]),
      getStudentMemberships: jest.fn().mockResolvedValue(students.map((student: GroupMemberSummary) => ({ userId: student.userId, groupId: GROUP_ID }))),
    },
    progress: {
      getProgressForUsers: jest.fn().mockImplementation((userIds: string[]) => Promise.resolve(progressOf(userIds))),
      getLessonCompletionsOfUser: jest.fn().mockResolvedValue([]),
      getSummary: jest.fn().mockImplementation(() => Promise.resolve(progressOf(["self"])[0].report)),
    },
    evaluation: {
      getGradesForUsers: jest.fn().mockImplementation((userIds: string[]) =>
        Promise.resolve(
          userIds.flatMap((userId: string) => [
            {
              attemptId: `${userId}-a1`,
              evaluationId: "evaluation-1",
              evaluationTitle: "Exam",
              evaluationType: "EXAM",
              userId,
              attemptNumber: 1,
              grade: 2,
              passed: false,
              publishedAt: PUBLISHED_AT,
              legacy: false,
            },
            {
              attemptId: `${userId}-a2`,
              evaluationId: "evaluation-1",
              evaluationTitle: "Exam",
              evaluationType: "EXAM",
              userId,
              attemptNumber: 2,
              grade: 4,
              passed: true,
              publishedAt: PUBLISHED_AT,
              legacy: false,
            },
          ]),
        ),
      ),
      getEvaluationReference: jest
        .fn()
        .mockImplementation((id: string) => Promise.resolve(id === "evaluation-1" ? { id, title: "Exam", type: "EXAM", assignedGroupIds: [GROUP_ID] } : undefined)),
      getEvaluationStats: jest.fn().mockResolvedValue({
        evaluationId: "evaluation-1",
        attemptsByStatus: { IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 0, GRADED: 2 },
        totalAttempts: 2,
        publishedCount: 2,
        gradedCount: 2,
        averageGrade: 3,
        medianGrade: 3,
        minGrade: 2,
        maxGrade: 4,
        histogram: [],
        passRate: 0.5,
        passingGrade: 3,
      }),
      getEvaluationQuestionStats: jest.fn().mockResolvedValue([]),
      getAttemptActivityOfUser: jest.fn().mockResolvedValue([]),
      getUserGrades: jest.fn().mockResolvedValue([]),
      getOpenAssignmentsOfStudent: jest.fn().mockResolvedValue([]),
    },
    simulation: {
      getSessionStatsForUsers: jest.fn().mockImplementation((userIds: string[]) =>
        Promise.resolve(
          userIds.map((userId: string) => ({ userId, sessionCount: 2, scoredCount: 2, averageScore: 81.234, stabilizedCount: 1, averageTimeToStabilizeSeconds: 120.06 })),
        ),
      ),
      getSessionActivityOfUser: jest.fn().mockResolvedValue([]),
      getUserSessions: jest.fn().mockResolvedValue({ data: [], pagination: { total: 0, pages: 0, page: 1, limit: 5 } }),
    },
    aiTelemetry: {
      getUsageForUsers: jest
        .fn()
        .mockImplementation((userIds: string[]) =>
          Promise.resolve(userIds.map((userId: string) => ({ userId, useCase: "FREE_CHAT", calls: 3, inputTokens: 30, outputTokens: 10, averageLatencyMs: 800 }))),
        ),
    },
    aiRatings: {
      getHelpfulnessForUsers: jest.fn().mockImplementation((userIds: string[]) =>
        Promise.resolve(
          userIds.map((userId: string) => ({
            userId,
            useCase: "FREE_CHAT",
            ratings: 3,
            helpfulCount: 2,
            helpfulRate: 2 / 3,
            dimensions: { quality: { mean: 4, n: 3 }, understanding: { n: 0 }, expression: { n: 0 }, safety: { n: 0 }, trust: { n: 0 } },
          })),
        ),
      ),
    },
    reservations: {
      getVentilatorUsageForUsers: jest.fn().mockImplementation((userIds: string[]) => Promise.resolve(userIds.map((userId: string) => ({ userId, reservations: 1, hours: 1.25 })))),
      getReservationActivityOfUser: jest.fn().mockResolvedValue([]),
      getUpcomingReservationsOfUser: jest.fn().mockResolvedValue([]),
    },
    notes: { getLatestNotes: jest.fn().mockResolvedValue([]) },
    aiTutor: { getLatestConversations: jest.fn().mockResolvedValue([]) },
    unread: { countUnread: jest.fn().mockResolvedValue(4) },
  };
}

export function batchMocks(facades: FakeFacades): jest.Mock[] {
  return [
    facades.progress.getProgressForUsers,
    facades.evaluation.getGradesForUsers,
    facades.simulation.getSessionStatsForUsers,
    facades.aiTelemetry.getUsageForUsers,
    facades.aiRatings.getHelpfulnessForUsers,
    facades.reservations.getVentilatorUsageForUsers,
  ];
}

export function fakeConfig(salt: string | undefined): ConfigService<EnvironmentVariables> {
  return { get: (key: string): unknown => (key === "ANALYTICS_EXPORT_SALT" ? salt : undefined) } as unknown as ConfigService<EnvironmentVariables>;
}

export interface AnalyticsHarness {
  facades: FakeFacades;
  cache: AnalyticsCache;
  dashboard: GetGroupDashboardUseCase;
  timeline: GetStudentTimelineUseCase;
  evaluation: GetEvaluationAnalyticsUseCase;
  summary: GetMySummaryUseCase;
  research: ExportResearchDatasetUseCase;
}

export function buildAnalyticsHarness(students: GroupMemberSummary[], salt: string | null = SALT): AnalyticsHarness {
  const facades: FakeFacades = buildFakeFacades(students);
  const groups: GroupsFacade = facades.groups as unknown as GroupsFacade;
  const progress: LearningProgressFacade = facades.progress as unknown as LearningProgressFacade;
  const evaluation: EvaluationFacade = facades.evaluation as unknown as EvaluationFacade;
  const simulation: SimulationFacade = facades.simulation as unknown as SimulationFacade;
  const reservations: ReservationsFacade = facades.reservations as unknown as ReservationsFacade;
  const cache: AnalyticsCache = new AnalyticsCache();
  const scope: AnalyticsScopeService = new AnalyticsScopeService(groups, evaluation);
  const reader: StudentAnalyticsSourcesReader = new StudentAnalyticsSourcesReader(
    progress,
    evaluation,
    simulation,
    facades.aiTelemetry as unknown as AiTelemetryFacade,
    facades.aiRatings as unknown as AiRatingsFacade,
    reservations,
  );

  return {
    facades,
    cache,
    dashboard: new GetGroupDashboardUseCase(scope, cache, groups, reader),
    timeline: new GetStudentTimelineUseCase(scope, cache, progress, evaluation, simulation, reservations),
    evaluation: new GetEvaluationAnalyticsUseCase(scope, cache, evaluation),
    summary: new GetMySummaryUseCase(
      progress,
      evaluation,
      facades.notes as unknown as NotesFacade,
      facades.aiTutor as unknown as AiTutorFacade,
      simulation,
      reservations,
      facades.unread,
    ),
    research: new ExportResearchDatasetUseCase(new HmacPseudonymizer(fakeConfig(salt ?? undefined)), groups, reader),
  };
}
