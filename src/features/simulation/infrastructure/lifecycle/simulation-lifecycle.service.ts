/*
 * Funcionalidad: Ciclo de vida de la simulación
 * Descripción: Al iniciar el módulo engancha el reenvío de telemetría y la escritura en InfluxDB a los flujos MQTT, carga la reserva activa y conecta al broker sin bloquear ni tumbar el arranque; al apagar detiene los pacientes simulados, desconecta MQTT y cierra InfluxDB
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";

import { type ITelemetryStore, TELEMETRY_STORE_TOKEN } from "@/features/simulation/application/ports/telemetry-store.interface";
import {
  type DevicePayloadListener,
  type IVentilatorDeviceGateway,
  VENTILATOR_DEVICE_GATEWAY_TOKEN,
} from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";
import { RelayVentilatorTelemetryUseCase } from "@/features/simulation/application/use-cases/relay-ventilator-telemetry.usecase";
import { normalizeTelemetrySample, type TelemetryParseResult } from "@/features/simulation/domain/services/telemetry-payload";
import { type TelemetrySample } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

@Injectable()
export class SimulationLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private readonly _logger: Logger = new Logger(SimulationLifecycleService.name);

  public constructor(
    @Inject(VENTILATOR_DEVICE_GATEWAY_TOKEN)
    private readonly _deviceGateway: IVentilatorDeviceGateway,
    @Inject(TELEMETRY_STORE_TOKEN)
    private readonly _telemetryStore: ITelemetryStore,
    private readonly _relayTelemetryUseCase: RelayVentilatorTelemetryUseCase,
    private readonly _reservationCache: ReservationCacheService,
    private readonly _telemetryMonitor: TelemetryMonitorService,
    private readonly _patientSessions: PatientSimulationSessionsService,
  ) {}

  public async onModuleInit(): Promise<void> {
    this._warnOnTopicWithoutLeadingSlash();

    const relay: DevicePayloadListener = (payload: Buffer): void => this._relayTelemetryUseCase.execute(payload);

    this._deviceGateway.onTelemetry(relay);
    this._deviceGateway.onAlarm(relay);

    if (this._telemetryStore.isEnabled) {
      const store: DevicePayloadListener = (payload: Buffer): void => this._storeSample(payload);

      this._deviceGateway.onTelemetry(store);
      this._deviceGateway.onAlarm(store);

      this._logger.log("InfluxDB telemetry writer attached to MQTT stream");
    } else {
      this._logger.warn("Missing env vars (INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET) – InfluxDB writes disabled");
    }

    try {
      await this._reservationCache.refresh();
    } catch (error) {
      this._logger.warn(`Active reservation could not be loaded: ${error instanceof Error ? error.message : String(error)}`);
    }

    void this._connectDevice();
  }

  public async onApplicationShutdown(): Promise<void> {
    this._patientSessions.stopAll();

    await this._deviceGateway.disconnect();

    this._telemetryMonitor.reset();

    await this._telemetryStore.close();
  }

  private async _connectDevice(): Promise<void> {
    try {
      await this._deviceGateway.connect();

      this._logger.log("Simulation module initialized (MQTT connected)");
    } catch (error) {
      this._logger.warn(`Simulation module: MQTT connection failed – ${error instanceof Error ? error.message : String(error)}`);
      this._logger.warn("REST endpoints are available; real-time data will not stream.");
    }
  }

  private _storeSample(payload: Buffer): void {
    const result: TelemetryParseResult<TelemetrySample> = normalizeTelemetrySample(payload, Date.now());

    if (result.kind === "parsed") {
      this._telemetryStore.write(result.value);
    } else if (result.kind === "invalid_json") {
      this._logger.warn(`JSON parse error – discarding frame: ${result.error}`);
    } else {
      this._logger.warn("Telemetry missing required fields (pressure/flow/volume) – discarding");
    }
  }

  private _warnOnTopicWithoutLeadingSlash(): void {
    const topic: string = this._deviceGateway.connectionInfo.telemetryTopic;

    if (topic.startsWith("/")) {
      return;
    }

    this._logger.warn(`MQTT telemetry topic has no leading slash: MQTT_TELEMETRY_TOPIC must match the publisher exactly. Current value: "${topic}"`);
    this._logger.warn(`Check it with: mqttx sub -h <host> -t ${topic} -v`);
  }
}
