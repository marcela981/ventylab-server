/*
 * Funcionalidad: Dobles de prueba del estado del sistema
 * Descripción: Construye SystemStatusService y su monitor con fakes controlables de base de datos, almacenamiento, tiempo real, telemetría del ventilador, reservas, telemetría de IA, simulación y métricas del proceso, y un AiGateway real sobre proveedores falsos para comprobar que el estado nunca llama a un modelo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IDatabaseHealthProbe } from "@/common/application/ports/database-health-probe.interface";
import { type FileStorageHealthValue, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  AllowAllAiQuotaGuard,
  FakeLlmProvider,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiProviderTelemetry } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { type IProcessMetrics, type ProcessMetricsSnapshot } from "@/features/system-status/application/ports/process-metrics.interface";
import { SystemStatusMonitor } from "@/features/system-status/application/services/system-status-monitor.service";
import { SystemStatusService } from "@/features/system-status/application/services/system-status.service";
import { type SystemStatusSettings } from "@/features/system-status/application/tokens/system-status-settings.token";
import { type VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

export const TEST_SYSTEM_STATUS_SETTINGS: SystemStatusSettings = {
  cacheSeconds: 5,
  checkTimeoutMs: 30,
  reevaluateIntervalMs: 30_000,
  aiWindowMinutes: 15,
  appVersion: "1.0.0",
  appCommit: "abc1234",
};

export class FakeVentilatorState {
  public enabled: boolean = true;
  public brokerConnected: boolean = true;
  public online: boolean = true;
  public lastMessageAt: number | undefined = Date.parse("2026-10-11T12:00:00Z");
  public connectionListeners: ((connected: boolean) => void)[] = [];

  public asFacade(): VentilatorTelemetryFacade {
    return {
      getConnectionInfo: () => ({ enabled: this.enabled, telemetryTopic: "t", alarmTopic: "a", deviceId: "d" }),
      getStatus: () => ({
        brokerConnected: this.brokerConnected,
        lastMessageAt: this.lastMessageAt,
        msgRate: 25,
        decoder: "auto",
        staleness: this.online ? "online" : "stale",
        lostMessages: 0,
        invalidMessages: 0,
      }),
      isDeviceOnline: () => this.brokerConnected && this.online,
      mqttConnection: {
        onConnectionChange: (listener: (connected: boolean) => void): (() => void) => {
          this.connectionListeners.push(listener);

          return () => undefined;
        },
      },
    } as unknown as VentilatorTelemetryFacade;
  }
}

export interface SystemStatusHarness {
  readonly service: SystemStatusService;
  readonly monitor: SystemStatusMonitor;
  readonly ping: jest.Mock<Promise<void>, []>;
  readonly checkHealth: jest.Mock<Promise<FileStorageHealthValue>, []>;
  readonly getActiveReservation: jest.Mock;
  readonly getProviderStats: jest.Mock<Promise<AiProviderTelemetry[]>, [Date]>;
  readonly emitToRole: jest.Mock;
  readonly ventilator: FakeVentilatorState;
  readonly llm: FakeLlmProvider;
  readonly aiCalls: InMemoryAiCallRecorder;
  readonly gateway: AiGateway;
}

export function createSystemStatusHarness(settings: SystemStatusSettings = TEST_SYSTEM_STATUS_SETTINGS): SystemStatusHarness {
  const ping: jest.Mock<Promise<void>, []> = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
  const checkHealth: jest.Mock<Promise<FileStorageHealthValue>, []> = jest.fn<Promise<FileStorageHealthValue>, []>().mockResolvedValue("up");
  const getActiveReservation: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const getProviderStats: jest.Mock<Promise<AiProviderTelemetry[]>, [Date]> = jest
    .fn<Promise<AiProviderTelemetry[]>, [Date]>()
    .mockResolvedValue([{ provider: "gemini", providerCalls: 10, errorCalls: 1, errorRate: 0.1, latencyP95Ms: 1200 }]);
  const emitToRole: jest.Mock = jest.fn();
  const ventilator: FakeVentilatorState = new FakeVentilatorState();
  const llm: FakeLlmProvider = new FakeLlmProvider("gemini", { kind: "text", text: "OK" });
  const aiCalls: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
  const aiSettings: StaticAiSettingsProvider = new StaticAiSettingsProvider(
    { providerChain: ["gemini"], models: { gemini: "gemini-model" }, timeoutMs: 1000, maxOutputTokens: 64, temperature: 0 },
    { failureThreshold: 1, openSeconds: 60 },
    1,
  );
  const gateway: AiGateway = new AiGateway(new AiOrchestrator(providerRegistry(llm), aiSettings, aiCalls), new AllowAllAiQuotaGuard());
  const database: IDatabaseHealthProbe = { ping };
  const storage: IFileStorageService = { checkHealth } as unknown as IFileStorageService;
  const realtime: IRealtimePublisher = { emitToRole } as unknown as IRealtimePublisher;
  const processMetrics: IProcessMetrics = {
    snapshot: (): ProcessMetricsSnapshot => ({ uptimeSeconds: 60, rssBytes: 1000, heapUsedBytes: 500, eventLoopLagMs: 1.5 }),
  };
  const reservations: ReservationsFacade = { getActiveReservation } as unknown as ReservationsFacade;
  const aiTelemetry: AiTelemetryFacade = { getProviderStats } as unknown as AiTelemetryFacade;
  const simulation: SimulationFacade = { engineVersion: "1.0.0" } as unknown as SimulationFacade;
  const ventilatorFacade: VentilatorTelemetryFacade = ventilator.asFacade();
  const service: SystemStatusService = new SystemStatusService(
    database,
    storage,
    realtime,
    processMetrics,
    settings,
    ventilatorFacade,
    reservations,
    gateway,
    aiTelemetry,
    simulation,
  );
  const monitor: SystemStatusMonitor = new SystemStatusMonitor(service, ventilatorFacade, settings);

  return { service, monitor, ping, checkHealth, getActiveReservation, getProviderStats, emitToRole, ventilator, llm, aiCalls, gateway };
}
