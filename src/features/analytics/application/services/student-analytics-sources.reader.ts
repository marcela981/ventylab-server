/*
 * Funcionalidad: Lector StudentAnalyticsSourcesReader
 * Descripción: Lee en paralelo, con exactamente una llamada por lotes a cada fachada (progreso, notas publicadas, estadísticas de simulación, uso de IA, valoraciones de IA, horas de ventilador y última actividad de progreso y de simulación), los datos de analítica de un conjunto de usuarios; el número de consultas no depende del número de usuarios (sin N+1); con el alcance de intentos de un profesor, las notas se limitan a ese alcance
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiRatingsFacade } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type StudentAnalyticsSources } from "@/features/analytics/application/services/student-analytics.builder";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type EvaluationAttemptScope } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

@Injectable()
export class StudentAnalyticsSourcesReader {
  public constructor(
    private readonly _progressFacade: LearningProgressFacade,
    private readonly _evaluationFacade: EvaluationFacade,
    private readonly _simulationFacade: SimulationFacade,
    private readonly _aiTelemetryFacade: AiTelemetryFacade,
    private readonly _aiRatingsFacade: AiRatingsFacade,
    private readonly _reservationsFacade: ReservationsFacade,
  ) {}

  public async read(userIds: readonly string[], now: Date, attemptScope?: EvaluationAttemptScope): Promise<StudentAnalyticsSources> {
    const [progress, grades, simulation, aiUsage, aiRatings, ventilator, progressActivity, simulationActivity] = await Promise.all([
      this._progressFacade.getProgressForUsers(userIds),
      this._evaluationFacade.getGradesForUsers(userIds, undefined, attemptScope),
      this._simulationFacade.getSessionStatsForUsers(userIds),
      this._aiTelemetryFacade.getUsageForUsers(userIds),
      this._aiRatingsFacade.getHelpfulnessForUsers(userIds),
      this._reservationsFacade.getVentilatorUsageForUsers(userIds, now),
      this._progressFacade.getLastActivityForUsers(userIds),
      this._simulationFacade.getLastActivityForUsers(userIds),
    ]);

    return { progress, grades, simulation, aiUsage, aiRatings, ventilator, lastActivity: [...progressActivity, ...simulationActivity] };
  }
}
