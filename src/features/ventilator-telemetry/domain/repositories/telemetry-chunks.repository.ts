/*
 * Funcionalidad: Repositorio de fragmentos de telemetría
 * Descripción: Contrato para guardar y leer, ordenados por tiempo, los fragmentos grabados de una reserva y para leer los titulares de esa reserva (tabla reservations) al autorizar la lectura de la grabación
 * Versión: 1.0
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

export interface ITelemetryChunksRepository {
  save(chunk: TelemetryChunk, transaction?: unknown): Promise<void>;
  listByReservation(reservationId: string, transaction?: unknown): Promise<TelemetryChunk[]>;
  getReservationHolder(reservationId: string, transaction?: unknown): Promise<RecordedReservationHolder | undefined>;
}
