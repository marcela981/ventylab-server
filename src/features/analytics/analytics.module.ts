/*
 * Funcionalidad: Módulo AnalyticsModule
 * Descripción: Registra la analítica (sin tablas propias): controladores /api/analytics y /api/me/summary, casos de uso, servicio de alcance, caché en memoria de 60 s, lector por lotes y seudonimizador HMAC; compone las fachadas públicas de grupos, progreso, evaluaciones, simulación, telemetría y valoraciones de IA, reservas, notas y tutor de IA; el contador de notificaciones sin leer UNREAD_NOTIFICATIONS_COUNTER_TOKEN lo enlaza la raíz de composición. Ninguna feature importa analítica
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AiRatingsModule } from "@/features/ai-ratings/ai-ratings.module";
import { AiTelemetryModule } from "@/features/ai-telemetry/ai-telemetry.module";
import { AiTutorModule } from "@/features/ai-tutor/ai-tutor.module";
import { PSEUDONYMIZER_TOKEN } from "@/features/analytics/application/ports/pseudonymizer.interface";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { AnalyticsScopeService } from "@/features/analytics/application/services/analytics-scope.service";
import { StudentAnalyticsSourcesReader } from "@/features/analytics/application/services/student-analytics-sources.reader";
import { ExportResearchDatasetUseCase } from "@/features/analytics/application/use-cases/export-research-dataset.usecase";
import { GetEvaluationAnalyticsUseCase } from "@/features/analytics/application/use-cases/get-evaluation-analytics.usecase";
import { GetGroupDashboardUseCase } from "@/features/analytics/application/use-cases/get-group-dashboard.usecase";
import { GetMySummaryUseCase } from "@/features/analytics/application/use-cases/get-my-summary.usecase";
import { GetStudentTimelineUseCase } from "@/features/analytics/application/use-cases/get-student-timeline.usecase";
import { HmacPseudonymizer } from "@/features/analytics/infrastructure/security/hmac-pseudonymizer";
import { AnalyticsController } from "@/features/analytics/presentation/controllers/analytics.controller";
import { MySummaryController } from "@/features/analytics/presentation/controllers/my-summary.controller";
import { EvaluationModule } from "@/features/evaluation/evaluation.module";
import { GroupsModule } from "@/features/groups/groups.module";
import { NotesModule } from "@/features/notes/notes.module";
import { ProgressModule } from "@/features/progress/progress.module";
import { ReservationsModule } from "@/features/reservations/reservations.module";
import { SimulationModule } from "@/features/simulation/simulation.module";

@Module({
  imports: [GroupsModule, ProgressModule, EvaluationModule, SimulationModule, AiTelemetryModule, AiRatingsModule, ReservationsModule, NotesModule, AiTutorModule],
  controllers: [AnalyticsController, MySummaryController],
  providers: [
    { provide: PSEUDONYMIZER_TOKEN, useClass: HmacPseudonymizer },
    AnalyticsCache,
    AnalyticsScopeService,
    StudentAnalyticsSourcesReader,
    GetGroupDashboardUseCase,
    GetStudentTimelineUseCase,
    GetEvaluationAnalyticsUseCase,
    GetMySummaryUseCase,
    ExportResearchDatasetUseCase,
  ],
})
export class AnalyticsModule {}
