/*
 * Funcionalidad: Mapper de persistencia de calificaciones
 * Descripción: Convierte filas Prisma de Score al agregado y el agregado a datos de persistencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type Score as ScoreModel } from "@prisma/client";

import { Score } from "@/features/scores/domain/entities/score.entity";
import { toScoreEntityType } from "@/features/scores/domain/value-objects/score-entity-type";

export class ScoresMapper {
  public static toDomain(row: ScoreModel): Score {
    return Score.reconstitute({
      id: row.id,
      userId: row.userId,
      graderId: row.graderId,
      entityType: toScoreEntityType(row.entityType),
      entityId: row.entityId,
      points: row.points,
      maxPoints: row.maxPoints,
      comments: row.comments ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(score: Score): Prisma.ScoreUncheckedCreateInput {
    return {
      id: score.id,
      userId: score.userId,
      graderId: score.graderId,
      entityType: score.entityType,
      entityId: score.entityId,
      points: score.points,
      maxPoints: score.maxPoints,
      comments: score.comments ?? null,
      createdAt: score.createdAt,
      updatedAt: score.updatedAt,
    };
  }
}
