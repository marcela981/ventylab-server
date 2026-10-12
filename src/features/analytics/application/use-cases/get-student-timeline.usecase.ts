/*
 * Funcionalidad: Caso de uso GetStudentTimelineUseCase
 * Descripción: Arma la línea de tiempo de actividad de un estudiante en un rango (por defecto los últimos 30 días, máximo 366): verifica el alcance del solicitante (para un profesor, un usuario STUDENT miembro de uno de sus grupos STUDENT), pide en paralelo una lectura por fuente a cada fachada (lecciones completadas, intentos de evaluación limitados para un profesor a las asignaciones de sus grupos o sin asignación de evaluaciones que creó, sesiones de simulación y reservas, hasta 200 por fuente leyendo una más para detectar el recorte) y las fusiona y ordena en memoria, marcando truncated si alguna fuente o el total se recortó, con caché de 60 s por estudiante, rango, solicitante y grupos en alcance
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type StudentTimeline } from "@/features/analytics/application/results/analytics.results";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { type AnalyticsActor, AnalyticsScopeService } from "@/features/analytics/application/services/analytics-scope.service";
import { type MergedTimeline, mergeTimeline, type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";
import { type AnalyticsRange, resolveAnalyticsRange } from "@/features/analytics/domain/services/analytics-range";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type EvaluationAttemptActivityView, type EvaluationAttemptScope } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { type LessonCompletionActivity } from "@/features/progress/domain/repositories/progress-analytics.repository";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type ReservationActivityView } from "@/features/reservations/domain/repositories/reservation-analytics.repository";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { type SimulationSessionActivityView } from "@/features/simulation/domain/repositories/simulation-analytics.repository";

export const TIMELINE_LIMIT_PER_SOURCE: number = 200;

export const TIMELINE_MAX_ENTRIES: number = 500;

const MINUTE_MS: number = 60_000;

function capped<T>(items: T[]): { items: T[]; capped: boolean } {
  return { items: items.slice(0, TIMELINE_LIMIT_PER_SOURCE), capped: items.length > TIMELINE_LIMIT_PER_SOURCE };
}

function isInRange(date: Date, range: AnalyticsRange): boolean {
  return date.getTime() >= range.from.getTime() && date.getTime() < range.to.getTime();
}

function lessonEntries(items: LessonCompletionActivity[]): TimelineEntry[] {
  return items.map(
    (item: LessonCompletionActivity): TimelineEntry => ({ kind: "LESSON_COMPLETED", occurredAt: item.completedAt, referenceId: item.lessonId, title: item.lessonTitle }),
  );
}

function evaluationEntries(items: EvaluationAttemptActivityView[], range: AnalyticsRange): TimelineEntry[] {
  return items.flatMap((item: EvaluationAttemptActivityView): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    if (isInRange(item.startedAt, range)) {
      entries.push({ kind: "EVALUATION_STARTED", occurredAt: item.startedAt, referenceId: item.evaluationId, title: item.evaluationTitle, status: item.status });
    }

    if (item.submittedAt !== undefined && isInRange(item.submittedAt, range)) {
      entries.push({
        kind: "EVALUATION_SUBMITTED",
        occurredAt: item.submittedAt,
        referenceId: item.evaluationId,
        title: item.evaluationTitle,
        status: item.status,
        value: item.publishedGrade,
      });
    }

    return entries;
  });
}

function simulationEntries(items: SimulationSessionActivityView[]): TimelineEntry[] {
  return items.map(
    (item: SimulationSessionActivityView): TimelineEntry => ({
      kind: "SIMULATION_SESSION",
      occurredAt: item.startedAt,
      referenceId: item.sessionId,
      status: item.status,
      value: item.score,
      endedAt: item.endedAt,
    }),
  );
}

function reservationEntries(items: ReservationActivityView[]): TimelineEntry[] {
  return items.map(
    (item: ReservationActivityView): TimelineEntry => ({
      kind: "RESERVATION",
      occurredAt: item.startsAt,
      referenceId: item.reservationId,
      status: item.status,
      endedAt: item.endsAt,
    }),
  );
}

/**
 * @throws {AnalyticsScopeForbiddenError} If the requester neither administers the platform nor manages a student group the target student belongs to
 * @throws {InvalidAnalyticsRangeError} If the range does not start before it ends or spans more than 366 days
 */
@Injectable()
export class GetStudentTimelineUseCase {
  public constructor(
    private readonly _scope: AnalyticsScopeService,
    private readonly _cache: AnalyticsCache,
    private readonly _progressFacade: LearningProgressFacade,
    private readonly _evaluationFacade: EvaluationFacade,
    private readonly _simulationFacade: SimulationFacade,
    private readonly _reservationsFacade: ReservationsFacade,
  ) {}

  public async execute(actor: AnalyticsActor, userId: string, from?: Date, to?: Date): Promise<StudentTimeline> {
    // Rounded up to the minute so repeated default requests share one cache entry without hiding the latest activity
    const now: Date = new Date(Math.ceil(Date.now() / MINUTE_MS) * MINUTE_MS);
    const range: AnalyticsRange = resolveAnalyticsRange(from, to, now);

    const attemptScope: EvaluationAttemptScope | undefined = await this._scope.assertStudentInScope(actor, userId);
    const key: string = `timeline:${userId}:${range.from.toISOString()}:${range.to.toISOString()}:${this._scope.scopeKey(actor, attemptScope)}`;

    return await this._cache.getOrLoad(key, () => this._build(userId, range, attemptScope));
  }

  private async _build(userId: string, range: AnalyticsRange, attemptScope?: EvaluationAttemptScope): Promise<StudentTimeline> {
    // One extra row per source tells whether the source itself was capped
    const fetchLimit: number = TIMELINE_LIMIT_PER_SOURCE + 1;
    const [lessons, attempts, sessions, reservations] = await Promise.all([
      this._progressFacade.getLessonCompletionsOfUser(userId, range, fetchLimit).then(capped),
      this._evaluationFacade.getAttemptActivityOfUser(userId, range, fetchLimit, attemptScope).then(capped),
      this._simulationFacade.getSessionActivityOfUser(userId, range, fetchLimit).then(capped),
      this._reservationsFacade.getReservationActivityOfUser(userId, range, fetchLimit).then(capped),
    ]);

    const merged: MergedTimeline = mergeTimeline(
      [lessonEntries(lessons.items), evaluationEntries(attempts.items, range), simulationEntries(sessions.items), reservationEntries(reservations.items)],
      TIMELINE_MAX_ENTRIES,
    );
    const sourceCapped: boolean = lessons.capped || attempts.capped || sessions.capped || reservations.capped;

    return { userId, from: range.from, to: range.to, entries: merged.entries, truncated: merged.truncated || sourceCapped };
  }
}
