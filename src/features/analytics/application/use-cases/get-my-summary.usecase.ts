/*
 * Funcionalidad: Caso de uso GetMySummaryUseCase
 * Descripción: Resumen del propio usuario autenticado compuesto en paralelo desde las fachadas públicas: progreso por sección, notas publicadas, evaluaciones activas y próximas, últimas notas, últimas conversaciones con el tutor de IA, últimas sesiones de simulación, próximas reservas del ventilador y número de notificaciones sin leer (puerto enlazado por la raíz de composición)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AiTutorFacade } from "@/features/ai-tutor/application/services/ai-tutor.facade";
import {
  type IUnreadNotificationsCounter,
  UNREAD_NOTIFICATIONS_COUNTER_TOKEN,
} from "@/features/analytics/application/ports/unread-notifications-counter.interface";
import { type MySummary } from "@/features/analytics/application/results/analytics.results";
import { type AnalyticsActor } from "@/features/analytics/application/services/analytics-scope.service";
import { toProgressSummary } from "@/features/analytics/application/services/student-analytics.builder";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { ACTIVE_ASSIGNMENT_STATE, UPCOMING_ASSIGNMENT_STATE } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { NotesFacade } from "@/features/notes/application/services/notes.facade";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

export const MY_SUMMARY_LATEST_LIMIT: number = 5;

@Injectable()
export class GetMySummaryUseCase {
  public constructor(
    private readonly _progressFacade: LearningProgressFacade,
    private readonly _evaluationFacade: EvaluationFacade,
    private readonly _notesFacade: NotesFacade,
    private readonly _aiTutorFacade: AiTutorFacade,
    private readonly _simulationFacade: SimulationFacade,
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(UNREAD_NOTIFICATIONS_COUNTER_TOKEN)
    private readonly _unreadNotifications: IUnreadNotificationsCounter,
  ) {}

  public async execute(actor: AnalyticsActor): Promise<MySummary> {
    const now: Date = new Date();

    const [report, grades, assignments, latestNotes, latestConversations, sessions, upcomingReservations, unreadNotifications] = await Promise.all([
      this._progressFacade.getSummary(actor.id),
      this._evaluationFacade.getUserGrades(actor.id),
      this._evaluationFacade.getOpenAssignmentsOfStudent(actor.id),
      this._notesFacade.getLatestNotes(actor.id, MY_SUMMARY_LATEST_LIMIT),
      this._aiTutorFacade.getLatestConversations(actor.id, MY_SUMMARY_LATEST_LIMIT),
      this._simulationFacade.getUserSessions(actor.id, { page: 1, limit: MY_SUMMARY_LATEST_LIMIT, sortOrder: "desc" }),
      this._reservationsFacade.getUpcomingReservationsOfUser(actor.id, actor.role, now, MY_SUMMARY_LATEST_LIMIT),
      this._unreadNotifications.countUnread(actor.id),
    ]);

    return {
      progress: toProgressSummary(report),
      grades,
      activeEvaluations: assignments.filter((assignment: EvaluationAssignmentResult) => assignment.state === ACTIVE_ASSIGNMENT_STATE),
      upcomingEvaluations: assignments.filter((assignment: EvaluationAssignmentResult) => assignment.state === UPCOMING_ASSIGNMENT_STATE),
      latestNotes,
      latestConversations,
      latestSimulationSessions: sessions.data,
      upcomingReservations,
      unreadNotifications,
    };
  }
}
