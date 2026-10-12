/*
 * Funcionalidad: Mapeador de presentación ChangeLogMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de historial de cambios en DTOs de respuesta; el autor queda vacío cuando su usuario fue eliminado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { type ChangeLogStats } from "@/features/changelog/domain/value-objects/change-log-stats";
import { ChangeLogAuthorDTO, ChangeLogEntryDTO } from "@/features/changelog/presentation/dtos/change-log-entry.dto";
import { ChangeLogStatsDTO } from "@/features/changelog/presentation/dtos/change-log-stats.dto";

export class ChangeLogMapper {
  public static toDTO(entry: ChangeLogEntry): ChangeLogEntryDTO {
    return new ChangeLogEntryDTO({
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      changedBy: entry.changedBy ?? null,
      changedAt: entry.changedAt,
      diff: entry.diff ?? null,
      metadata: entry.metadata ?? null,
      user: entry.author
        ? new ChangeLogAuthorDTO({
          id: entry.author.id,
          name: entry.author.name ?? null,
          email: entry.author.email,
          role: entry.author.role,
        })
        : null,
    });
  }

  public static toDTOList(entries: ChangeLogEntry[]): ChangeLogEntryDTO[] {
    return entries.map((entry: ChangeLogEntry) => ChangeLogMapper.toDTO(entry));
  }

  public static toStatsDTO(stats: ChangeLogStats): ChangeLogStatsDTO {
    return new ChangeLogStatsDTO({
      totalChanges: stats.totalChanges,
      byEntityType: { ...stats.byEntityType },
      byAction: { ...stats.byAction },
    });
  }
}
