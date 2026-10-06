/*
 * Funcionalidad: Puerto de repositorio CHANGELOG_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IChangeLogRepository y su token de inyección para la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { type ChangeLogActionValue } from "@/features/changelog/domain/value-objects/change-log-action";
import { type ChangeLogEntityTypeValue } from "@/features/changelog/domain/value-objects/change-log-entity-type";
import { type ChangeLogStats } from "@/features/changelog/domain/value-objects/change-log-stats";

export const CHANGELOG_REPOSITORY_TOKEN: unique symbol = Symbol("CHANGELOG_REPOSITORY_TOKEN");

export interface GetChangeLogQuery extends ListQuery {
  entityType?: ChangeLogEntityTypeValue;
  entityId?: string;
  action?: ChangeLogActionValue;
  changedBy?: string;
}

export interface IChangeLogRepository {
  getAll(query: GetChangeLogQuery, transaction?: unknown): Promise<Paginated<ChangeLogEntry>>;
  getRecent(limit: number, changedBy?: string, transaction?: unknown): Promise<ChangeLogEntry[]>;
  getEntityHistory(entityType: string, entityId: string, changedBy?: string, transaction?: unknown): Promise<ChangeLogEntry[]>;
  getStats(fromDate: Date, toDate: Date, changedBy?: string, transaction?: unknown): Promise<ChangeLogStats>;
  save(entry: ChangeLogEntry, transaction?: unknown): Promise<void>;
}
