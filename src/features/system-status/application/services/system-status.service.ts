/*
 * Funcionalidad: Servicio SystemStatusService
 * Descripción: Calcula el estado del sistema ejecutando en paralelo los chequeos de base de datos, reserva activa, métricas de IA y almacenamiento con un tiempo máximo cada uno (un chequeo colgado no bloquea la respuesta), lee sin E/S el broker MQTT, el ventilador, el cortocircuito de los proveedores de IA (sin llamar a ningún modelo) y el proceso, guarda el resultado en caché durante SYSTEM_STATUS_CACHE_SECONDS y, al detectar un cambio de estado global o de algún componente respecto de la evaluación anterior, emite system:status-changed a las salas role:ADMIN y role:TEACHER una sola vez por transición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { DATABASE_HEALTH_PROBE_TOKEN, type IDatabaseHealthProbe } from "@/common/application/ports/database-health-probe.interface";
import { FILE_STORAGE_SERVICE_TOKEN, type FileStorageHealthValue, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { withTimeout } from "@/common/domain/utils/with-timeout";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiProviderHealth } from "@/features/ai/domain/results/ai-provider-health";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiProviderTelemetry } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { type IProcessMetrics, PROCESS_METRICS_TOKEN, type ProcessMetricsSnapshot } from "@/features/system-status/application/ports/process-metrics.interface";
import { SYSTEM_STATUS_SETTINGS_TOKEN, type SystemStatusSettings } from "@/features/system-status/application/tokens/system-status-settings.token";
import {
  type AiProviderComponentStatus,
  type AiProvidersComponentStatus,
  type ComponentStateValue,
  type DatabaseComponentStatus,
  deriveAiProvidersState,
  deriveVentilatorState,
  diffSystemStatus,
  evaluateSystemState,
  type MqttBrokerComponentStatus,
  type SystemComponentChange,
  type SystemStatusChange,
  type SystemStatusComponents,
  type SystemStatusReport,
  type VentilatorComponentStatus,
} from "@/features/system-status/domain/system-status";
import { type VentilatorTelemetryStatus } from "@/features/ventilator-telemetry/application/results/ventilator-telemetry-status.result";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

export const SYSTEM_STATUS_CHANGED_EVENT: string = "system:status-changed";

export const SYSTEM_STATUS_AUDIENCE_ROLES: readonly string[] = ["ADMIN", "TEACHER"] as const;

const MINUTE_MS: number = 60_000;

export interface SystemStatusChangedPayload {
  readonly state: string;
  readonly previousState: string;
  readonly changedComponents: { component: string; state: string; previousState: string }[];
  readonly checkedAt: string;
}

interface CachedReport {
  readonly report: SystemStatusReport;
  readonly expiresAt: number;
}

@Injectable()
export class SystemStatusService {
  private readonly _logger: Logger = new Logger(SystemStatusService.name);
  private _cached: CachedReport | undefined;
  private _inFlight: Promise<SystemStatusReport> | undefined;
  private _lastReport: SystemStatusReport | undefined;

  public constructor(
    @Inject(DATABASE_HEALTH_PROBE_TOKEN)
    private readonly _database: IDatabaseHealthProbe,
    @Inject(FILE_STORAGE_SERVICE_TOKEN)
    private readonly _storage: IFileStorageService,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtime: IRealtimePublisher,
    @Inject(PROCESS_METRICS_TOKEN)
    private readonly _processMetrics: IProcessMetrics,
    @Inject(SYSTEM_STATUS_SETTINGS_TOKEN)
    private readonly _settings: SystemStatusSettings,
    private readonly _ventilator: VentilatorTelemetryFacade,
    private readonly _reservations: ReservationsFacade,
    private readonly _aiGateway: AiGateway,
    private readonly _aiTelemetry: AiTelemetryFacade,
    private readonly _simulation: SimulationFacade,
  ) {}

  public async getStatus(): Promise<SystemStatusReport> {
    const cached: CachedReport | undefined = this._cached;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.report;
    }

    return await this.refresh();
  }

  public refresh(): Promise<SystemStatusReport> {
    if (!this._inFlight) {
      this._inFlight = this._evaluate().finally(() => {
        this._inFlight = undefined;
      });
    }

    return this._inFlight;
  }

  private async _evaluate(): Promise<SystemStatusReport> {
    const timeoutMs: number = this._settings.checkTimeoutMs;
    const now: number = Date.now();

    const [database, activeReservation, aiTelemetry, storage]: [
      DatabaseComponentStatus,
      boolean | undefined,
      AiProviderTelemetry[] | undefined,
      FileStorageHealthValue | undefined,
    ] = await Promise.all([
      this._checkDatabase(timeoutMs),
      this._settle("reservations", timeoutMs, async (): Promise<boolean> => (await this._reservations.getActiveReservation(new Date(now))) !== undefined),
      this._settle("aiTelemetry", timeoutMs, () => this._aiTelemetry.getProviderStats(new Date(now - this._settings.aiWindowMinutes * MINUTE_MS))),
      this._settle("storage", timeoutMs, () => this._storage.checkHealth()),
    ]);

    const mqttBroker: MqttBrokerComponentStatus = this._mqttBrokerStatus();
    const components: SystemStatusComponents = {
      database,
      mqttBroker,
      ventilator: this._ventilatorStatus(mqttBroker.enabled, activeReservation),
      aiProviders: this._aiProvidersStatus(aiTelemetry),
      storage: { state: storage ?? "down" },
      process: this._processStatus(),
    };
    const report: SystemStatusReport = { state: evaluateSystemState(components), checkedAt: new Date(now), components };

    this._cached = { report, expiresAt: Date.now() + this._settings.cacheSeconds * 1000 };
    this._publishChange(report);

    return report;
  }

  private async _checkDatabase(timeoutMs: number): Promise<DatabaseComponentStatus> {
    const startedAt: number = Date.now();

    try {
      await withTimeout(this._database.ping(), timeoutMs);

      return { state: "up", reachable: true, latencyMs: Date.now() - startedAt };
    } catch (error: unknown) {
      this._logger.warn(`Database check failed: ${error instanceof Error ? error.name : "UnknownError"}`);

      return { state: "down", reachable: false };
    }
  }

  private async _settle<T>(check: string, timeoutMs: number, run: () => Promise<T>): Promise<T | undefined> {
    try {
      return await withTimeout(run(), timeoutMs);
    } catch (error: unknown) {
      this._logger.warn(`System status check ${check} failed: ${error instanceof Error ? error.name : "UnknownError"}`);

      return undefined;
    }
  }

  private _mqttBrokerStatus(): MqttBrokerComponentStatus {
    const enabled: boolean = this._ventilator.getConnectionInfo().enabled;
    const status: VentilatorTelemetryStatus = this._ventilator.getStatus();
    let state: ComponentStateValue = "not_configured";

    if (enabled) {
      state = status.brokerConnected ? "up" : "down";
    }

    return {
      state,
      enabled,
      connected: status.brokerConnected,
      lastMessageAt: status.lastMessageAt !== undefined ? new Date(status.lastMessageAt) : undefined,
      messagesPerSecond: status.msgRate,
    };
  }

  private _ventilatorStatus(mqttEnabled: boolean, activeReservation: boolean | undefined): VentilatorComponentStatus {
    const online: boolean = this._ventilator.isDeviceOnline();

    return { state: deriveVentilatorState(mqttEnabled, online, activeReservation), online, activeReservation };
  }

  private _aiProvidersStatus(telemetry: AiProviderTelemetry[] | undefined): AiProvidersComponentStatus {
    const statsByProvider: Map<string, AiProviderTelemetry> = new Map<string, AiProviderTelemetry>(
      (telemetry ?? []).map((entry: AiProviderTelemetry): [string, AiProviderTelemetry] => [entry.provider, entry]),
    );
    const providers: AiProviderComponentStatus[] = this._aiGateway.getProviderHealth().map((health: AiProviderHealth): AiProviderComponentStatus => {
      const stats: AiProviderTelemetry | undefined = statsByProvider.get(health.provider);

      return {
        provider: health.provider,
        configured: health.configured,
        breaker: health.state,
        available: health.configured && health.state !== "open",
        lastSuccessAt: health.lastSuccessAt,
        lastErrorAt: health.lastErrorAt,
        lastErrorCode: health.lastErrorCode,
        latencyP95Ms: stats?.latencyP95Ms,
        errorRate: stats?.errorRate,
        calls: stats?.providerCalls,
      };
    });

    return { state: deriveAiProvidersState(providers), windowMinutes: this._settings.aiWindowMinutes, providers };
  }

  private _processStatus(): SystemStatusComponents["process"] {
    const metrics: ProcessMetricsSnapshot = this._processMetrics.snapshot();

    return {
      state: "up",
      ...metrics,
      appVersion: this._settings.appVersion,
      appCommit: this._settings.appCommit,
      engineVersion: this._simulation.engineVersion,
    };
  }

  private _publishChange(report: SystemStatusReport): void {
    const previous: SystemStatusReport | undefined = this._lastReport;

    this._lastReport = report;

    if (!previous) {
      return;
    }

    const change: SystemStatusChange | undefined = diffSystemStatus(previous, report);

    if (!change) {
      return;
    }

    const payload: SystemStatusChangedPayload = {
      state: change.state,
      previousState: change.previousState,
      changedComponents: change.changedComponents.map((entry: SystemComponentChange) => ({ ...entry })),
      checkedAt: change.checkedAt.toISOString(),
    };

    this._logger.log(`System status ${change.previousState} -> ${change.state} (${change.changedComponents.map((entry: SystemComponentChange) => entry.component).join(", ") || "global"})`);

    for (const role of SYSTEM_STATUS_AUDIENCE_ROLES) {
      this._realtime.emitToRole(role, SYSTEM_STATUS_CHANGED_EVENT, payload);
    }
  }
}
