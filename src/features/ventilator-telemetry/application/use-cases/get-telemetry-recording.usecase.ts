/*
 * Funcionalidad: Caso de uso GetTelemetryRecording
 * Descripción: Devuelve las tramas grabadas de una reserva, decodificadas y ordenadas por tiempo, a sus titulares, docentes o administradores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type GetTelemetryRecordingCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import { type ITelemetryChunkCodec, TELEMETRY_CHUNK_CODEC_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-chunk-codec.interface";
import { type TelemetryRecordingResult } from "@/features/ventilator-telemetry/application/results/telemetry-recording.result";
import { TelemetryRecordingAccessService } from "@/features/ventilator-telemetry/application/services/telemetry-recording-access.service";
import { type ITelemetryChunksRepository, TELEMETRY_CHUNKS_REPOSITORY_TOKEN } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { type RecordedTelemetrySample, type TelemetryChunk } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

/**
 * @throws {TelemetryReservationNotFoundError} If the reservation does not exist
 * @throws {TelemetryRecordingForbiddenError} If the user is not a holder of the reservation, a teacher or an administrator
 */
@Injectable()
export class GetTelemetryRecordingUseCase {
  public constructor(
    private readonly _access: TelemetryRecordingAccessService,
    @Inject(TELEMETRY_CHUNKS_REPOSITORY_TOKEN)
    private readonly _chunksRepository: ITelemetryChunksRepository,
    @Inject(TELEMETRY_CHUNK_CODEC_TOKEN)
    private readonly _codec: ITelemetryChunkCodec,
  ) {}

  public async execute(command: GetTelemetryRecordingCommand): Promise<TelemetryRecordingResult> {
    await this._access.authorizeReservation(command.reservationId, command.userId, command.role);

    const chunks: TelemetryChunk[] = await this._chunksRepository.listByReservation(command.reservationId);
    const decoded: RecordedTelemetrySample[][] = await Promise.all(
      chunks.map((chunk: TelemetryChunk): Promise<RecordedTelemetrySample[]> => this._codec.decode(chunk.data)),
    );
    const frames: RecordedTelemetrySample[] = decoded.flat().sort((a: RecordedTelemetrySample, b: RecordedTelemetrySample): number => a.serverTs - b.serverTs);

    return {
      reservationId: command.reservationId,
      sampleRateHz: chunks.length > 0 ? chunks[0].sampleRateHz : undefined,
      chunkCount: chunks.length,
      frames,
    };
  }
}
