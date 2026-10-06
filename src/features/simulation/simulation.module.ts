/*
 * Funcionalidad: Módulo SimulationModule
 * Descripción: Registra la feature de simulación: controladores /api/simulation y /api/simulation/patient, casos de uso, servicios en memoria (caché de reserva, monitor de telemetría, pacientes simulados), repositorios Prisma, adaptadores MQTT e InfluxDB, ajustes desde ConfigService, manejadores realtime y ciclo de vida; exporta los repositorios de reservas y sesiones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { AuthModule } from "@/features/auth/auth.module";
import { GroupsModule } from "@/features/groups/groups.module";
import { type ITelemetryStore, TELEMETRY_STORE_TOKEN } from "@/features/simulation/application/ports/telemetry-store.interface";
import { VENTILATOR_DEVICE_GATEWAY_TOKEN } from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { ConfigurePatientUseCase } from "@/features/simulation/application/use-cases/configure-patient.usecase";
import { CreateSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/create-simulator-session.usecase";
import { GetActivePatientUseCase } from "@/features/simulation/application/use-cases/get-active-patient.usecase";
import { GetSimulationHealthUseCase } from "@/features/simulation/application/use-cases/get-simulation-health.usecase";
import { GetSimulatorSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulator-sessions.usecase";
import { GetVentilatorStatusUseCase } from "@/features/simulation/application/use-cases/get-ventilator-status.usecase";
import { RelayVentilatorTelemetryUseCase } from "@/features/simulation/application/use-cases/relay-ventilator-telemetry.usecase";
import { ReleaseVentilatorUseCase } from "@/features/simulation/application/use-cases/release-ventilator.usecase";
import { ReserveVentilatorUseCase } from "@/features/simulation/application/use-cases/reserve-ventilator.usecase";
import { SaveSimulatorSessionUseCase } from "@/features/simulation/application/use-cases/save-simulator-session.usecase";
import { SendVentilatorCommandUseCase } from "@/features/simulation/application/use-cases/send-ventilator-command.usecase";
import { StartPatientSimulationUseCase } from "@/features/simulation/application/use-cases/start-patient-simulation.usecase";
import { StopPatientSimulationUseCase } from "@/features/simulation/application/use-cases/stop-patient-simulation.usecase";
import { SIMULATOR_SESSIONS_REPOSITORY_TOKEN } from "@/features/simulation/domain/repositories/simulator-sessions.repository";
import { VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN } from "@/features/simulation/domain/repositories/ventilator-reservations.repository";
import { DEFAULT_VENTILATOR_DEVICE_ID } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { type InfluxSettings, readInfluxSettings, resolveWsMaxHz } from "@/features/simulation/infrastructure/config/simulation-config";
import { SimulationRealtimeHandlers } from "@/features/simulation/infrastructure/events/simulation-realtime.handlers";
import { DisabledTelemetryStore } from "@/features/simulation/infrastructure/influx/disabled-telemetry.store";
import { InfluxTelemetryStore } from "@/features/simulation/infrastructure/influx/influx-telemetry.store";
import { SimulationLifecycleService } from "@/features/simulation/infrastructure/lifecycle/simulation-lifecycle.service";
import { MqttVentilatorDeviceGateway } from "@/features/simulation/infrastructure/mqtt/mqtt-ventilator-device.gateway";
import { SimulatorSessionsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/simulator-sessions-prisma.repository";
import { VentilatorReservationsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/ventilator-reservations-prisma.repository";
import { PatientSimulationController } from "@/features/simulation/presentation/controllers/patient-simulation.controller";
import { SimulationController } from "@/features/simulation/presentation/controllers/simulation.controller";
import { UsersModule } from "@/features/users/users.module";

function createSimulationSettings(configService: ConfigService<EnvironmentVariables>): SimulationSettings {
  const { maxHz, isFallback }: { maxHz: number; isFallback: boolean } = resolveWsMaxHz(configService.get("WS_MAX_HZ", { infer: true }));

  if (isFallback) {
    new Logger(SimulationModule.name).warn(`WS_MAX_HZ invalid, using ${maxHz}`);
  }

  return { deviceId: DEFAULT_VENTILATOR_DEVICE_ID, telemetryThrottleMs: 1000 / maxHz };
}

function createTelemetryStore(configService: ConfigService<EnvironmentVariables>): ITelemetryStore {
  const settings: InfluxSettings | undefined = readInfluxSettings(configService);

  return settings ? new InfluxTelemetryStore(settings) : new DisabledTelemetryStore();
}

@Module({
  imports: [AuthModule, UsersModule, GroupsModule],
  controllers: [SimulationController, PatientSimulationController],
  providers: [
    {
      provide: SIMULATION_SETTINGS_TOKEN,
      useFactory: createSimulationSettings,
      inject: [ConfigService],
    },
    {
      provide: TELEMETRY_STORE_TOKEN,
      useFactory: createTelemetryStore,
      inject: [ConfigService],
    },
    {
      provide: VENTILATOR_DEVICE_GATEWAY_TOKEN,
      useClass: MqttVentilatorDeviceGateway,
    },
    {
      provide: VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN,
      useClass: VentilatorReservationsPrismaRepository,
    },
    {
      provide: SIMULATOR_SESSIONS_REPOSITORY_TOKEN,
      useClass: SimulatorSessionsPrismaRepository,
    },
    ReservationCacheService,
    TelemetryMonitorService,
    PatientSimulationSessionsService,
    RelayVentilatorTelemetryUseCase,
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
  ],
  exports: [VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN, SIMULATOR_SESSIONS_REPOSITORY_TOKEN],
})
export class SimulationModule {}
