/*
 * Funcionalidad: Repositorio Prisma de fragmentos de telemetría
 * Descripción: Guarda los TelemetryChunk en telemetry_chunks, los lista por reserva ordenados por inicio y lee en solo lectura los titulares de una reserva desde la tabla reservations
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type TelemetryChunk as TelemetryChunkModel } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ITelemetryChunksRepository, type RecordedReservationHolder } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { type TelemetryChunk } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

const MAX_CHUNKS_PER_RESERVATION: number = 5000;

interface ReservationHolderRow {
  id: string;
  holderType: "USER" | "GROUP";
  userId: string | null;
  groupId: string | null;
  createdById: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class TelemetryChunksPrismaRepository implements ITelemetryChunksRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async save(chunk: TelemetryChunk, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.telemetryChunk.create({
      data: {
        id: chunk.id,
        reservationId: chunk.reservationId,
        startTs: chunk.startTs,
        endTs: chunk.endTs,
        sampleCount: chunk.sampleCount,
        sampleRateHz: chunk.sampleRateHz,
        encoding: chunk.encoding,
        data: new Uint8Array(chunk.data),
        createdAt: chunk.createdAt,
      },
    });
  }

  public async listByReservation(reservationId: string, transaction?: unknown): Promise<TelemetryChunk[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: TelemetryChunkModel[] = await client.telemetryChunk.findMany({
      where: { reservationId },
      orderBy: { startTs: "asc" },
      take: MAX_CHUNKS_PER_RESERVATION,
    });

    return rows.map((row: TelemetryChunkModel): TelemetryChunk => ({
      id: row.id,
      reservationId: row.reservationId,
      startTs: row.startTs,
      endTs: row.endTs,
      sampleCount: row.sampleCount,
      sampleRateHz: row.sampleRateHz,
      encoding: row.encoding,
      data: Buffer.from(row.data),
      createdAt: row.createdAt,
    }));
  }

  public async getReservationHolder(reservationId: string, transaction?: unknown): Promise<RecordedReservationHolder | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ReservationHolderRow | null = await client.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, holderType: true, userId: true, groupId: true, createdById: true, startsAt: true, endsAt: true },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      holderType: row.holderType,
      userId: row.userId ?? undefined,
      groupId: row.groupId ?? undefined,
      createdById: row.createdById,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    };
  }
}
