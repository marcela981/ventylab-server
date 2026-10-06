/*
 * Funcionalidad: Comando RecordChangeCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ChangeLogDiff } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { type ChangeLogActionValue } from "@/features/changelog/domain/value-objects/change-log-action";
import { type ChangeLogEntityTypeValue } from "@/features/changelog/domain/value-objects/change-log-entity-type";

export class RecordChangeCommand {
  public readonly entityType: ChangeLogEntityTypeValue;
  public readonly entityId: string;
  public readonly action: ChangeLogActionValue;
  public readonly changedBy: string;
  public readonly diff?: ChangeLogDiff;
  public readonly metadata?: Record<string, unknown>;

  public constructor({
    entityType,
    entityId,
    action,
    changedBy,
    diff,
    metadata,
  }: {
    entityType: ChangeLogEntityTypeValue;
    entityId: string;
    action: ChangeLogActionValue;
    changedBy: string;
    diff?: ChangeLogDiff;
    metadata?: Record<string, unknown>;
  }) {
    this.entityType = entityType;
    this.entityId = entityId;
    this.action = action;
    this.changedBy = changedBy;
    this.diff = diff;
    this.metadata = metadata;
  }
}
