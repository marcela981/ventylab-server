/*
 * Funcionalidad: Repositorio de fragmentos de telemetría
 * Descripción: Contrato para guardar y leer, ordenados por tiempo, los fragmentos grabados de una reserva y para leer los titulares de esa reserva (tabla reservations) al autorizar la lectura de la grabación, y para listar las reservas grabadas de un usuario (titular o miembro del grupo titular) en un rango
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetryChunk } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

export const TELEMETRY_CHUNKS_REPOSITORY_TOKEN: unique symbol = Symbol("TELEMETRY_CHUNKS_REPOSITORY_TOKEN");

export interface RecordedReservationHolder {
  readonly id: string;
  readonly holderType: "USER" | "GROUP";
  readonly userId?: string;
  readonly groupId?: string;
  readonly createdById: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface TelemetryRecordingsFilter {
  readonly userId: string;
  readonly from: Date;
  readonly to: Date;
  readonly limit: number;
}

export interface TelemetryRecordingSummary {
  readonly reservationId: string;
  readonly holderType: "USER" | "GROUP";
  readonly groupId?: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: string;
  readonly chunkCount: number;
  readonly sampleRateHz?: number;
}

export interface ITelemetryChunksRepository {
  save(chunk: TelemetryChunk, transaction?: unknown): Promise<void>;
  listByReservation(reservationId: string, transaction?: unknown): Promise<TelemetryChunk[]>;
  getReservationHolder(reservationId: string, transaction?: unknown): Promise<RecordedReservationHolder | undefined>;
  // Reservations held by the user or by a group they belong to, starting in [from, to), with at least one chunk, newest first.
  listRecordingsOfUser(filter: TelemetryRecordingsFilter): Promise<TelemetryRecordingSummary[]>;
}
