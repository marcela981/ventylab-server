/*
 * Funcionalidad: Mapeador de persistencia ChangeLogAuthorRow
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ChangeLog as ChangeLogModel, Prisma, type User as UserModel } from "@prisma/client";

import { type ChangeLogDiff, ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";

export type ChangeLogAuthorRow = Pick<UserModel, "id" | "name" | "email" | "role">;

export type ChangeLogRow = ChangeLogModel & { user?: ChangeLogAuthorRow | null };

export class ChangeLogMapper {
  public static toDomain(row: ChangeLogRow): ChangeLogEntry {
    return ChangeLogEntry.reconstitute({
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      changedBy: row.changedBy,
      changedAt: row.changedAt,
      diff: (row.diff as ChangeLogDiff | null) ?? undefined,
      metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
      author: row.user
        ? { id: row.user.id, name: row.user.name ?? undefined, email: row.user.email, role: row.user.role }
        : undefined,
    });
  }

  public static toPersistence(entry: ChangeLogEntry): Prisma.ChangeLogUncheckedCreateInput {
    return {
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      changedBy: entry.changedBy,
      changedAt: entry.changedAt,
      diff: entry.diff ? (entry.diff as Prisma.InputJsonObject) : Prisma.DbNull,
      metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonObject) : Prisma.DbNull,
    };
  }
}
