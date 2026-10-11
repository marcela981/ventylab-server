/*
 * Funcionalidad: DTO de respuesta de la telemetría del ventilador
 * Descripción: Respuestas de las métricas del pipeline (tasas, contadores incluidos los duplicados y los descartes del búfer y resumen de percentiles por tipo de latencia), y de las tramas grabadas de una reserva
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LatencySummaryDTO {
  @ApiProperty({ description: "Number of retained samples", example: 3600 })
  public count: number;

  @ApiProperty({ description: "Median in milliseconds", example: 0.08, nullable: true, type: Number })
  public p50: number | null;

  @ApiProperty({ description: "95th percentile in milliseconds", example: 0.21, nullable: true, type: Number })
  public p95: number | null;

  @ApiProperty({ description: "99th percentile in milliseconds", example: 0.4, nullable: true, type: Number })
  public p99: number | null;

  @ApiProperty({ description: "Maximum in milliseconds", example: 1.3, nullable: true, type: Number })
  public max: number | null;

  public constructor({ count, p50, p95, p99, max }: { count: number; p50: number | null; p95: number | null; p99: number | null; max: number | null }) {
    this.count = count;
    this.p50 = p50;
    this.p95 = p95;
    this.p99 = p99;
    this.max = max;
  }
}

export class TelemetryMetricsDTO {
  @ApiProperty({ description: "Start of the measurement window (last reset or boot, ISO 8601)", example: "2026-10-10T12:00:00.000Z" })
  public since: string;

  @ApiProperty({ description: "Maximum retained samples per latency kind (VENTILATOR_METRICS_WINDOW)", example: 10000 })
  public windowSize: number;

  @ApiProperty({ description: "MQTT messages received during the last second", example: 60 })
  public messagesPerSecond: number;

  @ApiProperty({ description: "Batches emitted during the last second", example: 30 })
  public batchesPerSecond: number;

  @ApiProperty({ description: "MQTT messages received since the window started", example: 3600 })
  public totalMessages: number;

  @ApiProperty({ description: "Invalid messages dropped", example: 0 })
  public invalidMessages: number;

  @ApiProperty({ description: "Messages lost according to sequence gaps", example: 0 })
  public lostMessages: number;

  @ApiProperty({ description: "Late frames that arrived within VENTILATOR_SEQ_REORDER_WINDOW of the newest sequence number", example: 0 })
  public reorderedMessages: number;

  @ApiProperty({ description: "Frames whose sequence number repeated the newest one", example: 0 })
  public duplicateMessages: number;

  @ApiProperty({ description: "Oldest frames dropped because the batch buffer reached VENTILATOR_MAX_BUFFERED_FRAMES", example: 0 })
  public bufferDrops: number;

  @ApiProperty({ description: "Volatile Socket.io emits", example: 3600 })
  public volatileEmits: number;

  @ApiProperty({ description: "MQTT receive to enqueue latency (processing)", type: LatencySummaryDTO })
  public processingMs: LatencySummaryDTO;

  @ApiProperty({ description: "MQTT receive to Socket.io emit latency, including the batching wait", type: LatencySummaryDTO })
  public totalMs: LatencySummaryDTO;

  @ApiProperty({ description: "Duration of each batch emit", type: LatencySummaryDTO })
  public flushMs: LatencySummaryDTO;

  @ApiProperty({ description: "Server timestamp minus device timestamp when the device sends one (subject to clock skew)", type: LatencySummaryDTO })
  public deviceLatencyMs: LatencySummaryDTO;

  public constructor(fields: {
    since: string;
    windowSize: number;
    messagesPerSecond: number;
    batchesPerSecond: number;
    totalMessages: number;
    invalidMessages: number;
    lostMessages: number;
    reorderedMessages: number;
    duplicateMessages: number;
    bufferDrops: number;
    volatileEmits: number;
    processingMs: LatencySummaryDTO;
    totalMs: LatencySummaryDTO;
    flushMs: LatencySummaryDTO;
    deviceLatencyMs: LatencySummaryDTO;
  }) {
    this.since = fields.since;
    this.windowSize = fields.windowSize;
    this.messagesPerSecond = fields.messagesPerSecond;
    this.batchesPerSecond = fields.batchesPerSecond;
    this.totalMessages = fields.totalMessages;
    this.invalidMessages = fields.invalidMessages;
    this.lostMessages = fields.lostMessages;
    this.reorderedMessages = fields.reorderedMessages;
    this.duplicateMessages = fields.duplicateMessages;
    this.bufferDrops = fields.bufferDrops;
    this.volatileEmits = fields.volatileEmits;
    this.processingMs = fields.processingMs;
    this.totalMs = fields.totalMs;
    this.flushMs = fields.flushMs;
    this.deviceLatencyMs = fields.deviceLatencyMs;
  }
}

export class RecordedTelemetryFrameDTO {
  @ApiProperty({ description: "Server receive time (epoch ms)", example: 1760097600000 })
  public serverTs: number;

  @ApiProperty({ description: "Device time (epoch ms) when sent", example: 1760097599995, nullable: true, type: Number })
  public deviceTs: number | null;

  @ApiProperty({ description: "Device sequence number", example: 42, nullable: true, type: Number })
  public seq: number | null;

  @ApiProperty({ description: "Airway pressure in cmH2O", example: 18.5 })
  public pressure: number;

  @ApiProperty({ description: "Flow in L/min", example: 32.1 })
  public flow: number;

  @ApiProperty({ description: "Volume in mL", example: 420 })
  public volume: number;

  @ApiProperty({ description: "pCO2 in mmHg", example: 38, nullable: true, type: Number })
  public pco2: number | null;

  @ApiProperty({ description: "SpO2 in %", example: 97, nullable: true, type: Number })
  public spo2: number | null;

  public constructor(fields: {
    serverTs: number;
    deviceTs: number | null;
    seq: number | null;
    pressure: number;
    flow: number;
    volume: number;
    pco2: number | null;
    spo2: number | null;
  }) {
    this.serverTs = fields.serverTs;
    this.deviceTs = fields.deviceTs;
    this.seq = fields.seq;
    this.pressure = fields.pressure;
    this.flow = fields.flow;
    this.volume = fields.volume;
    this.pco2 = fields.pco2;
    this.spo2 = fields.spo2;
  }
}

export class TelemetryRecordingDTO {
  @ApiProperty({ description: "Recorded reservation", example: "0192f3a4-5b6c-7d8e-9f01-23456789abcd" })
  public reservationId: string;

  @ApiProperty({ description: "Recording sample rate in Hz", example: 20, nullable: true, type: Number })
  public sampleRateHz: number | null;

  @ApiProperty({ description: "Number of stored chunks", example: 12 })
  public chunkCount: number;

  @ApiProperty({ description: "Recorded frames ordered by server time", type: RecordedTelemetryFrameDTO, isArray: true })
  public frames: RecordedTelemetryFrameDTO[];

  public constructor({ reservationId, sampleRateHz, chunkCount, frames }: { reservationId: string; sampleRateHz: number | null; chunkCount: number; frames: RecordedTelemetryFrameDTO[] }) {
    this.reservationId = reservationId;
    this.sampleRateHz = sampleRateHz;
    this.chunkCount = chunkCount;
    this.frames = frames;
  }
}
