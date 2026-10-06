/*
 * Funcionalidad: Mapeador de persistencia LevelRow
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de niveles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Level as LevelModel, type Prisma } from "@prisma/client";

import { Level } from "@/features/levels/domain/entities/level.entity";

export type LevelRow = LevelModel & { prerequisites: { prerequisiteLevelId: string }[] };

export class LevelsMapper {
  public static toDomain(row: LevelRow): Level {
    return Level.reconstitute({
      id: row.id,
      title: row.title,
      track: row.track,
      description: row.description ?? undefined,
      order: row.order,
      isActive: row.isActive,
      status: row.status,
      sectionId: row.sectionId ?? undefined,
      color: row.color ?? undefined,
      tags: row.tags,
      parentId: row.parentId ?? undefined,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      prerequisiteLevelIds: row.prerequisites.map((prerequisite: { prerequisiteLevelId: string }) => prerequisite.prerequisiteLevelId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(level: Level): Prisma.LevelUncheckedCreateInput {
    return {
      id: level.id,
      title: level.title,
      track: level.track,
      description: level.description ?? null,
      order: level.order,
      isActive: level.isActive,
      status: level.status,
      sectionId: level.sectionId ?? null,
      color: level.color ?? null,
      tags: [...level.tags],
      parentId: level.parentId ?? null,
      lastModifiedBy: level.lastModifiedBy ?? null,
      lastModifiedAt: level.lastModifiedAt ?? null,
      createdAt: level.createdAt,
      updatedAt: level.updatedAt,
    };
  }
}
