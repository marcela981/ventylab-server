/*
 * Funcionalidad: Ciclo de vida de la telemetría del ventilador
 * Descripción: Al iniciar registra las suscripciones (telemetría QoS 0, alarmas QoS 1), conecta el pipeline, el vigilante de actividad, el acceso a la sala, la grabación y el destino InfluxDB, y abre la conexión MQTT; al apagar (SIGTERM incluido) detiene los temporizadores, guarda la grabación pendiente y cierra el cliente MQTT y el destino
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";

import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { type ITelemetrySink, TELEMETRY_SINK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-sink.interface";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import { VentilatorRoomAccessService } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { MqttVentilatorConnection } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-ventilator.connection";

const TELEMETRY_QOS: MqttQos = 0;
// Alarms are rare and must not be lost, so they keep QoS 1 while high-rate telemetry uses QoS 0
const ALARM_QOS: MqttQos = 1;

@Injectable()
export class VentilatorTelemetryLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private readonly _logger: Logger = new Logger(VentilatorTelemetryLifecycleService.name);

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(TELEMETRY_SINK_TOKEN)
    private readonly _sink: ITelemetrySink,
    private readonly _connection: MqttVentilatorConnection,
    private readonly _pipeline: TelemetryPipelineService,
    private readonly _staleness: DeviceStalenessService,
    private readonly _roomAccess: VentilatorRoomAccessService,
    private readonly _recorder: TelemetryRecorderService,
  ) {}

  public onModuleInit(): void {
    this._warnOnTopicWithoutLeadingSlash();

    this._connection.subscribe(this._settings.telemetryTopic, TELEMETRY_QOS);
    this._connection.subscribe(this._settings.alarmTopic, ALARM_QOS);
    this._connection.onMessage((topic: string, payload: Buffer): void => this._pipeline.handleMessage(topic, payload));
    this._connection.onConnectionChange((connected: boolean): void => {
      if (!connected) {
        this._staleness.markBrokerDisconnected();
      }
    });

    this._roomAccess.onActiveReservationChange((activeReservationId: string | undefined): void => this._recorder.stopUnlessReservation(activeReservationId));

    if (this._sink.isEnabled) {
      this._pipeline.onFrame((frame: TelemetryFrame): void => this._sink.write(frame));
      this._logger.log("InfluxDB telemetry sink attached to the ventilator telemetry stream");
    }

    this._pipeline.start();
    this._staleness.start();
    this._roomAccess.start();
    this._connection.start();
  }

  public async onApplicationShutdown(): Promise<void> {
    this._roomAccess.stop();
    this._staleness.stop();
    this._pipeline.stop();
    this._recorder.stop();
    this._connection.stop();

    await this._sink.close();
  }

  private _warnOnTopicWithoutLeadingSlash(): void {
    const topic: string = this._settings.telemetryTopic;

    if (topic.startsWith("/")) {
      return;
    }

    this._logger.warn(`MQTT telemetry topic has no leading slash: MQTT_TELEMETRY_TOPIC must match the publisher exactly. Current value: "${topic}"`);
  }
}
