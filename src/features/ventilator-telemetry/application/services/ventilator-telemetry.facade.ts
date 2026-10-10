/*
 * Funcionalidad: Fachada pública de la telemetría del ventilador
 * Descripción: API que VentilatorTelemetryModule exporta para otras features (simulación heredada y comandos del ventilador): estado de la telemetría, actividad del dispositivo, últimos parámetros informados, alarmas activas, datos de conexión, oyentes de tramas y el puerto de la conexión MQTT única para publicar comandos con QoS 1
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IMqttConnection, MQTT_CONNECTION_TOKEN } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { type VentilatorTelemetryConnectionInfo, type VentilatorTelemetryStatus } from "@/features/ventilator-telemetry/application/results/ventilator-telemetry-status.result";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { type TelemetryFrameListener, TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { type VentilatorAlarm } from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

@Injectable()
export class VentilatorTelemetryFacade {
  public constructor(
    @Inject(MQTT_CONNECTION_TOKEN)
    private readonly _connection: IMqttConnection,
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
    private readonly _pipeline: TelemetryPipelineService,
    private readonly _metrics: TelemetryMetricsService,
    private readonly _staleness: DeviceStalenessService,
  ) {}

  public get mqttConnection(): IMqttConnection {
    return this._connection;
  }

  public getStatus(): VentilatorTelemetryStatus {
    return {
      brokerConnected: this._connection.isConnected,
      lastMessageAt: this._staleness.lastMessageAt,
      msgRate: this._metrics.messagesPerSecond(this._clock.now()),
      decoder: this._pipeline.decoderName,
      staleness: this._staleness.state,
      lostMessages: this._metrics.lostMessages,
      invalidMessages: this._metrics.invalidMessages,
    };
  }

  public isDeviceOnline(): boolean {
    return this._connection.isConnected && this._staleness.state === "online";
  }

  public getLatestSettings(): Readonly<Record<string, number>> | undefined {
    return this._pipeline.latestSettings;
  }

  public getActiveAlarms(): VentilatorAlarm[] {
    return this._pipeline.activeAlarms;
  }

  public getConnectionInfo(): VentilatorTelemetryConnectionInfo {
    return {
      enabled: this._connection.isEnabled,
      brokerUrl: this._connection.brokerUrl,
      telemetryTopic: this._settings.telemetryTopic,
      alarmTopic: this._settings.alarmTopic,
      deviceId: this._settings.deviceId,
    };
  }

  public onFrame(listener: TelemetryFrameListener): () => void {
    return this._pipeline.onFrame(listener);
  }
}
