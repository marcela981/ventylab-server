/*
 * Funcionalidad: Módulo SimulationModule
 * Descripción: Registra la feature de simulación: controladores /api/simulation, /api/simulation/patient, /api/simulation/sessions y la prueba de casos /api/clinical-cases/:caseId/test-run, asistencia de IA SSE /api/simulation/sessions/:id/assist sobre AiGateway de AiModule, casos de uso, servicios en memoria (pacientes simulados), servicios de sesiones con eventos, repositorios Prisma, lector de intentos de examen, generador de semillas, identificador del dispositivo desde ConfigService (los ajustes de sesiones SIMULATION_SESSION_SETTINGS_TOKEN los enlaza la raíz de composición), la fachada de telemetría del ventilador (VentilatorTelemetryModule) para estado y alarmas, la fachada de comandos del ventilador (VentilatorCommandsModule) para el camino físico de POST /api/simulation/command, manejadores realtime y ciclo de vida; exporta los repositorios de reservas y sesiones heredadas, SimulationFacade y SimulationAssistContextService; registra el repositorio de lecturas por lotes para analítica
 * Versión: 1.7
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { AiModule } from "@/features/ai/ai.module";
import { AuthModule } from "@/features/auth/auth.module";
import { ClinicalCasesModule } from "@/features/clinical-cases/clinical-cases.module";
import { GroupsModule } from "@/features/groups/groups.module";
import { ReservationsModule } from "@/features/reservations/reservations.module";
import { AssistSimulationUseCase } from "@/features/simulation/application/assist/assist-simulation.usecase";
import { EXAM_ATTEMPT_READER_TOKEN } from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import { SIMULATION_SEED_GENERATOR_TOKEN } from "@/features/simulation/application/ports/simulation-seed-generator.interface";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { SimulationAssistContextService } from "@/features/simulation/application/services/simulation-assist-context.service";
import { SimulationSessionAccessService } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionReader } from "@/features/simulation/application/services/simulation-session-reader.service";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { AppendSimulationEventsUseCase } from "@/features/simulation/application/use-cases/append-simulation-events.usecase";
import { ConfigurePatientUseCase } from "@/features/simulation/application/use-cases/configure-patient.usecase";
import { CreateSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/create-simulator-session.usecase";
import { EndSimulationSessionUseCase } from "@/features/simulation/application/use-cases/end-simulation-session.usecase";
import { GetActivePatientUseCase } from "@/features/simulation/application/use-cases/get-active-patient.usecase";
import { GetSimulationHealthUseCase } from "@/features/simulation/application/use-cases/get-simulation-health.usecase";
import { GetSimulationSessionReplayUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-replay.usecase";
import { GetSimulationSessionStateUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-state.usecase";
import { GetSimulationSessionSummaryUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-summary.usecase";
import { GetSimulationSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulation-sessions.usecase";
import { GetSimulatorSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulator-sessions.usecase";
import { GetVentilatorStatusUseCase } from "@/features/simulation/application/use-cases/get-ventilator-status.usecase";
import { ReleaseVentilatorUseCase } from "@/features/simulation/application/use-cases/release-ventilator.usecase";
import { ReserveVentilatorUseCase } from "@/features/simulation/application/use-cases/reserve-ventilator.usecase";
import { RunClinicalCaseTestUseCase } from "@/features/simulation/application/use-cases/run-clinical-case-test.usecase";
import { SaveSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/save-simulator-session.usecase";
import { SendVentilatorCommandUseCase } from "@/features/simulation/application/use-cases/send-ventilator-command.usecase";
import { StartPatientSimulationUseCase } from "@/features/simulation/application/use-cases/start-patient-simulation.usecase";
import { StartSimulationSessionUseCase } from "@/features/simulation/application/use-cases/start-simulation-session.usecase";
import { StopPatientSimulationUseCase } from "@/features/simulation/application/use-cases/stop-patient-simulation.usecase";
import { SIMULATION_ANALYTICS_REPOSITORY_TOKEN } from "@/features/simulation/domain/repositories/simulation-analytics.repository";
import { SIMULATION_SESSIONS_REPOSITORY_TOKEN } from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { SIMULATOR_SESSIONS_REPOSITORY_TOKEN } from "@/features/simulation/domain/repositories/simulator-sessions.repository";
import { SimulationRealtimeHandlers } from "@/features/simulation/infrastructure/events/simulation-realtime.handlers";
import { SimulationLifecycleService } from "@/features/simulation/infrastructure/lifecycle/simulation-lifecycle.service";
import { ExamAttemptsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/exam-attempts-prisma.repository";
import { SimulationAnalyticsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/simulation-analytics-prisma.repository";
import { SimulationSessionsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/simulation-sessions-prisma.repository";
import { SimulatorSessionsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/simulator-sessions-prisma.repository";
import { CryptoSimulationSeedGenerator } from "@/features/simulation/infrastructure/random/crypto-simulation-seed.generator";
import { ClinicalCaseTestRunController } from "@/features/simulation/presentation/controllers/clinical-case-test-run.controller";
import { PatientSimulationController } from "@/features/simulation/presentation/controllers/patient-simulation.controller";
import { SimulationAssistController } from "@/features/simulation/presentation/controllers/simulation-assist.controller";
import { SimulationSessionsController } from "@/features/simulation/presentation/controllers/simulation-sessions.controller";
import { SimulationController } from "@/features/simulation/presentation/controllers/simulation.controller";
import { UsersModule } from "@/features/users/users.module";
import { VentilatorCommandsModule } from "@/features/ventilator-commands/ventilator-commands.module";
import { VentilatorTelemetryModule } from "@/features/ventilator-telemetry/ventilator-telemetry.module";

function createSimulationSettings(configService: ConfigService<EnvironmentVariables, true>): SimulationSettings {
  return {
    deviceId: configService.get("VENTILATOR_DEVICE_ID", { infer: true }),
  };
}

@Module({
  imports: [AuthModule, AiModule, UsersModule, GroupsModule, ClinicalCasesModule, ReservationsModule, VentilatorTelemetryModule, VentilatorCommandsModule],
  controllers: [SimulationController, PatientSimulationController, SimulationSessionsController, SimulationAssistController, ClinicalCaseTestRunController],
  providers: [
    {
      provide: SIMULATION_SETTINGS_TOKEN,
      useFactory: createSimulationSettings,
      inject: [ConfigService],
    },
    {
      provide: SIMULATOR_SESSIONS_REPOSITORY_TOKEN,
      useClass: SimulatorSessionsPrismaRepository,
    },
    {
      provide: SIMULATION_SESSIONS_REPOSITORY_TOKEN,
      useClass: SimulationSessionsPrismaRepository,
    },
    {
      provide: SIMULATION_ANALYTICS_REPOSITORY_TOKEN,
      useClass: SimulationAnalyticsPrismaRepository,
    },
    {
      provide: EXAM_ATTEMPT_READER_TOKEN,
      useClass: ExamAttemptsPrismaRepository,
    },
    {
      provide: SIMULATION_SEED_GENERATOR_TOKEN,
      useClass: CryptoSimulationSeedGenerator,
    },
    PatientSimulationSessionsService,
    GetSimulationHealthUseCase,
    GetVentilatorStatusUseCase,
    SendVentilatorCommandUseCase,
    ReserveVentilatorUseCase,
    ReleaseVentilatorUseCase,
    CreateSimulatorSessionUseCase,
    SaveSimulatorSessionUseCase,
    GetSimulatorSessionsUseCase,
    ConfigurePatientUseCase,
    StartPatientSimulationUseCase,
    StopPatientSimulationUseCase,
    GetActivePatientUseCase,
    SimulationRealtimeHandlers,
    SimulationLifecycleService,
    SimulationSessionRuntime,
    SimulationSessionAccessService,
    SimulationSessionReader,
    StartSimulationSessionUseCase,
    AppendSimulationEventsUseCase,
    GetSimulationSessionStateUseCase,
    EndSimulationSessionUseCase,
    GetSimulationSessionSummaryUseCase,
    GetSimulationSessionReplayUseCase,
    GetSimulationSessionsUseCase,
    RunClinicalCaseTestUseCase,
    SimulationFacade,
    SimulationAssistContextService,
    AssistSimulationUseCase,
  ],
  exports: [SIMULATOR_SESSIONS_REPOSITORY_TOKEN, SimulationFacade, SimulationAssistContextService],
})
export class SimulationModule {}
