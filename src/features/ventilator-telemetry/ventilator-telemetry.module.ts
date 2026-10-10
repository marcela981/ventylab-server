/*
 * Funcionalidad: Módulo VentilatorTelemetryModule
 * Descripción: Registra la telemetría del ventilador físico: conexión MQTT única, decodificador configurable, pipeline por lotes hacia Socket.io, acceso a la sala ventilator, vigilancia de actividad, métricas, grabación en telemetry_chunks y destino InfluxDB opcional; exporta VentilatorTelemetryFacade y depende solo de la fachada de reservas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { ReservationsModule } from "@/features/reservations/reservations.module";
import { MQTT_CONNECTION_TOKEN } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { TELEMETRY_CHUNK_CODEC_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-chunk-codec.interface";
import { TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { type ITelemetrySink, TELEMETRY_SINK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-sink.interface";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import { TelemetryRecordingAccessService } from "@/features/ventilator-telemetry/application/services/telemetry-recording-access.service";
import { VentilatorRoomAccessService } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";
import {
  TELEMETRY_DECODER_TOKEN,
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  type VentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { GetTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/get-telemetry-recording.usecase";
import { StartTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/start-telemetry-recording.usecase";
import { StopTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/stop-telemetry-recording.usecase";
import {
  GetTelemetryMetricSamplesUseCase,
  GetTelemetryMetricsUseCase,
  ResetTelemetryMetricsUseCase,
} from "@/features/ventilator-telemetry/application/use-cases/telemetry-metrics.usecases";
import { createTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/create-telemetry-decoder";
import { type TelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";
import { TELEMETRY_CHUNKS_REPOSITORY_TOKEN } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { SystemTelemetryClock } from "@/features/ventilator-telemetry/infrastructure/clock/system-telemetry.clock";
import { GzipJsonTelemetryChunkCodec } from "@/features/ventilator-telemetry/infrastructure/codec/gzip-json-telemetry-chunk.codec";
import {
  type InfluxSettings,
  readInfluxSettings,
  readVentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/infrastructure/config/ventilator-telemetry-config";
import { VentilatorTelemetryEventsHandlers } from "@/features/ventilator-telemetry/infrastructure/events/ventilator-telemetry-events.handlers";
import { DisabledTelemetrySink, InfluxTelemetrySink } from "@/features/ventilator-telemetry/infrastructure/influx/influx-telemetry.sink";
import { VentilatorTelemetryLifecycleService } from "@/features/ventilator-telemetry/infrastructure/lifecycle/ventilator-telemetry-lifecycle.service";
import { MQTT_CLIENT_FACTORY_TOKEN } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-client";
import { createMqttJsClient } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-js-client.factory";
import { MqttVentilatorConnection } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-ventilator.connection";
import { TelemetryChunksPrismaRepository } from "@/features/ventilator-telemetry/infrastructure/persistence/prisma/repositories/telemetry-chunks-prisma.repository";
import { VentilatorTelemetryController } from "@/features/ventilator-telemetry/presentation/controllers/ventilator-telemetry.controller";

function createTelemetrySink(configService: ConfigService<EnvironmentVariables, true>): ITelemetrySink {
  const settings: InfluxSettings | undefined = readInfluxSettings(configService);

  return settings ? new InfluxTelemetrySink(settings) : new DisabledTelemetrySink();
}

function createDecoder(settings: VentilatorTelemetrySettings): TelemetryDecoder {
  return createTelemetryDecoder(settings.decoder, settings.deviceId);
}

@Module({
  imports: [ReservationsModule],
  controllers: [VentilatorTelemetryController],
  providers: [
    { provide: VENTILATOR_TELEMETRY_SETTINGS_TOKEN, useFactory: readVentilatorTelemetrySettings, inject: [ConfigService] },
    { provide: TELEMETRY_DECODER_TOKEN, useFactory: createDecoder, inject: [VENTILATOR_TELEMETRY_SETTINGS_TOKEN] },
    { provide: TELEMETRY_SINK_TOKEN, useFactory: createTelemetrySink, inject: [ConfigService] },
    { provide: TELEMETRY_CLOCK_TOKEN, useClass: SystemTelemetryClock },
    { provide: TELEMETRY_CHUNKS_REPOSITORY_TOKEN, useClass: TelemetryChunksPrismaRepository },
    { provide: TELEMETRY_CHUNK_CODEC_TOKEN, useClass: GzipJsonTelemetryChunkCodec },
    { provide: MQTT_CLIENT_FACTORY_TOKEN, useValue: createMqttJsClient },
    MqttVentilatorConnection,
    { provide: MQTT_CONNECTION_TOKEN, useExisting: MqttVentilatorConnection },
    TelemetryMetricsService,
    DeviceStalenessService,
    TelemetryRecorderService,
    TelemetryPipelineService,
    VentilatorRoomAccessService,
    TelemetryRecordingAccessService,
    GetTelemetryMetricsUseCase,
    GetTelemetryMetricSamplesUseCase,
    ResetTelemetryMetricsUseCase,
    StartTelemetryRecordingUseCase,
    StopTelemetryRecordingUseCase,
    GetTelemetryRecordingUseCase,
    VentilatorTelemetryEventsHandlers,
    VentilatorTelemetryLifecycleService,
    VentilatorTelemetryFacade,
  ],
  exports: [VentilatorTelemetryFacade],
})
export class VentilatorTelemetryModule {}
